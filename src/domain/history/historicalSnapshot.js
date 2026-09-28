/** Version of the renderer-independent snapshot shape, not the dataset. */
export const HISTORICAL_SNAPSHOT_SCHEMA_VERSION = 1;

/**
 * @typedef {Object} HistoricalSnapshot
 * @property {number} schemaVersion
 * @property {string} datasetVersion Supplied by the data source.
 * @property {number} year Signed integer; negative years are BCE, zero is invalid.
 * @property {Object|null} era Matching source era, or null in a coverage gap.
 * @property {Object[]} territories Time-valid source geometry records.
 * @property {Object[]} borders Time-valid source boundary records (no generated lines).
 * @property {Object[]} places
 * @property {Object[]} events
 * @property {Object[]} people
 * @property {Object} metadata Caller-supplied provenance; no generated timestamps.
 * @property {Object[]} entities Reference catalogue for resolving entity IDs.
 * @property {Object[]} labels
 * @property {Object[]} environment
 * @property {Object[]} hydrology
 * @property {Object[]} routes
 * @property {Object[]} routeSegments
 */

const fromFields = [
  "validFromYear", "validFrom", "yearFrom", "fromYear", "startYear",
  "periodStart", "birthYear",
];
const toFields = [
  "validToYear", "validTo", "yearTo", "toYear", "endYear",
  "periodEnd", "deathYear",
];

// First defined alias wins. An explicit null is an open bound, not a fallback.
const bound = (record, fields) => {
  const field = fields.find((name) => record[name] !== undefined);
  return field === undefined ? undefined : record[field];
};

/** Inclusive ranges; undated records remain available. No date interpolation. */
export const isHistoricalRecordActive = (record, year) => {
  const from = bound(record, fromFields);
  const to = bound(record, toFields);
  if (from === undefined && to === undefined && record.year != null) {
    return record.year === year;
  }
  return (from == null || from <= year) && (to == null || year <= to);
};

export const assertHistoricalYear = (year) => {
  if (!Number.isInteger(year) || year === 0) {
    throw new TypeError("HistoricalSnapshot year must be a non-zero signed integer");
  }
};
