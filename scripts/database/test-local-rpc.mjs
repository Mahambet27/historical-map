import { createClient } from "@supabase/supabase-js";

import {
  assertLocalDatabase,
  getLocalSupabaseStatus,
  safeErrorMessage,
} from "./local-database-utils.mjs";
import {
  createCheckCollector,
  updateVerificationReport,
} from "./verification-report.mjs";

const years = [-700, 552, 1465, 1511, 1521, 1936, 1960, 1991, 2026];
const kazakhstanBbox = [40, 35, 100, 75];
const smallBbox = [68, 41, 74, 47];
const emptyBbox = [-10, -10, -5, -5];

const snapshotArgs = (year, bbox = kazakhstanBbox, language = "ru") => ({
  p_year: year,
  p_west: bbox[0],
  p_south: bbox[1],
  p_east: bbox[2],
  p_north: bbox[3],
  p_language: language,
});

const requireSuccess = (result, label) => {
  if (result.error) {
    const error = new Error(`${label} returned an API error.`);
    error.code = result.error.code;
    throw error;
  }
  return result.data;
};

const expectsError = async (operation) => {
  const result = await operation();
  return Boolean(result.error);
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
  const collector = createCheckCollector();
  let latestRecordCount = 0;
  let latestPayloadBytes = 0;
  let latestDurationMs = 0;

  const health = requireSuccess(
    await client.rpc("get_p2a_dataset_status"),
    "dataset health"
  );
  collector.check(
    "real anonymous health/dataset metadata",
    health?.datasetVersion === "p2a-2026-08" &&
      health?.schemaVersion === 1 &&
      health?.public === true
  );

  for (const year of years) {
    const started = performance.now();
    const snapshot = requireSuccess(
      await client.rpc("get_exhibition_snapshot", snapshotArgs(year)),
      `snapshot ${year}`
    );
    latestDurationMs = performance.now() - started;
    const arrays = [
      snapshot.entities,
      snapshot.geometries,
      snapshot.places,
      snapshot.environment,
      snapshot.hydrology,
      snapshot.labels,
      snapshot.routes?.routes,
      snapshot.routes?.segments,
    ];
    const validShape =
      snapshot.year === year &&
      snapshot.datasetVersion === "p2a-2026-08" &&
      arrays.every(Array.isArray);
    latestRecordCount = arrays.reduce(
      (total, rows) => total + (rows?.length || 0),
      0
    );
    latestPayloadBytes = Buffer.byteLength(JSON.stringify(snapshot), "utf8");
    collector.check(
      `snapshot year ${year}`,
      validShape && latestRecordCount <= 3500,
      `${latestRecordCount} records`
    );
  }

  const broadSnapshot = requireSuccess(
    await client.rpc("get_exhibition_snapshot", snapshotArgs(1465)),
    "broad snapshot"
  );
  const smallSnapshot = requireSuccess(
    await client.rpc("get_exhibition_snapshot", snapshotArgs(1465, smallBbox)),
    "small snapshot"
  );
  const noObjectSnapshot = requireSuccess(
    await client.rpc("get_exhibition_snapshot", snapshotArgs(1465, emptyBbox)),
    "empty snapshot"
  );
  collector.check(
    "small bbox is bounded",
    smallSnapshot.geometries.length <= broadSnapshot.geometries.length &&
      smallSnapshot.places.length <= broadSnapshot.places.length
  );
  collector.check(
    "bbox without spatial objects",
    noObjectSnapshot.geometries.length === 0 &&
      noObjectSnapshot.places.length === 0 &&
      noObjectSnapshot.environment.length === 0 &&
      noObjectSnapshot.hydrology.length === 0
  );

  const invalidBboxes = [
    [80, 40, 70, 50],
    [170, -10, -170, 10],
    [-180, -90, 180, 90],
    [-181, 40, 70, 50],
  ];
  for (const [index, bbox] of invalidBboxes.entries()) {
    collector.check(
      `invalid bbox ${index + 1} rejected`,
      await expectsError(() =>
        client.rpc("get_exhibition_snapshot", snapshotArgs(1465, bbox))
      )
    );
  }
  collector.check(
    "invalid language rejected",
    await expectsError(() =>
      client.rpc("get_exhibition_snapshot", snapshotArgs(1465, smallBbox, "de"))
    )
  );

  const geometryRows = requireSuccess(
    await client.rpc("get_historical_geometries", {
      p_year: 1465,
      p_west: kazakhstanBbox[0],
      p_south: kazakhstanBbox[1],
      p_east: kazakhstanBbox[2],
      p_north: kazakhstanBbox[3],
    }),
    "historical geometries"
  );
  collector.check(
    "geometry RPC response",
    Array.isArray(geometryRows) &&
      geometryRows.every(
        (row) =>
          row.geojson?.type &&
          row.verification_status &&
          Array.isArray(row.source_ids)
      )
  );

  const placeRows = requireSuccess(
    await client.rpc("get_historical_places", {
      p_year: 1465,
      p_west: kazakhstanBbox[0],
      p_south: kazakhstanBbox[1],
      p_east: kazakhstanBbox[2],
      p_north: kazakhstanBbox[3],
      p_place_types: null,
      p_limit: 100_000,
    }),
    "historical places"
  );
  collector.check(
    "place RPC limit capped",
    Array.isArray(placeRows) && placeRows.length <= 500
  );

  const routes = requireSuccess(
    await client.rpc("get_historical_routes", { p_year: 1465 }),
    "historical routes"
  );
  collector.check(
    "route RPC response",
    Array.isArray(routes.routes) &&
      Array.isArray(routes.segments) &&
      Array.isArray(routes.places)
  );

  const evidence = requireSuccess(
    await client.rpc("get_subject_evidence", {
      p_subject_type: "entity",
      p_subject_id: "kazakh-khanate",
    }),
    "subject evidence"
  );
  collector.check(
    "evidence RPC response and source relations",
    Array.isArray(evidence.claims) &&
      evidence.claims.every(
        (claim) =>
          !Object.hasOwn(claim, "reviewed_by") && Array.isArray(claim.sources)
      )
  );
  const unknownEvidence = requireSuccess(
    await client.rpc("get_subject_evidence", {
      p_subject_type: "entity",
      p_subject_id: "__unknown_subject__",
    }),
    "unknown evidence"
  );
  collector.check(
    "unknown subject returns bounded empty evidence",
    unknownEvidence.claims?.length === 0
  );

  const story = requireSuccess(
    await client.rpc("get_educational_story", {
      p_story_id: "historical-evidence",
    }),
    "educational story"
  );
  collector.check(
    "story RPC response",
    story.story?.id === "historical-evidence" &&
      Array.isArray(story.steps) &&
      Array.isArray(story.questions)
  );
  const unknownStory = requireSuccess(
    await client.rpc("get_educational_story", {
      p_story_id: "__unknown_story__",
    }),
    "unknown story"
  );
  collector.check(
    "unknown story returns empty object",
    unknownStory && Object.keys(unknownStory).length === 0
  );

  collector.check(
    "archive base table denied to anonymous client",
    await expectsError(() => client.from("archive_maps").select("id").limit(1))
  );
  const safeArchives = requireSuccess(
    await client
      .from("p2a_public_archive_maps")
      .select("id,image_url,georeference_data,license")
      .limit(200),
    "safe archive view"
  );
  collector.check(
    "unknown archive fields masked",
    safeArchives
      .filter((row) => row.license?.status === "unknown")
      .every(
        (row) =>
          row.image_url == null &&
          row.georeference_data &&
          Object.keys(row.georeference_data).length === 0
      )
  );

  const writeTables = [
    ["historical_entities", { id: "__p2a_anon_write_test" }],
    ["historical_geometries", { id: "__p2a_anon_write_test" }],
    ["historical_sources", { id: "__p2a_anon_write_test" }],
    ["source_claims", { id: "__p2a_anon_write_test" }],
    ["archive_maps", { id: "__p2a_anon_write_test" }],
  ];
  for (const [tableName, row] of writeTables) {
    collector.check(
      `${tableName} anonymous INSERT denied`,
      await expectsError(() => client.from(tableName).insert(row))
    );
    collector.check(
      `${tableName} anonymous UPDATE denied`,
      await expectsError(() =>
        client
          .from(tableName)
          .update({ id: "__p2a_anon_write_test_updated" })
          .eq("id", "__p2a_anon_write_test")
      )
    );
    collector.check(
      `${tableName} anonymous DELETE denied`,
      await expectsError(() =>
        client.from(tableName).delete().eq("id", "__p2a_anon_write_test")
      )
    );
  }

  collector.print();
  const result = {
    passed: collector.passed,
    checks: collector.checks,
    years,
    lastActualQueryDurationMs: latestDurationMs,
    lastRecordsReturned: latestRecordCount,
    lastPayloadBytes: latestPayloadBytes,
    datasetVersion: health?.datasetVersion || null,
  };
  await updateVerificationReport("rpc", result);
  if (!result.passed) process.exitCode = 1;
} catch (error) {
  console.error(`Local RPC verification failed: ${safeErrorMessage(error)}`);
  await updateVerificationReport("rpc", {
    passed: false,
    error: safeErrorMessage(error),
  });
  process.exitCode = 1;
}
