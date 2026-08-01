import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  projectRoot,
  safeErrorMessage,
  withPgClient,
} from "./local-database-utils.mjs";
import { updateVerificationReport } from "./verification-report.mjs";

const seedPath = path.join(projectRoot, "supabase", "seed", "p2a_seed.sql");
const reportPath = path.join(
  projectRoot,
  "docs",
  "P2A5_SEED_IDEMPOTENCY_REPORT.md"
);
const tables = [
  "p2a_dataset_metadata",
  "historical_entities",
  "historical_names",
  "historical_geometries",
  "historical_events",
  "historical_people",
  "historical_places",
  "historical_sources",
  "source_claims",
  "source_claim_sources",
  "historical_routes",
  "route_segments",
  "environment_snapshots",
  "hydrology_snapshots",
  "archive_maps",
  "educational_stories",
  "educational_story_steps",
  "educational_questions",
];

const stateFor = async (client) => {
  const state = {};
  for (const tableName of tables) {
    const orderExpression =
      tableName === "source_claim_sources"
        ? "claim_id || ':' || source_id"
        : "id";
    const result = await client.query(`
      select
        count(*)::integer as count,
        md5(coalesce(string_agg(
          (to_jsonb(t) - 'created_at' - 'updated_at')::text,
          '|' order by ${orderExpression}
        ), '')) as digest
      from public.${tableName} t
    `);
    state[tableName] = result.rows[0];
  }
  return state;
};

const equalStates = (left, right) =>
  tables.every(
    (tableName) =>
      left[tableName].count === right[tableName].count &&
      left[tableName].digest === right[tableName].digest
  );

const writeReport = async (result) => {
  const countRows = Object.entries(result.afterSecond || {})
    .map(
      ([tableName, state]) =>
        `| \`${tableName}\` | ${state.count} | unchanged |`
    )
    .join("\n");
  const content = `# P2A.5 Seed Idempotency Report

Date: ${new Date().toISOString()}

Overall status: **${result.passed ? "passed" : "failed"}**

- First seed duration: ${result.firstDurationMs?.toFixed(2) || "not measured"} ms
- Second seed duration: ${result.secondDurationMs?.toFixed(2) || "not measured"} ms
- Counts unchanged after first application: ${result.firstStable ? "yes" : "no"}
- Counts and logical row digests unchanged after second application: ${
    result.secondStable ? "yes" : "no"
  }
- Duplicate-key errors: ${result.error ? "verification failed" : "none"}
- Dataset version: ${result.datasetVersion || "not read"}

| Table | Rows | Second application |
| --- | ---: | --- |
${countRows || "| Not verified | 0 | blocked |"}

${result.error ? `SQL error: \`${result.error}\`` : ""}
`;
  await writeFile(reportPath, content, "utf8");
};

try {
  const sql = await readFile(seedPath, "utf8");
  const result = await withPgClient(async (client) => {
    const before = await stateFor(client);
    const firstStarted = performance.now();
    await client.query(sql);
    const firstDurationMs = performance.now() - firstStarted;
    const afterFirst = await stateFor(client);
    const secondStarted = performance.now();
    await client.query(sql);
    const secondDurationMs = performance.now() - secondStarted;
    const afterSecond = await stateFor(client);
    const metadata = await client.query(`
      select dataset_version
      from public.p2a_dataset_metadata
      where id = 'historical-dataset'
    `);
    return {
      passed: equalStates(afterFirst, afterSecond),
      firstStable:
        Object.values(before).every((state) => state.count === 0) ||
        equalStates(before, afterFirst),
      secondStable: equalStates(afterFirst, afterSecond),
      firstDurationMs,
      secondDurationMs,
      afterSecond,
      datasetVersion: metadata.rows[0]?.dataset_version || null,
    };
  });
  console.log(
    `Seed idempotency: ${result.passed ? "passed" : "failed"}; second run ${result.secondDurationMs.toFixed(
      2
    )} ms`
  );
  await writeReport(result);
  await updateVerificationReport("seedIdempotency", result);
  if (!result.passed) process.exitCode = 1;
} catch (error) {
  const safeMessage = safeErrorMessage(error);
  console.error(`Seed idempotency verification failed: ${safeMessage}`);
  const result = { passed: false, error: safeMessage };
  await writeReport(result);
  await updateVerificationReport("seedIdempotency", result);
  process.exitCode = 1;
}

