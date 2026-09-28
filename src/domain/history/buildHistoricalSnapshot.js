import {
  HISTORICAL_SNAPSHOT_SCHEMA_VERSION,
  assertHistoricalYear,
  isHistoricalRecordActive,
} from "./historicalSnapshot.js";

/**
 * Build a detached snapshot from plain source records. No global dataset,
 * renderer, clock, network, or UI state is consulted. Source order and all
 * geometry/evidence/confidence fields are preserved, including nested values.
 *
 * @param {{year: number, datasetVersion: string, data?: Object, metadata?: Object}} input
 * @returns {import('./historicalSnapshot.js').HistoricalSnapshot}
 */
export function buildHistoricalSnapshot({ year, datasetVersion, data = {}, metadata = {} }) {
  assertHistoricalYear(year);
  if (typeof datasetVersion !== "string" || !datasetVersion.trim()) {
    throw new TypeError("HistoricalSnapshot requires a datasetVersion");
  }
  const active = (records = []) =>
    records.filter((record) => isHistoricalRecordActive(record, year));

  return structuredClone({
    schemaVersion: HISTORICAL_SNAPSHOT_SCHEMA_VERSION,
    datasetVersion,
    year,
    era: active(data.eras)[0] || null,
    territories: active(data.territories),
    borders: active(data.borders),
    places: active(data.places),
    events: active(data.events),
    people: active(data.people),
    metadata,
    // Entities are a reference catalogue, not a displayed temporal layer.
    // Geometry and label validity determine which references the renderer uses.
    entities: data.entities || [],
    labels: active(data.labels),
    environment: active(data.environment),
    hydrology: active(data.hydrology),
    routes: active(data.routes),
    routeSegments: active(data.routeSegments),
  });
}
