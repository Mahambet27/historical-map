import { describe, expect, it } from "vitest";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { getExhibitionShortcut } from "./keyboardShortcuts.js";
import { buildTerritoryCollection } from "./mapDataUtils.js";
import { TERRITORY_FILL_PAINT } from "./mapStyleUtils.js";
import { CLOSED_PANEL, closePanel, openPanel, setPanelMode } from "./panelState.js";
import { detectExhibitionQuality, readStoredQualityMode, storeQualityMode } from "./qualityMode.js";
import { ERA_THEMES, getEraTheme } from "./theme/eraThemes.js";
import { entityStyleRegistry } from "./theme/entityStyleRegistry.js";
import {
  MAP_STYLE_MODES,
  readStoredMapStyle,
  resolveMapPalette,
  storeMapStyle,
} from "./theme/mapPalettes.js";

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};

describe("P0 exhibition infrastructure", () => {
  it("provides six named historical visual themes", () => {
    expect(Object.values(ERA_THEMES).map(({ name }) => name)).toEqual([
      "Saka Gold",
      "Turkic Azure",
      "Kazakh Khanate Steppe",
      "Imperial Atlas",
      "Soviet Constructive",
      "Independent Kazakhstan Digital",
    ]);
    expect(getEraTheme({ year: 1900 }).name).toBe("Imperial Atlas");
  });

  it("resolves and persists supported map palettes", () => {
    const storage = memoryStorage();
    expect(MAP_STYLE_MODES).toEqual(["era", "light", "dark", "atlas", "high-contrast"]);
    expect(resolveMapPalette({ mode: "era", eraId: "turkic", year: 603 }).name).toBe("Turkic Azure");
    expect(storeMapStyle("atlas", storage)).toBe(true);
    expect(readStoredMapStyle(storage)).toBe("atlas");
    expect(storeMapStyle("unknown", storage)).toBe(false);
  });

  it("has deterministic interaction styles for every entity", () => {
    expect(Object.keys(entityStyleRegistry)).toHaveLength(allHistoricalEntities.length);
    allHistoricalEntities.forEach(({ id }) => {
      expect(entityStyleRegistry[id]).toMatchObject({
        default: expect.any(Object),
        hover: expect.any(Object),
        selected: expect.any(Object),
        label: expect.any(Object),
      });
    });
  });

  it("keeps selection out of source properties and in feature-state expressions", () => {
    expect(buildTerritoryCollection(1465).features[0].properties).not.toHaveProperty("selected");
    expect(JSON.stringify(TERRITORY_FILL_PAINT)).toContain("feature-state");
    expect(JSON.stringify(TERRITORY_FILL_PAINT)).toContain("selected");
  });

  it("selects and persists auto/high/light quality modes", () => {
    const storage = memoryStorage();
    expect(detectExhibitionQuality({ requested: "auto", width: 390 })).toBe("light");
    expect(detectExhibitionQuality({ requested: "auto", width: 1440, deviceMemory: 16, hardwareConcurrency: 12 })).toBe("high");
    expect(detectExhibitionQuality({ requested: "high", saveData: true })).toBe("high");
    expect(storeQualityMode("light", storage)).toBe(true);
    expect(readStoredQualityMode(storage)).toBe("light");
  });

  it("models closed, compact and expanded panels", () => {
    const expanded = openPanel("sources");
    expect(expanded).toEqual({ type: "sources", mode: "expanded" });
    expect(setPanelMode(expanded, "compact")).toEqual({ type: "sources", mode: "compact" });
    expect(closePanel()).toBe(CLOSED_PANEL);
  });

  it("maps shortcuts and ignores editable targets", () => {
    expect(getExhibitionShortcut({ key: " ", target: document.body })).toBe("toggle-play");
    expect(getExhibitionShortcut({ key: "]", target: document.body })).toBe("next-year");
    expect(getExhibitionShortcut({ key: "c", target: document.body })).toBe("compare");
    expect(getExhibitionShortcut({ key: "c", target: document.createElement("input") })).toBeNull();
  });
});
