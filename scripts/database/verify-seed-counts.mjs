import { readSeedData } from "./seed-io.mjs";
import {
  safeErrorMessage,
  withPgClient,
} from "./local-database-utils.mjs";
import {
  createCheckCollector,
  updateVerificationReport,
} from "./verification-report.mjs";

const expectedCounts = {
  p2a_dataset_metadata: 1,
  historical_entities: 21,
  historical_names: 63,
  historical_geometries: 27,
  historical_events: 6,
  historical_people: 4,
  historical_places: 16,
  historical_sources: 9,
  source_claims: 8,
  source_claim_sources: 12,
  historical_routes: 2,
  route_segments: 4,
  environment_snapshots: 3,
  hydrology_snapshots: 5,
  archive_maps: 2,
  educational_stories: 3,
  educational_story_steps: 27,
  educational_questions: 13,
};

const primaryKey = (tableName) =>
  tableName === "source_claim_sources" ? null : "id";

const sorted = (values) =>
  [...values].map(String).sort((left, right) => left.localeCompare(right));

const arraysEqual = (left, right) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

try {
  const seed = await readSeedData();
  const result = await withPgClient(async (client) => {
    const collector = createCheckCollector();
    const actualCounts = {};

    for (const [tableName, expected] of Object.entries(expectedCounts)) {
      const count = await client.query(
        `select count(*)::integer as count from public.${tableName}`
      );
      actualCounts[tableName] = count.rows[0].count;
      collector.check(
        `${tableName} count`,
        count.rows[0].count === expected,
        `${count.rows[0].count}/${expected}`
      );

      const idColumn = primaryKey(tableName);
      if (idColumn) {
        const ids = await client.query(
          `select ${idColumn} from public.${tableName} order by ${idColumn}`
        );
        collector.check(
          `${tableName} stable IDs`,
          arraysEqual(
            sorted(ids.rows.map((row) => row[idColumn])),
            sorted(seed.tables[tableName].map((row) => row[idColumn]))
          )
        );
      }
    }

    const relationshipChecks = await client.query(`
      select
        (select count(*) from public.source_claim_sources x
          left join public.source_claims c on c.id = x.claim_id
          left join public.historical_sources s on s.id = x.source_id
          where c.id is null or s.id is null)::integer as orphan_claim_sources,
        (select count(*) from public.route_segments x
          left join public.historical_routes r on r.id = x.route_id
          where r.id is null)::integer as orphan_route_segments,
        (select count(*) from public.educational_story_steps x
          left join public.educational_stories s on s.id = x.story_id
          where s.id is null)::integer as orphan_story_steps,
        (select count(*) from public.educational_questions x
          left join public.educational_stories s on s.id = x.story_id
          where x.story_id is not null and s.id is null)::integer as orphan_questions,
        (select count(*) from public.archive_maps x
          left join public.historical_sources s on s.id = x.source_id
          where x.source_id is not null and s.id is null)::integer as orphan_archive_maps
    `);
    collector.check(
      "foreign-key relationships",
      Object.values(relationshipChecks.rows[0]).every((count) => count === 0)
    );

    const statuses = await client.query(`
      select table_name, verification_status, count(*)::integer as count
      from (
        select 'historical_entities' as table_name, verification_status from public.historical_entities
        union all select 'historical_names', verification_status from public.historical_names
        union all select 'historical_geometries', verification_status from public.historical_geometries
        union all select 'historical_events', verification_status from public.historical_events
        union all select 'historical_people', verification_status from public.historical_people
        union all select 'historical_places', verification_status from public.historical_places
        union all select 'historical_sources', verification_status from public.historical_sources
        union all select 'source_claims', verification_status from public.source_claims
        union all select 'historical_routes', verification_status from public.historical_routes
        union all select 'route_segments', verification_status from public.route_segments
        union all select 'environment_snapshots', verification_status from public.environment_snapshots
        union all select 'hydrology_snapshots', verification_status from public.hydrology_snapshots
        union all select 'archive_maps', verification_status from public.archive_maps
        union all select 'educational_stories', verification_status from public.educational_stories
        union all select 'educational_questions', verification_status from public.educational_questions
      ) statuses
      group by table_name, verification_status
      order by table_name, verification_status
    `);
    const expectedStatuses = [];
    for (const [tableName, rows] of Object.entries(seed.tables)) {
      if (!rows.some((row) => "verification_status" in row)) continue;
      const counts = new Map();
      for (const row of rows) {
        counts.set(
          row.verification_status,
          (counts.get(row.verification_status) || 0) + 1
        );
      }
      for (const [status, count] of counts) {
        expectedStatuses.push(`${tableName}:${status}:${count}`);
      }
    }
    collector.check(
      "verification statuses preserved",
      arraysEqual(
        statuses.rows.map(
          (row) => `${row.table_name}:${row.verification_status}:${row.count}`
        ),
        expectedStatuses.sort()
      )
    );

    const sourceLicenses = await client.query(`
      select id, license_status
      from public.historical_sources
      order by id
    `);
    collector.check(
      "source license statuses preserved",
      arraysEqual(
        sourceLicenses.rows.map((row) => `${row.id}:${row.license_status}`),
        seed.tables.historical_sources
          .map((row) => `${row.id}:${row.license_status}`)
          .sort()
      )
    );

    const metadata = await client.query(`
      select dataset_version, generated_from, metadata
      from public.p2a_dataset_metadata
      where id = 'historical-dataset'
    `);
    collector.check(
      "dataset version",
      metadata.rows[0]?.dataset_version === seed.datasetVersion,
      metadata.rows[0]?.dataset_version || "missing"
    );
    collector.check(
      "seed provenance",
      metadata.rows[0]?.generated_from === seed.sourceRoot
    );
    collector.check(
      "public metadata flag",
      metadata.rows[0]?.metadata?.public === true
    );
    collector.check(
      "schema version metadata",
      metadata.rows[0]?.metadata?.schemaVersion === seed.schemaVersion
    );

    const total = Object.values(actualCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    collector.check("total seed records", total === 226, `${total}/226`);
    collector.print();

    return {
      passed: collector.passed,
      checks: collector.checks,
      counts: actualCounts,
      total,
      datasetVersion: metadata.rows[0]?.dataset_version || null,
    };
  });

  await updateVerificationReport("seed", result);
  if (!result.passed) process.exitCode = 1;
} catch (error) {
  console.error(`Seed verification failed: ${safeErrorMessage(error)}`);
  await updateVerificationReport("seed", {
    passed: false,
    error: safeErrorMessage(error),
  });
  process.exitCode = 1;
}

