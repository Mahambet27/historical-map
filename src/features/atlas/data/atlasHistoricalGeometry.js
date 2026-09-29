import { isHistoricalRecordActive } from "../../../domain/history/historicalSnapshot.js";
import { atlasYear } from "./atlasDemoData.js";

const collection = (features) => ({ type: "FeatureCollection", features });
const position = (p) =>
  Array.isArray(p) &&
  p.length >= 2 &&
  p.every(Number.isFinite) &&
  Math.abs(p[0]) <= 180 &&
  Math.abs(p[1]) <= 90;
const line = (points) => Array.isArray(points) && points.length >= 2 && points.every(position);
const ring = (points) =>
  line(points) &&
  points.length >= 4 &&
  points[0].length === points.at(-1).length &&
  points[0].every((v, i) => v === points.at(-1)[i]);
const polygon = (rings) => Array.isArray(rings) && rings.length > 0 && rings.every(ring);
function validGeometry(geometry, borders) {
  const c = geometry?.coordinates;
  if (geometry?.type === "Polygon") return polygon(c);
  if (geometry?.type === "MultiPolygon")
    return Array.isArray(c) && c.length > 0 && c.every(polygon);
  if (borders && geometry?.type === "LineString") return line(c);
  if (borders && geometry?.type === "MultiLineString")
    return Array.isArray(c) && c.length > 0 && c.every(line);
  return false;
}

/** Preserve reviewed source coordinates, holes and metadata; never interpolate years. */
export function atlasHistoricalGeometry(snapshot) {
  const convert = (records = [], borders = false) =>
    collection(
      records.flatMap((record) => {
        if (
          !["reviewed", "verified"].includes(record.verificationStatus) ||
          !isHistoricalRecordActive(record, snapshot.year)
        )
          return [];
        const feature = record.geojson;
        const geometry =
          feature?.type === "Feature" ? feature.geometry : feature || record.geometry;
        if (!validGeometry(geometry, borders)) return [];
        const metadata = { ...record };
        delete metadata.geojson;
        delete metadata.geometry;
        return [
          {
            type: "Feature",
            id: record.id,
            geometry: structuredClone(geometry),
            properties: structuredClone({
              ...(feature?.properties || {}),
              ...metadata,
              recordId: record.id,
              entityId: record.entityId ?? feature?.properties?.entityId ?? null,
            }),
          },
        ];
      })
    );
  return { territories: convert(snapshot.territories), borders: convert(snapshot.borders, true) };
}

/** Adapt existing entities to the existing card, without adding them to place search. */
export function atlasTerritoryCards(snapshot, territories) {
  const entities = new Map((snapshot.entities || []).map((entity) => [entity.id, entity]));
  const sources = new Map((snapshot.metadata?.sources || []).map((source) => [source.id, source]));
  return territories.features.flatMap((feature, index) => {
    const entity = entities.get(feature.properties.entityId);
    if (!entity) return [];
    const metadata = feature.properties;
    const date = Object.fromEntries(
      ["ru", "kk", "en"].map((language) => [
        language,
        `${entity.startYear == null ? "…" : atlasYear(entity.startYear, language)} — ${entity.endYear == null ? "…" : atlasYear(entity.endYear, language)}`,
      ])
    );
    return [
      {
        id: `entity:${entity.id}`,
        entityId: entity.id,
        index: String(index + 1).padStart(2, "0"),
        name: entity.names || entity.name,
        description: entity.descriptions || entity.description || {},
        era: snapshot.era?.names || snapshot.era?.name,
        date,
        categoryLabel: {
          ru: "Историческая территория",
          kk: "Тарихи аумақ",
          en: "Historical territory",
        },
        confidence:
          metadata.confidenceLevel ?? metadata.confidence ?? entity.confidenceLevel ?? null,
        verificationStatus: metadata.verificationStatus,
        sources: [...new Set([...(entity.sourceIds || []), ...(metadata.sourceIds || [])])].map(
          (id) => sources.get(id) || { id, title: id }
        ),
        coordinates: null,
      },
    ];
  });
}
