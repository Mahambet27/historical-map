import { describe, expect, it } from "vitest";
import { buildHistoricalSnapshot } from "../../../domain/history/buildHistoricalSnapshot.js";
import { historicalSettlements } from "../../../data/exhibition/historicalSettlements.js";
import { buildAtlasHistoricalSnapshot } from "./atlasHistoricalData.js";
import {
  adaptAtlasSnapshot,
  filterAtlasObjects,
  projectAtlasCoordinates,
} from "./atlasSnapshotAdapter.js";
import * as uiConfig from "./atlasDemoData.js";

const view = (year) => adaptAtlasSnapshot(buildAtlasHistoricalSnapshot(year));
describe("Atlas snapshot integration", () => {
  it("uses source records, not demo historical objects", () => {
    const snapshot = buildAtlasHistoricalSnapshot(1465);
    expect(snapshot.places.find((place) => place.id === "otrar")).toEqual(
      historicalSettlements.find((place) => place.id === "otrar")
    );
    expect(uiConfig).not.toHaveProperty("atlasDemoObjects");
    expect(uiConfig).not.toHaveProperty("atlasEras");
    expect(view(1465).objects.map((place) => place.id)).toEqual(
      snapshot.places.map((place) => place.id)
    );
  });
  it("excludes future and expired records at inclusive boundaries", () => {
    expect(view(499).objects).toEqual([]);
    expect(view(500).objects.length).toBeGreaterThan(0);
    expect(view(1400).objects.some((place) => place.id === "balasagun")).toBe(true);
    expect(view(1401).objects.some((place) => place.id === "balasagun")).toBe(false);
  });
  it("preserves BCE and represents empty real-data coverage honestly", () => {
    expect(view(-550).year).toBe(-550);
    expect(view(-550).era.id).toBe("saka");
    expect(view(-550).objects).toEqual([]);
    const data = {
      places: [{ id: "bce-fixture", validFrom: -600, validTo: -400, coordinates: [70, 48] }],
    };
    const build = (year) =>
      adaptAtlasSnapshot(buildHistoricalSnapshot({ year, datasetVersion: "test", data }));
    expect(build(-550).objects[0].date.en).toBe("600 BCE — 400 BCE");
    expect(build(550).objects).toEqual([]);
  });
  it("searches active localized names, aliases, category and era", () => {
    expect(filterAtlasObjects(view(1200).objects, "Farab")[0].id).toBe("otrar");
    expect(filterAtlasObjects(view(1465).objects, "Farab")).toEqual([]);
    expect(filterAtlasObjects(view(1465).objects, "Otrar")[0].id).toBe("otrar");
    expect(filterAtlasObjects(view(1465).objects, "Kazakh Khanate").length).toBeGreaterThan(0);
    expect(filterAtlasObjects(view(1465).objects, "archaeological_site").length).toBeGreaterThan(0);
    expect(filterAtlasObjects(view(-550).objects, "Otrar")).toEqual([]);
  });
  it("uses temporal RU/KK/EN names and real coordinates", () => {
    const place = view(1465).objects.find((object) => object.id === "turkistan");
    expect(place.name).toEqual({ ru: "Ясы", kk: "Ясы", en: "Yasi" });
    expect(view(1600).objects.find((object) => object.id === "turkistan").name).toEqual({
      ru: "Туркестан",
      kk: "Түркістан",
      en: "Turkistan",
    });
    expect(place.coordinates).toEqual([68.25, 43.3]);
    expect(place.position).toEqual(projectAtlasCoordinates(place.coordinates));
    for (const coords of [null, [NaN, 40], [181, 40], [60, 91], ["68", 43], [68], [0, 0]])
      expect(projectAtlasCoordinates(coords)).toBeNull();
  });
  it("preserves supplied confidence/source/evidence and never invents missing fields", () => {
    const real = view(1465).objects.find((object) => object.id === "otrar");
    expect(real.confidence).toBe("low");
    expect(real.sources[0].id).toBe("unesco-silk-roads");
    expect(real.description).toEqual({});
    const evidence = { sourceIds: ["source-test"] };
    const snapshot = buildHistoricalSnapshot({
      year: 1000,
      datasetVersion: "test",
      data: { places: [{ id: "missing" }, { id: "evidence", evidence }] },
    });
    const objects = adaptAtlasSnapshot(snapshot).objects;
    expect(objects[0]).toMatchObject({
      confidence: null,
      sources: [],
      coordinates: null,
      position: null,
    });
    expect(objects[1].evidence).toEqual(evidence);
    expect(view(1465).categories.map((category) => category.id)).toEqual([
      ...new Set(buildAtlasHistoricalSnapshot(1465).places.flatMap((place) => place.placeType)),
    ]);
  });
});
