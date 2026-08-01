import {
  DATA_ACCESS_ERROR_CODES,
  DataAccessError,
} from "../errors/DataAccessError.js";

const array = (value) => (Array.isArray(value) ? value : []);
const object = (value) => (value && typeof value === "object" ? value : {});
const value = (row, camel, snake) => row?.[camel] ?? row?.[snake];

const parseGeoJson = (input) => {
  if (!input) return null;
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      throw new DataAccessError(DATA_ACCESS_ERROR_CODES.INVALID_RESPONSE);
    }
  }
  return input;
};

export const mapSupabaseEntity = (row) => ({
  id: row.id,
  entityType: value(row, "entityType", "entity_type"),
  names: object(row.names),
  defaultName: value(row, "defaultName", "default_name") || row.id,
  descriptions: object(row.summary),
  startYear: value(row, "startYear", "valid_from_year") ?? null,
  endYear: value(row, "endYear", "valid_to_year") ?? null,
  confidenceLevel: value(row, "confidenceLevel", "confidence_level"),
  verificationStatus: value(row, "verificationStatus", "verification_status"),
  sourceIds: array(object(row.metadata).sourceIds),
  metadata: object(row.metadata),
});

export const mapSupabaseGeometry = (row) => {
  const geometry = parseGeoJson(value(row, "geojson", "geojson"));
  return {
    id: row.id,
    entityId: value(row, "subjectId", "subject_id"),
    subjectType: value(row, "subjectType", "subject_type"),
    geometryType:
      value(row, "reconstructionMethod", "reconstruction_method") ||
      value(row, "geometryType", "geometry_type"),
    geojson: {
      type: "Feature",
      id: row.id,
      properties: {
        id: row.id,
        entityId: value(row, "subjectId", "subject_id"),
        confidenceLevel: value(row, "confidenceLevel", "confidence_level"),
        verificationStatus: value(
          row,
          "verificationStatus",
          "verification_status"
        ),
        reconstruction: true,
      },
      geometry,
    },
    validFromYear: value(row, "validFromYear", "valid_from_year") ?? null,
    validToYear: value(row, "validToYear", "valid_to_year") ?? null,
    confidenceLevel: value(row, "confidenceLevel", "confidence_level"),
    verificationStatus: value(row, "verificationStatus", "verification_status"),
    sourceIds: array(value(row, "sourceIds", "source_ids")),
    metadata: object(row.metadata),
  };
};

export const mapSupabasePlace = (row) => ({
  id: row.id,
  placeType: array(value(row, "placeTypes", "place_types")),
  names: object(row.names),
  coordinates:
    row.coordinates ||
    (Number.isFinite(row.longitude) && Number.isFinite(row.latitude)
      ? [row.longitude, row.latitude]
      : []),
  coordinatePrecision: value(
    row,
    "coordinatePrecision",
    "coordinate_precision"
  ),
  validFromYear: value(row, "validFromYear", "valid_from_year") ?? null,
  validToYear: value(row, "validToYear", "valid_to_year") ?? null,
  entityIds: array(value(row, "entityIds", "entity_ids")),
  eventIds: array(value(row, "eventIds", "event_ids")),
  routeIds: array(value(row, "routeIds", "route_ids")),
  sourceIds: array(value(row, "sourceIds", "source_ids")),
  confidenceLevel: value(row, "confidenceLevel", "confidence_level"),
  verificationStatus: value(row, "verificationStatus", "verification_status"),
  metadata: object(row.metadata),
});

export const mapSupabaseRoute = (row) => ({
  id: row.id,
  routeType: value(row, "routeType", "route_type"),
  names: object(row.names),
  summaries: object(row.descriptions),
  validFromYear: value(row, "validFromYear", "valid_from_year") ?? null,
  validToYear: value(row, "validToYear", "valid_to_year") ?? null,
  confidenceLevel: value(row, "confidenceLevel", "confidence_level"),
  verificationStatus: value(row, "verificationStatus", "verification_status"),
  sourceIds: array(value(row, "sourceIds", "source_ids")),
  ...object(row.metadata),
});

