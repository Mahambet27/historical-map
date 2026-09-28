import { describe, expect, it } from "vitest";
import { buildHistoricalSnapshot } from "./buildHistoricalSnapshot.js";
import { HISTORICAL_SNAPSHOT_SCHEMA_VERSION } from "./historicalSnapshot.js";
import { entityGeometries } from "../../data/exhibition/entityGeometries.js";
import { historicalEvents } from "../../data/exhibition/events.js";
import { historicalPeople } from "../../data/exhibition/people.js";
import { eraRegistry } from "../../data/exhibition/eraRegistry.js";
import { LOCAL_DATASET_VERSION } from "../../dataAccess/datasetVersion.js";

const input = (year = 1465, data = {}) => ({
  year,
  datasetVersion: LOCAL_DATASET_VERSION,
  data: { eras: eraRegistry, territories: entityGeometries, ...data },
  metadata: { source: "local", sourceIds: ["e-history-kazakh-khanate"] },
});

const freeze = (value) => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

describe("HistoricalSnapshot domain contract", () => {
  it("creates the required versioned snapshot from existing data", () => {
    const result = buildHistoricalSnapshot(input());
    expect(result).toMatchObject({
      schemaVersion: HISTORICAL_SNAPSHOT_SCHEMA_VERSION,
      datasetVersion: LOCAL_DATASET_VERSION,
      year: 1465,
      era: eraRegistry.find((era) => era.id === "kazakh-khanate"),
      borders: [], places: [], events: [], people: [],
      metadata: input().metadata,
    });
    expect(result.schemaVersion).toBe(1);
    expect(result.territories.some((record) => record.id === "khanate-1465")).toBe(true);
  });

  it("supports BCE without converting negative years", () => {
    const result = buildHistoricalSnapshot(input(-550));
    expect(result.year).toBe(-550);
    expect(result.territories.map((record) => record.id)).toEqual(["saka-550"]);
    expect(result.era.id).toBe("saka");
  });

  it.each([
    ["validFromYear", "validToYear"],
    ["validFrom", "validTo"],
    ["yearFrom", "yearTo"],
    ["fromYear", "toYear"],
    ["startYear", "endYear"],
    ["periodStart", "periodEnd"],
    ["birthYear", "deathYear"],
  ])("filters %s/%s inclusively, including BCE", (from, to) => {
    // Alias fixtures carry real source geometry; no production data is changed.
    const { validFromYear, validToYear, ...record } = entityGeometries[0];
    const source = { ...record, [from]: validFromYear, [to]: validToYear };
    const at = (year) => buildHistoricalSnapshot(input(year, { territories: [source] })).territories;
    expect(at(-801)).toEqual([]); // before validFrom
    expect(at(-800)).toEqual([source]);
    expect(at(-550)).toEqual([source]); // inside range
    expect(at(-300)).toEqual([source]);
    expect(at(-299)).toEqual([]); // after validTo
  });

  it("preserves geometry, evidence, sources and confidence without projection", () => {
    const source = entityGeometries.find((record) => record.id === "khanate-1465");
    const evidence = historicalEvents.find((record) => record.id === "formation-kazakh-khanate");
    const record = { ...source, evidence };
    const result = buildHistoricalSnapshot(input(1465, { territories: [record], borders: [record] }));
    expect(result.territories[0]).toEqual(record);
    expect(result.territories[0].geojson).toEqual(source.geojson);
    expect(result.territories[0].sourceIds).toEqual(source.sourceIds);
    expect(result.territories[0].evidence).toEqual(evidence);
    expect(result.territories[0].confidenceLevel).toBe(source.confidenceLevel);
    expect(result.borders).toEqual([record]);
  });

  it("filters every temporal collection, including events and people", () => {
    const record = entityGeometries[0];
    const collections = ["territories", "borders", "places", "events", "people", "labels", "environment", "hydrology", "routes", "routeSegments"];
    const data = Object.fromEntries(collections.map((key) => [key, [record]]));
    for (const key of collections) {
      expect(buildHistoricalSnapshot(input(-550, data))[key]).toEqual([record]);
      expect(buildHistoricalSnapshot(input(1465, data))[key]).toEqual([]);
    }
    const result = buildHistoricalSnapshot(input(1511, { events: historicalEvents, people: historicalPeople }));
    expect(result.events.map((event) => event.id)).toContain("kasym-khan-consolidation");
    expect(result.people.map((person) => person.id)).not.toContain("bumin-qaghan");
  });

  it("keeps open/undated intervals, exact-year events and alias precedence explicit", () => {
    const records = [
      { id: "undated" },
      { id: "open", validFrom: -800, validTo: null, yearTo: -300 },
      { id: "instant", year: 1465 },
      { id: "bounded", validFromYear: 1500, validFrom: 1400 },
    ];
    expect(buildHistoricalSnapshot(input(1465, { events: records })).events.map((record) => record.id))
      .toEqual(["undated", "open", "instant"]);
    expect(buildHistoricalSnapshot(input(1466, { events: records })).events.map((record) => record.id))
      .toEqual(["undated", "open"]);
    expect(buildHistoricalSnapshot(input(100)).era).toBeNull();
  });

  it("does not mutate input and detaches nested output from the source", () => {
    const source = freeze(structuredClone(input()));
    const before = structuredClone(source);
    const result = buildHistoricalSnapshot(source);
    result.territories[0].geojson.geometry.coordinates[0][0][0] += 1;
    result.territories[0].sourceIds.push("test-only");
    result.metadata.sourceIds.push("test-only");
    expect(source).toEqual(before);
  });

  it("is deterministic for the same input", () => {
    const source = input();
    expect(JSON.stringify(buildHistoricalSnapshot(source)))
      .toBe(JSON.stringify(buildHistoricalSnapshot(structuredClone(source))));
  });

  it.each([0, 1.5, NaN, Infinity, "1465"])("rejects invalid year %s", (year) => {
    expect(() => buildHistoricalSnapshot(input(year))).toThrow(TypeError);
  });

  it("requires an explicit dataset version", () => {
    expect(() => buildHistoricalSnapshot({ year: 1465 })).toThrow(/datasetVersion/);
  });
});
