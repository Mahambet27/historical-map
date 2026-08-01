import { writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import LocalHistoricalRepository from "../../src/dataAccess/local/LocalHistoricalRepository.js";
import SupabaseHistoricalRepository from "../../src/dataAccess/supabase/SupabaseHistoricalRepository.js";
import {
  assertLocalDatabase,
  getLocalSupabaseStatus,
  projectRoot,
  safeErrorMessage,
} from "./local-database-utils.mjs";
import { readSeedData } from "./seed-io.mjs";
import { updateVerificationReport } from "./verification-report.mjs";

const reportPath = path.join(
  projectRoot,
  "docs",
  "P2A5_REPOSITORY_PARITY_REPORT.md"
);
const bbox = [40, 35, 100, 75];
const years = [1465, 1511, 1991];

const ids = (rows) =>
  [...(rows || [])].map((row) => String(row.id)).sort((a, b) => a.localeCompare(b));

const arrayEquals = (left, right) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

const compareIds = (differences, scope, localRows, databaseRows) => {
  const localIds = ids(localRows);
  const databaseIds = ids(databaseRows);
  if (!arrayEquals(localIds, databaseIds)) {
    differences.push({
      scope,
      local: localIds,
      database: databaseIds,
    });
  }
};

const compareCriticalFields = (
  differences,
  scope,
  localRows,
  databaseRows,
  fields
) => {
  const databaseById = new Map(databaseRows.map((row) => [row.id, row]));
  for (const localRow of localRows) {
    const databaseRow = databaseById.get(localRow.id);
    if (!databaseRow) continue;
    for (const field of fields) {
      const left = JSON.stringify(localRow[field] ?? null);
      const right = JSON.stringify(databaseRow[field] ?? null);
      if (left !== right) {
        differences.push({
          scope: `${scope}.${localRow.id}.${field}`,
          local: left,
          database: right,
        });
      }
    }
  }
};

const writeReport = async (result) => {
  const detailRows = result.differences
    .map(
      (difference) =>
        `| \`${difference.scope}\` | ${String(difference.local).slice(
          0,
          160
        )} | ${String(difference.database).slice(0, 160)} |`
    )
    .join("\n");
  const content = `# P2A.5 Repository Parity Report

Date: ${new Date().toISOString()}

Overall status: **${result.passed ? "passed" : "failed"}**

Compared years: ${years.join(", ")}

Compared domain fields:

- stable IDs for entities, geometries, places, routes, segments, environment and hydrology;
- verification status, confidence and source relations;
- geometry types and place coordinates;
- claim/source relationships;
- story, step and question IDs.

Documented adapter difference: local \`entityLabels\` remains a local-only
presentation dataset. The database snapshot derives language names from
\`historical_names\`, so label object shape and ordering are intentionally not
compared.

| Scope | Local | Database |
| --- | --- | --- |
${detailRows || "| All compared scopes | match | match |"}

${result.error ? `Error: \`${result.error}\`` : ""}
`;
  await writeFile(reportPath, content, "utf8");
};

try {
  const status = await getLocalSupabaseStatus();
  process.env.P2A_LOCAL_SUPABASE_URL = status.apiUrl;
  await assertLocalDatabase({ requireApiUrl: true });
  if (!status.anonKey) {
    throw new Error("Local anonymous key is unavailable from Supabase status.");
  }
  const client = createClient(status.apiUrl, status.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const localRepository = new LocalHistoricalRepository();
  const databaseRepository = new SupabaseHistoricalRepository(client, {
    timeoutMs: 10_000,
  });
  const differences = [];

  await databaseRepository.healthCheck();
  for (const year of years) {
    const options = { year, bbox, language: "ru", limit: 500 };
    const [local, database] = await Promise.all([
      localRepository.getSnapshot(options),
      databaseRepository.getSnapshot(options),
    ]);
    compareIds(differences, `${year}.entities`, local.entities, database.entities);
    compareIds(
      differences,
      `${year}.geometries`,
      local.geometries,
      database.geometries
    );
    compareIds(differences, `${year}.places`, local.places, database.places);
    compareIds(
      differences,
      `${year}.routes`,
      local.routes.routes,
      database.routes.routes
    );
    compareIds(
      differences,
      `${year}.routeSegments`,
      local.routes.segments,
      database.routes.segments
    );
    compareIds(
      differences,
      `${year}.environment`,
      local.environment,
      database.environment
    );
    compareIds(
      differences,
      `${year}.hydrology`,
      local.hydrology,
      database.hydrology
    );
    compareCriticalFields(
      differences,
      `${year}.geometries`,
      local.geometries,
      database.geometries,
      ["verificationStatus", "confidenceLevel", "sourceIds"]
    );
    compareCriticalFields(
      differences,
      `${year}.places`,
      local.places,
      database.places,
      [
        "coordinates",
        "verificationStatus",
        "confidenceLevel",
        "sourceIds",
      ]
    );
    compareCriticalFields(
      differences,
      `${year}.routes`,
      local.routes.routes,
      database.routes.routes,
      ["verificationStatus", "confidenceLevel", "sourceIds"]
    );
  }

  const seed = await readSeedData();
  for (const claim of seed.tables.source_claims) {
    const [local, database] = await Promise.all([
      localRepository.getEvidence(claim.subject_type, claim.subject_id),
      databaseRepository.getEvidence(claim.subject_type, claim.subject_id),
    ]);
    compareIds(
      differences,
      `evidence.${claim.id}.claims`,
      local.claims,
      database.claims
    );
    compareIds(
      differences,
      `evidence.${claim.id}.sources`,
      local.sources,
      database.sources
    );
  }

  for (const expectedStory of seed.tables.educational_stories) {
    const [local, database] = await Promise.all([
      localRepository.getStory(expectedStory.id),
      databaseRepository.getStory(expectedStory.id),
    ]);
    if (!local || !database) {
      differences.push({
        scope: `story.${expectedStory.id}`,
        local: Boolean(local),
        database: Boolean(database),
      });
      continue;
    }
    compareIds(
      differences,
      `story.${expectedStory.id}.steps`,
      local.steps,
      database.steps
    );
    compareIds(
      differences,
      `story.${expectedStory.id}.questions`,
      local.questions,
      database.questions
    );
  }

  const result = {
    passed: differences.length === 0,
    differenceCount: differences.length,
    differences,
    comparedYears: years,
  };
  console.log(
    `Repository parity: ${result.passed ? "passed" : "failed"}; differences ${differences.length}`
  );
  await writeReport(result);
  await updateVerificationReport("parity", result);
  if (!result.passed) process.exitCode = 1;
} catch (error) {
  const safeMessage = safeErrorMessage(error);
  console.error(`Repository parity failed: ${safeMessage}`);
  const result = { passed: false, error: safeMessage, differences: [] };
  await writeReport(result);
  await updateVerificationReport("parity", result);
  process.exitCode = 1;
}