export const mapSupabaseRouteSegment = (row) => ({
  id: row.id,
  routeId: value(row, "routeId", "route_id"),
  order: value(row, "segmentOrder", "segment_order"),
  fromPlaceId: value(row, "fromPlaceId", "from_place_id") ?? null,
  toPlaceId: value(row, "toPlaceId", "to_place_id") ?? null,
  geometry: {
    type: "Feature",
    properties: {},
    geometry: parseGeoJson(row.geometry),
  },
  validFromYear: value(row, "validFromYear", "valid_from_year") ?? null,
  validToYear: value(row, "validToYear", "valid_to_year") ?? null,
  mode: row.mode ?? null,
  season: row.season ?? null,
  confidenceLevel: value(row, "confidenceLevel", "confidence_level"),
  verificationStatus: value(row, "verificationStatus", "verification_status"),
  sourceIds: array(value(row, "sourceIds", "source_ids")),
  metadata: object(row.metadata),
});

const mapAreaSnapshot = (row, type) => ({
  id: row.id,
  [`${type}Type`]: value(row, `${type}Type`, `${type}_type`),
  featureId: value(row, "featureId", "feature_id"),
  names: object(row.names),
  descriptions: object(row.descriptions),
  [type === "environment" ? "geojson" : "geometry"]: {
    type: "Feature",
    properties: {},
    geometry: parseGeoJson(row.geometry),
  },
  validFromYear: value(row, "validFromYear", "valid_from_year") ?? null,
  validToYear: value(row, "validToYear", "valid_to_year") ?? null,
  interpolationAllowed: Boolean(
    value(row, "interpolationAllowed", "interpolation_allowed")
  ),
  sourceIds: array(value(row, "sourceIds", "source_ids")),
  confidenceLevel: value(row, "confidenceLevel", "confidence_level"),
  verificationStatus: value(row, "verificationStatus", "verification_status"),
  metadata: object(row.metadata),
});

export const mapSupabaseArchiveMap = (row) => ({
  id: row.id,
  titles: object(row.titles),
  descriptions: object(row.descriptions),
  mapDate: value(row, "mapDate", "map_date") ?? null,
  mapDatePrecision: value(row, "mapDatePrecision", "map_date_precision"),
  sourceId: value(row, "sourceId", "source_id") ?? null,
  sourceIds: value(row, "sourceId", "source_id")
    ? [value(row, "sourceId", "source_id")]
    : [],
  institution: object(row.institution),
  author: row.author ?? null,
  publisher: row.publisher ?? null,
  imageUrl: value(row, "imageUrl", "image_url") ?? null,
  thumbnailUrl: value(row, "thumbnailUrl", "thumbnail_url") ?? null,
  georeferenceType: value(row, "georeferenceType", "georeference_type"),
  coordinates:
    value(row, "georeferenceData", "georeference_data")?.coordinates || null,
  bounds: value(row, "georeferenceData", "georeference_data")?.bounds || null,
  defaultOpacity: Number(
    value(row, "defaultOpacity", "default_opacity") ?? 0.65
  ),
  license: object(row.license),
  verificationStatus: value(row, "verificationStatus", "verification_status"),
  ...object(row.metadata),
});

export const mapSupabaseClaim = (row) => ({
  id: row.id,
  subjectType: value(row, "subjectType", "subject_type"),
  subjectId: value(row, "subjectId", "subject_id"),
  predicate: row.predicate,
  valueType: value(row, "valueType", "value_type"),
  value: value(row, "claimValue", "claim_value"),
  labels: object(row.labels),
  evidenceType: value(row, "evidenceType", "evidence_type"),
  confidenceLevel: value(row, "confidenceLevel", "confidence_level"),
  verificationStatus: value(row, "verificationStatus", "verification_status"),
  interpretationNotes: object(
    value(row, "interpretationNotes", "interpretation_notes")
  ),
  reviewedAt: value(row, "reviewedAt", "reviewed_at") ?? null,
  sourceIds: array(row.sources).map((source) => source.id),
  sources: array(row.sources).map(mapSupabaseSource),
});

