import { validateGeometryTables } from "./geometry-validation.mjs";
import {
  ensureSeedDirectory,
  readSeedData,
  seedReportPath,
  stableStringify,
  writeIfChanged,
} from "./seed-io.mjs";

const seedData = await readSeedData();
const errors = [];
const warnings = [];
const statuses = new Set([
  "verified",
  "reviewed",
  "needs_review",
  "demo_only",
  "disputed",
]);

const add = (target, code, table, id, message) =>
  target.push({ code, table, id: id || null, message });

for (const [table, records] of Object.entries(seedData.tables)) {
  const ids = new Set();
  records.forEach((record) => {
    const key =
      table === "source_claim_sources"
        ? `${record.claim_id}:${record.source_id}`
        : record.id;
    if (!key) add(errors, "missing_id", table, null, "Stable ID is required.");
    if (ids.has(key)) add(errors, "duplicate_id", table, key, "Duplicate stable ID.");
    ids.add(key);
    if (
      "verification_status" in record &&
      !statuses.has(record.verification_status)
    ) {
      add(
        errors,
        "invalid_verification_status",
        table,
        key,
        String(record.verification_status)
      );
    }
    if (
      record.valid_from_year != null &&
      record.valid_to_year != null &&
      record.valid_to_year < record.valid_from_year
    ) {
      add(errors, "reversed_year_range", table, key, "End precedes start.");
    }
  });
}

const sourceIds = new Set(
  seedData.tables.historical_sources.map((record) => record.id)
);
const claimIds = new Set(seedData.tables.source_claims.map((record) => record.id));
const routeIds = new Set(
  seedData.tables.historical_routes.map((record) => record.id)
);
const storyIds = new Set(
  seedData.tables.educational_stories.map((record) => record.id)
);

seedData.tables.source_claim_sources.forEach((relation) => {
  if (!claimIds.has(relation.claim_id)) {
    add(errors, "unknown_claim", "source_claim_sources", relation.claim_id, "");
  }
  if (!sourceIds.has(relation.source_id)) {
    add(errors, "unknown_source", "source_claim_sources", relation.source_id, "");
  }
});
seedData.tables.source_claims.forEach((claim) => {
  const links = seedData.tables.source_claim_sources.filter(
    (relation) => relation.claim_id === claim.id
  );
  if (["verified", "reviewed"].includes(claim.verification_status) && links.length === 0) {
    add(errors, "reviewed_claim_without_source", "source_claims", claim.id, "");
  }
});
seedData.tables.route_segments.forEach((segment) => {
  if (!routeIds.has(segment.route_id)) {
    add(errors, "unknown_route", "route_segments", segment.id, segment.route_id);
  }
});
seedData.tables.educational_story_steps.forEach((step) => {
  if (!storyIds.has(step.story_id)) {
    add(errors, "unknown_story", "educational_story_steps", step.id, step.story_id);
  }
});
seedData.tables.educational_questions.forEach((question) => {
  if (question.story_id && !storyIds.has(question.story_id)) {
    add(errors, "unknown_story", "educational_questions", question.id, question.story_id);
  }
});
seedData.tables.archive_maps.forEach((map) => {
  const license = map.license?.status;
  if (!license) add(errors, "missing_license", "archive_maps", map.id, "");
  if (
    ["restricted", "unknown"].includes(license) &&
    map.metadata?.public === false
  ) {
    add(
      warnings,
      "private_archive_metadata",
      "archive_maps",
      map.id,
      "Record will not be visible to anonymous users."
    );
  }
});

const geometry = validateGeometryTables(seedData);
geometry.issues.forEach((item) =>
  add(
    item.severity === "error" ? errors : warnings,
    item.code,
    "geometry",
    item.geometryId,
    item.recommendation
  )
);

const sourceCount = (table, record) => {
  if (Array.isArray(record.source_ids)) return record.source_ids.length;
  if (Array.isArray(record.metadata?.sourceIds)) {
    return record.metadata.sourceIds.length;
  }
  if (table === "source_claims") {
    return seedData.tables.source_claim_sources.filter(
      (relation) => relation.claim_id === record.id
    ).length;
  }
  if (table === "archive_maps") return record.source_id ? 1 : 0;
  if (record.source_id) return 1;
  return 0;
};

const mapping = Object.entries(seedData.tables)
  .filter(([table]) => table !== "p2a_dataset_metadata")
  .map(([table, records]) => ({
    dataset: table,
    records: records.length,
    recordsWithSources: records.filter((record) => sourceCount(table, record) > 0)
      .length,
    recordsWithoutSources: records.filter((record) => sourceCount(table, record) === 0)
      .length,
    verified: records.filter((record) => record.verification_status === "verified")
      .length,
    reviewed: records.filter((record) => record.verification_status === "reviewed")
      .length,
    needsReview: records.filter(
      (record) => record.verification_status === "needs_review"
    ).length,
    demoOnly: records.filter((record) => record.verification_status === "demo_only")
      .length,
    imported: records.length,
    skipped: 0,
    reason: "",
  }));

const report = {
  datasetVersion: seedData.datasetVersion,
  valid: errors.length === 0,
  totals: {
    records: Object.values(seedData.tables).reduce(
      (total, records) => total + records.length,
      0
    ),
    errors: errors.length,
    warnings: warnings.length,
    geometryRecords: geometry.records,
  },
  tables: Object.fromEntries(
    Object.entries(seedData.tables).map(([table, records]) => [
      table,
      records.length,
    ])
  ),
  mapping,
  skippedRecords: seedData.skippedDatasets,
  errors,
  warnings,
};

await ensureSeedDirectory();
const changed = await writeIfChanged(seedReportPath, stableStringify(report));
console.log(
  `P2A seed validation: ${errors.length} errors, ${warnings.length} warnings, report ${
    changed ? "updated" : "unchanged"
  }`
);
if (errors.length) process.exitCode = 1;
