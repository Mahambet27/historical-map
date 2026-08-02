import { sourceIdsFor, localizedName } from "./science-data.mjs";
import { getScientificReadiness } from "../../src/features/exhibition/scientificReadiness.js";
import { getSpatialPrecision } from "../../src/features/exhibition/spatialPrecision.js";

export const reviewProperties = (
  recordType,
  record,
  claims = [],
  subjectId = record.id
) => ({
  id: record.id,
  subjectType: recordType,
  subjectId,
  validFromYear:
    record.validFromYear ?? record.startYear ?? record.fromYear ?? null,
  validToYear: record.validToYear ?? record.endYear ?? record.toYear ?? null,
  snapshotYear: record.snapshotYear ?? null,
  names: record.names || record.titles || record.labels || null,
  verificationStatus: record.verificationStatus || "missing",
  scientificReadiness: getScientificReadiness(record),
  confidenceLevel: record.confidenceLevel || "unknown",
  spatialPrecision: getSpatialPrecision(record),
  sourceIds: sourceIdsFor(record),
  claimIds: claims.map((claim) => claim.id),
  reconstructionMethod: record.reconstructionMethod || null,
  interpolationAllowed: record.interpolationAllowed ?? null,
  licenseStatus:
    record.licenseStatus || record.license?.status || "not_applicable",
  reviewNotesPlaceholder: "",
});

export const feature = (geometry, properties) => ({
  type: "Feature",
  geometry: geometry || null,
  properties,
});

export const collection = (features) => ({
  type: "FeatureCollection",
  features,
});

export const geometryFor = (record) =>
  record.geometry?.type === "Feature"
    ? record.geometry.geometry
    : record.geometry?.type
    ? record.geometry
    : record.geometry?.geometry ||
      record.geojson?.geometry ||
      (record.coordinates
        ? { type: "Point", coordinates: record.coordinates }
        : null);

export const csvCell = (value) => {
  const text =
    value == null
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

export const checklistRow = (recordType, record, claims = []) => [
  recordType,
  record.id,
  localizedName(record),
  `${record.validFromYear ?? record.startYear ?? record.fromYear ?? ""}–${record.validToYear ?? record.endYear ?? record.toYear ?? ""}`,
  record.verificationStatus || "missing",
  getSpatialPrecision(record),
  sourceIdsFor(record).length,
  claims.length,
  record.licenseStatus || record.license?.status || "not_applicable",
  getScientificReadiness(record),
  "",
  "",
  "",
  "",
  "",
  "",
];

export const REVIEW_CHECKLIST_HEADERS = [
  "record type",
  "record ID",
  "displayed name",
  "period",
  "verification status",
  "spatial precision",
  "source count",
  "claim count",
  "license",
  "current warning",
  "historian decision",
  "cartographer decision",
  "corrected date",
  "corrected source",
  "corrected geometry required",
  "reviewer comment",
];