export function mapSupabaseSource(row) {
  return {
    id: row.id,
    title:
      object(row.titles).ru ||
      object(row.titles).kk ||
      object(row.titles).en ||
      row.id,
    titles: object(row.titles),
    author: row.author ?? null,
    organization:
      value(row, "institution", "institution") ||
      value(row, "publisher", "publisher") ||
      null,
    publicationYear: value(row, "publicationYear", "publication_year") ?? null,
    sourceType: value(row, "sourceType", "source_type"),
    url: row.url ?? null,
    licenseStatus: value(row, "licenseStatus", "license_status"),
    verificationStatus: value(row, "verificationStatus", "verification_status"),
    relationType: value(row, "relationType", "relation_type"),
    notes: object(row.notes),
  };
}

export const mapSupabaseSnapshot = (payload) => {
  if (!payload || !Array.isArray(payload.entities) || !Array.isArray(payload.geometries)) {
    throw new DataAccessError(DATA_ACCESS_ERROR_CODES.INVALID_RESPONSE);
  }
  const routePayload = object(payload.routes);
  return {
    datasetVersion: payload.datasetVersion || payload.dataset_version || null,
    year: payload.year,
    language: payload.language,
    entities: payload.entities.map(mapSupabaseEntity),
    geometries: payload.geometries.map(mapSupabaseGeometry),
    places: array(payload.places).map(mapSupabasePlace),
    routes: {
      routes: array(routePayload.routes).map(mapSupabaseRoute),
      segments: array(routePayload.segments).map(mapSupabaseRouteSegment),
      places: array(routePayload.places).map(mapSupabasePlace),
    },
    environment: array(payload.environment).map((row) =>
      mapAreaSnapshot(row, "environment")
    ),
    hydrology: array(payload.hydrology).map((row) =>
      mapAreaSnapshot(row, "feature")
    ),
    labels: array(payload.labels),
  };
};

export const mapSupabaseEvidence = (payload) => {
  if (!payload || !Array.isArray(payload.claims)) {
    throw new DataAccessError(DATA_ACCESS_ERROR_CODES.INVALID_RESPONSE);
  }
  const claims = payload.claims.map(mapSupabaseClaim);
  const sources = [
    ...new Map(
      claims.flatMap((claim) => claim.sources).map((source) => [source.id, source])
    ).values(),
  ];
  return {
    subjectType: payload.subjectType || payload.subject_type,
    subjectId: payload.subjectId || payload.subject_id,
    claims,
    sources,
    archiveMaps: array(payload.archiveMaps || payload.archive_maps).map(
      mapSupabaseArchiveMap
    ),
  };
};

export const mapSupabaseStory = (payload) => {
  if (!payload?.story?.id) return null;
  const story = payload.story;
  const storyMetadata = object(story.metadata);
  const targetAudience = value(story, "targetAudience", "target_audience");
  return {
    id: story.id,
    titles: object(story.titles),
    descriptions: object(story.descriptions),
    durationMinutes: value(story, "durationMinutes", "duration_minutes"),
    grade: Number(String(targetAudience || "").replace("grade-", "")) || null,
    questionIds: array(storyMetadata.questionIds),
    verificationStatus: value(
      story,
      "verificationStatus",
      "verification_status"
    ),
    ...storyMetadata,
    steps: array(payload.steps).map((step) => ({
      id: String(step.id).split(":").at(-1),
      year: step.year,
      eraId: value(step, "eraId", "era_id"),
      camera: step.camera,
      titles: object(step.titles),
      narration: object(step.narration),
      simpleNarration: object(
        value(step, "simpleNarration", "simple_narration")
      ),
      sourceIds: array(value(step, "sourceIds", "source_ids")),
      ...object(step.metadata),
    })),
    questions: array(payload.questions).map((question) => ({
      id: question.id,
      type: value(question, "questionType", "question_type"),
      prompts: object(question.prompts),
      options: array(question.options),
      correctOptionId:
        value(question, "answer", "answer")?.correctOptionId || null,
      explanations: object(question.explanations),
      sourceIds: array(value(question, "sourceIds", "source_ids")),
      verificationStatus: value(
        question,
        "verificationStatus",
        "verification_status"
      ),
      ...object(question.metadata),
    })),
  };
};
