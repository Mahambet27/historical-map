import { isHistoricalRecordActive } from "../../../domain/history/historicalSnapshot.js";
import { validAtlasCoordinates } from "./atlasSnapshotAdapter.js";
import { atlasYear } from "./atlasDemoData.js";

const collection = (features) => ({ type: "FeatureCollection", features });
const reviewed = (record, year) =>
  ["reviewed", "verified"].includes(record.verificationStatus) &&
  isHistoricalRecordActive(record, year);
const geometryOf = (record) => {
  const value = record.geojson || record.geometry;
  return value?.type === "Feature" ? value.geometry : value;
};
const validLine = (points) => Array.isArray(points) && points.length >= 2 && points.every(validAtlasCoordinates);
const routeGeometry = (geometry) =>
  geometry?.type === "LineString" ? validLine(geometry.coordinates) :
    geometry?.type === "MultiLineString" && Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0 && geometry.coordinates.every(validLine);
const feature = (record, geometry, objectId) => {
  const { geojson, geometry: ignored, ...metadata } = record;
  return {
    type: "Feature", id: record.id, geometry: structuredClone(geometry),
    properties: structuredClone({ ...(geojson?.properties || ignored?.properties || {}), ...metadata, objectId }),
  };
};

/** No inferred paths, geocoding or promotion of unreviewed source records. */
export function atlasHistoricalOverlays(snapshot) {
  const routes = (snapshot.routes || []).filter((r) => reviewed(r, snapshot.year));
  const routeById = new Map(routes.map((r) => [r.id, r]));
  const direct = routes.filter((r) => routeGeometry(geometryOf(r)));
  const directIds = new Set(direct.map((r) => r.id));
  const segments = (snapshot.routeSegments || []).filter((segment) => {
    const parent = routeById.get(segment.routeId);
    return parent && !directIds.has(parent.id) &&
      (!parent.segmentIds || parent.segmentIds.includes(segment.id)) &&
      reviewed(segment, snapshot.year) && routeGeometry(geometryOf(segment));
  });
  const events = (snapshot.events || []).filter((event) =>
    reviewed(event, snapshot.year) && geometryOf(event)?.type === "Point" &&
    validAtlasCoordinates(geometryOf(event).coordinates));
  return {
    routes: collection([
      ...direct.map((r) => feature(r, geometryOf(r), `route:${r.id}`)),
      ...segments.map((r) => feature(r, geometryOf(r), `route:${r.routeId}`)),
    ]),
    events: collection(events.map((r) => feature(r, geometryOf(r), `event:${r.id}`))),
  };
}

export function atlasOverlayCards(snapshot, overlays) {
  const sources = new Map((snapshot.metadata?.sources || []).map((s) => [s.id, s]));
  return ["routes", "events"].flatMap((kind) => {
    const prefix = kind === "routes" ? "route" : "event";
    return (snapshot[kind] || []).flatMap((record) => {
      const id = `${prefix}:${record.id}`;
      const features = overlays[kind].features.filter((f) => f.properties.objectId === id);
      if (!features.length) return [];
      const from = record.validFromYear ?? record.startYear ?? record.year;
      const to = record.validToYear ?? record.endYear ?? record.year;
      return [{
        id, name: record.names || record.titles || record.name || record.id,
        description: record.descriptions || record.summaries || record.description || {},
        era: snapshot.era?.names,
        index: record.id,
        date: Object.fromEntries(["ru", "kk", "en"].map((lang) => [lang,
          `${from == null ? "…" : atlasYear(from, lang)} — ${to == null ? "…" : atlasYear(to, lang)}`])),
        categoryLabel: kind === "routes"
          ? { ru: "Исторический маршрут", kk: "Тарихи бағыт", en: "Historical route" }
          : { ru: "Историческое событие / сражение", kk: "Тарихи оқиға / шайқас", en: "Historical event / battle" },
        confidence: record.confidenceLevel ?? null,
        verificationStatus: record.verificationStatus,
        reconstruction: record.reconstruction === true || record.geometryType === "reconstruction" ||
          features.some((f) => f.properties.reconstruction === true || f.properties.geometryType === "reconstruction"),
        sources: [...new Set([...(record.sourceIds || []), ...features.flatMap((f) => f.properties.sourceIds || [])])]
          .map((sourceId) => sources.get(sourceId) || { id: sourceId, title: sourceId }),
        coordinates: kind === "events" ? features[0].geometry.coordinates : null,
        coordinatePrecision: record.coordinatePrecision || record.precision,
      }];
    });
  });
}
