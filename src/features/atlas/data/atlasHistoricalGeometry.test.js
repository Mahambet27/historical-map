import { describe, expect, it } from "vitest";
import { atlasHistoricalGeometry, atlasTerritoryCards } from "./atlasHistoricalGeometry.js";
import { buildAtlasHistoricalSnapshot } from "./atlasHistoricalData.js";

describe("reviewed snapshot geometry", () => {
  it.each([
    [1465, "khanate-1465"],
    [1510, "khanate-1510"],
    [1513, "khanate-1513"],
    [-550, "saka-550"],
    [552, "turkic-552"],
    [1991, "republic-1991"],
  ])("uses unchanged source geometry for %i", (year, id) => {
    const snapshot = buildAtlasHistoricalSnapshot(year);
    const result = atlasHistoricalGeometry(snapshot);
    expect(result.territories.features.map((f) => f.id)).toEqual([id]);
    const source = snapshot.territories.find((g) => g.id === id);
    expect(result.territories.features[0].geometry).toEqual(source.geojson.geometry);
    expect(result.territories.features[0].geometry).not.toBe(source.geojson.geometry);
    expect(result.territories.features[0].properties).toMatchObject({
      entityId: source.entityId,
      confidenceLevel: source.confidenceLevel,
      reconstruction: true,
      sourceIds: source.sourceIds,
      geometryType: "reconstruction",
    });
    expect(result.borders.features).toEqual(result.territories.features);
  });
  it.each([1200, 1522, -3000])("draws nothing without reviewed geometry at %i", (year) => {
    const result = atlasHistoricalGeometry(buildAtlasHistoricalSnapshot(year));
    expect(result.territories.features).toEqual([]);
    expect(result.borders.features).toEqual([]);
  });
  it("preserves multipolygons, holes, line borders and nested evidence, rejects malformed/unreviewed/outdated geometry", () => {
    const snapshot = buildAtlasHistoricalSnapshot(1465);
    const record = structuredClone(snapshot.territories.find((g) => g.id === "khanate-1465"));
    const ring = record.geojson.geometry.coordinates[0];
    record.geojson.geometry = {
      type: "MultiPolygon",
      coordinates: [
        [
          ring,
          [
            [65, 45],
            [66, 45],
            [66, 46],
            [65, 45],
          ],
        ],
      ],
    };
    record.evidence = { status: "reviewed", references: ["source"] };
    record.reconstructionMethod = "existing source method";
    const border = {
      ...record,
      id: "line",
      geojson: {
        type: "Feature",
        geometry: {
          type: "MultiLineString",
          coordinates: [
            [
              [65, 45],
              [66, 46],
            ],
          ],
        },
      },
    };
    const result = atlasHistoricalGeometry({
      ...snapshot,
      territories: [
        record,
        { ...record, verificationStatus: "needs_review" },
        { ...record, validToYear: 1400 },
        { ...record, geojson: { type: "Polygon", coordinates: [[[999, 45]]] } },
      ],
      borders: [border],
    });
    expect(result.territories.features).toHaveLength(1);
    expect(result.territories.features[0].geometry).toEqual(record.geojson.geometry);
    expect(result.territories.features[0].properties.evidence).toEqual(record.evidence);
    expect(result.borders.features[0].geometry).toEqual(border.geojson.geometry);
    result.territories.features[0].properties.evidence.references.push("mutation");
    expect(record.evidence.references).toEqual(["source"]);
  });
  it("adapts only existing entities for the existing card", () => {
    const snapshot = buildAtlasHistoricalSnapshot(1465);
    const { territories } = atlasHistoricalGeometry(snapshot);
    expect(atlasTerritoryCards(snapshot, territories)[0]).toMatchObject({
      entityId: "kazakh-khanate",
      confidence: "medium",
      verificationStatus: "reviewed",
    });
    expect(atlasTerritoryCards({ ...snapshot, entities: [] }, territories)).toEqual([]);
  });
});
