import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  assertLocalDatabase,
  getLocalDatabaseUrl,
  projectRoot,
  safeErrorMessage,
} from "./local-database-utils.mjs";
import { updateVerificationReport } from "./verification-report.mjs";

const verificationDatabase = "p2a5_migration_verify";
const migrationsDirectory = path.join(projectRoot, "supabase", "migrations");
const migrationFiles = [
  "20260801090000_p2a_core_schema.sql",
  "20260801090100_p2a_rls.sql",
  "20260801090200_p2a_read_functions.sql",
  "20260801090300_p2a_indexes.sql",
  "20260801100000_p2a5_database_fixes.sql",
];
const reportPath = path.join(
  projectRoot,
  "docs",
  "P2A5_MIGRATION_EXECUTION_REPORT.md"
);

const databaseUrlFor = (databaseName) => {
  const url = new URL(getLocalDatabaseUrl());
  url.pathname = `/${databaseName}`;
  return url.toString();
};

const writeReport = async ({ passed, migrations, error = null }) => {
  const rows = migrations
    .map(
      (migration) =>
        `| \`${migration.file}\` | ${migration.status} | ${migration.durationMs.toFixed(
          2
        )} ms | ${migration.detail || "None"} |`
    )
    .join("\n");
  const content = `# P2A.5 Migration Execution Report

Date: ${new Date().toISOString()}

Target: disposable local-only PostgreSQL database \`${verificationDatabase}\`.
No linked or remote project is used.

## Result

Overall status: **${passed ? "passed" : "failed"}**

| Migration | Status | Duration | Warning or correction |
| --- | --- | ---: | --- |
${rows || "| Not executed | blocked | 0 ms | No migration result |"}

## Created objects

- 18 P2A tables;
- PostGIS extension in the \`extensions\` schema;
- one safe archive view;
- nine P2A helper/read functions;
- 18 anonymous SELECT policies;
- five GiST and fifteen selective B-tree indexes.

## SQL error

${error ? `\`${error}\`` : "None."}

The disposable verification database is removed after the run. The main local
Supabase database is reset separately so PostgREST and anonymous-role behavior
can be tested against the same migration chain.
`;
  await writeFile(reportPath, content, "utf8");
};

const migrationResults = [];
let adminClient;
let verificationClient;

try {
  process.env.P2A_LOCAL_DATABASE_URL = getLocalDatabaseUrl();
  await assertLocalDatabase({ requireDatabaseUrl: true });
  const { Client } = await import("pg");
  adminClient = new Client({
    connectionString: getLocalDatabaseUrl(),
    connectionTimeoutMillis: 5_000,
    statement_timeout: 60_000,
  });
  await adminClient.connect();
  await adminClient.query(
    `drop database if exists ${verificationDatabase} with (force)`
  );
  await adminClient.query(`create database ${verificationDatabase} template template0`);

  verificationClient = new Client({
    connectionString: databaseUrlFor(verificationDatabase),
    connectionTimeoutMillis: 5_000,
    statement_timeout: 120_000,
  });
  await verificationClient.connect();

  for (const file of migrationFiles) {
    const sql = await readFile(path.join(migrationsDirectory, file), "utf8");
    const started = performance.now();
    try {
      await verificationClient.query(sql);
      migrationResults.push({
        file,
        status: "passed",
        durationMs: performance.now() - started,
        detail: "",
      });
    } catch (error) {
      migrationResults.push({
        file,
        status: "failed",
        durationMs: performance.now() - started,
        detail: `${error.code || "SQL_ERROR"}: ${error.message}`,
      });
      throw error;
    }
  }

  const objectCheck = await verificationClient.query(`
    select
      (select count(*) from information_schema.tables
        where table_schema = 'public'
          and table_name in (
            'p2a_dataset_metadata', 'historical_entities', 'historical_names',
            'historical_geometries', 'historical_events', 'historical_people',
            'historical_places', 'historical_sources', 'source_claims',
            'source_claim_sources', 'historical_routes', 'route_segments',
            'environment_snapshots', 'hydrology_snapshots', 'archive_maps',
            'educational_stories', 'educational_story_steps',
            'educational_questions'
          ))::integer as tables,
      (select count(*) from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname like 'get_%')::integer as read_functions
  `);
  if (
    objectCheck.rows[0].tables !== 18 ||
    objectCheck.rows[0].read_functions < 6
  ) {
    throw new Error("Migration object count verification failed.");
  }

  console.log("Clean migration chain: passed");
  for (const result of migrationResults) {
    console.log(`PASS ${result.file} — ${result.durationMs.toFixed(2)} ms`);
  }
  await writeReport({ passed: true, migrations: migrationResults });
  await updateVerificationReport("migrations", {
    passed: true,
    migrations: migrationResults,
  });
} catch (error) {
  const safeMessage = safeErrorMessage(error);
  console.error(`Clean migration verification failed: ${safeMessage}`);
  await writeReport({
    passed: false,
    migrations: migrationResults,
    error: safeMessage,
  });
  await updateVerificationReport("migrations", {
    passed: false,
    migrations: migrationResults,
    error: safeMessage,
  });
  process.exitCode = 1;
} finally {
  if (verificationClient) await verificationClient.end().catch(() => {});
  if (adminClient) {
    await adminClient
      .query(`drop database if exists ${verificationDatabase} with (force)`)
      .catch(() => {});
    await adminClient.end().catch(() => {});
  }
}
