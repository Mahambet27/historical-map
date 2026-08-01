import {
  ensureSeedDirectory,
  readSeedData,
  seedSqlPath,
  writeIfChanged,
} from "./seed-io.mjs";

const JSON_COLUMNS = new Set([
  "summary",
  "metadata",
  "titles",
  "descriptions",
  "names",
  "claim_value",
  "labels",
  "interpretation_notes",
  "notes",
  "institution",
  "georeference_data",
  "license",
  "camera",
  "narration",
  "simple_narration",
  "options",
  "answer",
  "explanations",
]);
const ARRAY_COLUMNS = new Set([
  "entity_ids",
  "person_ids",
  "place_ids",
  "event_ids",
  "route_ids",
  "source_ids",
  "place_types",
]);
const GEOMETRY_COLUMNS = new Set(["geometry", "point"]);

const quoteText = (value) => `'${String(value).replaceAll("'", "''")}'`;
const sqlValue = (column, value) => {
  if (value == null) return "null";
  if (GEOMETRY_COLUMNS.has(column)) {
    return `extensions.st_setsrid(extensions.st_geomfromgeojson(${quoteText(
      JSON.stringify(value)
    )}), 4326)`;
  }
  if (JSON_COLUMNS.has(column)) {
    return `${quoteText(JSON.stringify(value))}::jsonb`;
  }
  if (ARRAY_COLUMNS.has(column)) {
    if (!value.length) return "'{}'::text[]";
    return `array[${value.map(quoteText).join(", ")}]::text[]`;
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return quoteText(value);
};

const TABLE_CONFIG = {
  p2a_dataset_metadata: {
    columns: ["id", "dataset_version", "generated_from", "metadata"],
    conflict: ["id"],
  },
  historical_entities: {
    columns: [
      "id",
      "entity_type",
      "default_name",
      "summary",
      "valid_from_year",
      "valid_to_year",
      "confidence_level",
      "verification_status",
      "metadata",
    ],
    conflict: ["id"],
  },
  historical_names: {
    columns: [
      "id",
      "subject_type",
      "subject_id",
      "language",
      "name",
      "valid_from_year",
      "valid_to_year",
      "name_type",
      "source_ids",
      "verification_status",
    ],
    conflict: ["id"],
  },
  historical_geometries: {
    columns: [
      "id",
      "subject_type",
      "subject_id",
      "geometry_type",
      "geometry",
      "valid_from_year",
      "valid_to_year",
      "confidence_level",
      "verification_status",
      "reconstruction_method",
      "source_ids",
      "metadata",
    ],
    rename: { geometry: "geom" },
    conflict: ["id"],
  },
  historical_events: {
    columns: [
      "id",
      "titles",
      "descriptions",
      "event_type",
      "start_year",
      "end_year",
      "entity_ids",
      "person_ids",
      "place_ids",
      "source_ids",
      "confidence_level",
      "verification_status",
      "metadata",
    ],
    conflict: ["id"],
  },
  historical_people: {
    columns: [
      "id",
      "names",
      "descriptions",
      "birth_year",
      "death_year",
      "entity_ids",
      "event_ids",
      "source_ids",
      "confidence_level",
      "verification_status",
      "metadata",
    ],
    conflict: ["id"],
  },
  historical_places: {
    columns: [
      "id",
      "place_types",
      "names",
      "point",
      "coordinate_precision",
      "valid_from_year",
      "valid_to_year",
      "entity_ids",
      "event_ids",
      "route_ids",
      "source_ids",
      "confidence_level",
      "verification_status",
      "metadata",
    ],
    conflict: ["id"],
  },
  historical_sources: {
    columns: [
      "id",
      "titles",
      "author",
      "institution",
      "publisher",
      "publication_year",
      "source_type",
      "url",
      "license_status",
      "verification_status",
      "metadata",
    ],
    conflict: ["id"],
  },
  source_claims: {
    columns: [
      "id",
      "subject_type",
      "subject_id",
      "predicate",
      "value_type",
      "claim_value",
      "labels",
      "evidence_type",
      "confidence_level",
      "verification_status",
      "interpretation_notes",
      "reviewed_by",
      "reviewed_at",
      "metadata",
    ],
    conflict: ["id"],
  },
  source_claim_sources: {
    columns: ["claim_id", "source_id", "relation_type", "notes"],
    conflict: ["claim_id", "source_id"],
  },
  historical_routes: {
    columns: [
      "id",
      "route_type",
      "names",
      "descriptions",
      "valid_from_year",
      "valid_to_year",
      "confidence_level",
      "verification_status",
      "source_ids",
      "metadata",
    ],
    conflict: ["id"],
  },
  route_segments: {
    columns: [
      "id",
      "route_id",
      "segment_order",
      "from_place_id",
      "to_place_id",
      "geometry",
      "valid_from_year",
      "valid_to_year",
      "mode",
      "season",
      "confidence_level",
      "verification_status",
      "source_ids",
      "metadata",
    ],
    rename: { geometry: "geom" },
    conflict: ["id"],
  },
  environment_snapshots: {
    columns: [
      "id",
      "environment_type",
      "names",
      "descriptions",
      "geometry",
      "valid_from_year",
      "valid_to_year",
      "interpolation_allowed",
      "source_ids",
      "confidence_level",
      "verification_status",
      "metadata",
    ],
    rename: { geometry: "geom" },
    conflict: ["id"],
  },
  hydrology_snapshots: {
    columns: [
      "id",
      "feature_id",
      "feature_type",
      "names",
      "geometry",
      "valid_from_year",
      "valid_to_year",
      "interpolation_allowed",
      "source_ids",
      "confidence_level",
      "verification_status",
      "metadata",
    ],
    rename: { geometry: "geom" },
    conflict: ["id"],
  },
  archive_maps: {
    columns: [
      "id",
      "titles",
      "descriptions",
      "map_date",
      "map_date_precision",
      "source_id",
      "institution",
      "author",
      "publisher",
      "image_url",
      "thumbnail_url",
      "georeference_type",
      "georeference_data",
      "default_opacity",
      "license",
      "verification_status",
      "metadata",
    ],
    conflict: ["id"],
  },
  educational_stories: {
    columns: [
      "id",
      "titles",
      "descriptions",
      "target_audience",
      "duration_minutes",
      "verification_status",
      "metadata",
    ],
    conflict: ["id"],
  },
  educational_story_steps: {
    columns: [
      "id",
      "story_id",
      "step_order",
      "year",
      "era_id",
      "camera",
      "titles",
      "narration",
      "simple_narration",
      "source_ids",
      "metadata",
    ],
    conflict: ["id"],
  },
  educational_questions: {
    columns: [
      "id",
      "story_id",
      "question_type",
      "prompts",
      "options",
      "answer",
      "explanations",
      "source_ids",
      "verification_status",
      "metadata",
    ],
    conflict: ["id"],
  },
};

const statementFor = (table, records) => {
  if (!records.length) return `-- ${table}: no records\n`;
  const config = TABLE_CONFIG[table];
  if (!config) throw new Error(`No seed SQL config for ${table}`);
  const databaseColumns = config.columns.map(
    (column) => config.rename?.[column] || column
  );
  const values = records
    .map(
      (record) =>
        `  (${config.columns
          .map((column) => sqlValue(column, record[column]))
          .join(", ")})`
    )
    .join(",\n");
  const updateColumns = databaseColumns.filter(
    (column) => !config.conflict.includes(column)
  );
  const updates = updateColumns
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");
  return `insert into public.${table} (${databaseColumns.join(", ")})\nvalues\n${values}\non conflict (${config.conflict.join(
    ", "
  )}) do update set ${updates};\n`;
};

const seedData = await readSeedData();
const order = Object.keys(TABLE_CONFIG);
const body = order
  .map((table) => statementFor(table, seedData.tables[table] || []))
  .join("\n");
const sql = `-- Generated deterministic P2A seed. Do not edit manually.
-- Dataset version: ${seedData.datasetVersion}
-- Apply manually to staging only after P2A migrations and validation.

begin;
set local statement_timeout = '60s';

${body}
commit;
`;

await ensureSeedDirectory();
const changed = await writeIfChanged(seedSqlPath, sql);
console.log(`P2A seed SQL: ${changed ? "updated" : "unchanged"}`);
