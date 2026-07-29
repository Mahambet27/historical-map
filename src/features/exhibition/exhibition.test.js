import { describe, expect, it } from "vitest";
import { getHistoricalSnapshotAtYear, getTimelineStateAtYear, timelineStates } from "../../data/exhibition/timeline.js";
import { getEntityGeometryAtYear, getGeometriesAtYear } from "../../data/exhibition/entityGeometries.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { formatHistoricalYear } from "../../services/historicalTimelineService.js";
import { runLocalHistoricalAgent } from "../agent/historicalAgentService.js";
import { AGENT_ACTIONS } from "../agent/agentTypes.js";
import { buildTerritoryCollection, getFallbackEntitiesAtYear } from "./mapDataUtils.js";
import {
  EXHIBITION_SYMBOL_LAYER_IDS,
  TERRITORY_LINE_PAINT,
  hideBaseMapLabels,
} from "./mapStyleUtils.js";
import { resolveEraSelection, resolveYearSelection } from "./historicalYearModel.js";

describe("exhibition timeline", () => {
  it("formats BCE years in all supported languages", () => {
    expect(formatHistoricalYear(-550, "ru")).toBe("550 г. до н. э.");
    expect(formatHistoricalYear(-550, "kk")).toBe("б.з.д. 550 ж.");
    expect(formatHistoricalYear(-550, "en")).toBe("550 BCE");
  });

  it("chooses the nearest reviewed timeline state", () => {
    expect(getTimelineStateAtYear(1467).id).toBe("kazakh-khanate-1465");
    expect(getTimelineStateAtYear(1519).id).toBe("kasym-khan-1511");
    expect(timelineStates).toHaveLength(6);
  });

  it("keeps an arbitrary selected year separate from its snapshot", () => {
    const selection = resolveYearSelection(1473);
    expect(selection.selectedYear).toBe(1473);
    expect(selection.activeSnapshot.id).toBe("kazakh-khanate-1465");
    expect(getHistoricalSnapshotAtYear(1473).year).toBe(1465);
  });

  it("sets 1465 when the Kazakh Khanate era is selected", () => {
    expect(resolveEraSelection("kazakh-khanate")).toMatchObject({
      selectedYear: 1465,
      selectedEraId: "kazakh-khanate",
    });
  });

  it("filters time-valid geometry", () => {
    expect(getGeometriesAtYear(1465).some((item) => item.id === "khanate-1465")).toBe(true);
    expect(getGeometriesAtYear(1511).some((item) => item.id === "khanate-1510")).toBe(true);
    expect(getGeometriesAtYear(1511).some((item) => item.id === "khanate-1465")).toBe(false);
  });

  it("uses the last valid slice until a confirmed geometry change", () => {
    expect(getEntityGeometryAtYear("kazakh-khanate", 1509)?.id).toBe("khanate-1465");
    expect(getEntityGeometryAtYear("kazakh-khanate", 1510)?.id).toBe("khanate-1510");
    expect(getEntityGeometryAtYear("kazakh-khanate", 1512)?.id).toBe("khanate-1510");
    expect(getEntityGeometryAtYear("kazakh-khanate", 1513)?.id).toBe("khanate-1513");
  });

  it("updates the map collection when a temporal slice changes", () => {
    const before = buildTerritoryCollection(1509).features.map((feature) => feature.id);
    const after = buildTerritoryCollection(1510).features.map((feature) => feature.id);
    expect(before).toContain("khanate-1465");
    expect(after).toContain("khanate-1510");
    expect(after).not.toContain("khanate-1465");
  });

  it("keeps solid territory borders", () => {
    expect(TERRITORY_LINE_PAINT).not.toHaveProperty("line-dasharray");
  });

  it("hides Mapbox symbols without hiding exhibition labels", () => {
    const layers = [
      { id: "country-label", type: "symbol" },
      { id: "road-number", type: "symbol" },
      { id: "background", type: "background" },
      { id: "ex-entity-labels", type: "symbol" },
    ];
    const hidden = [];
    const map = {
      getStyle: () => ({ layers }),
      getLayer: () => true,
      setLayoutProperty: (id, property, value) => hidden.push([id, property, value]),
    };
    hideBaseMapLabels(map);
    expect(hidden.map(([id]) => id)).toEqual(["country-label", "road-number"]);
    expect(EXHIBITION_SYMBOL_LAYER_IDS.has("ex-entity-labels")).toBe(true);
  });

  it("renders the same active entities in SVG fallback data", () => {
    const mapIds = getGeometriesAtYear(1511).map((item) => item.entityId).sort();
    const fallbackIds = getFallbackEntitiesAtYear(1511).map((item) => item.entity.id).sort();
    expect(fallbackIds).toEqual(mapIds);
  });

  it("provides entity names in RU, KZ and EN", () => {
    const entity = allHistoricalEntities.find((item) => item.id === "kazakh-khanate");
    expect(entity.names.ru).toBeTruthy();
    expect(entity.names.kk).toBeTruthy();
    expect(entity.names.en).toBe("Kazakh Khanate");
  });
});

describe("local historical agent", () => {
  it("returns grounded UI tools for an allow-listed prompt", () => {
    const result = runLocalHistoricalAgent("compare", "en");
    expect(result.grounded).toBe(true);
    expect(result.actions[0]).toEqual({
      type: AGENT_ACTIONS.COMPARE,
      payload: { firstYear: 1465, secondYear: 1511 },
    });
  });

  it("refuses unknown prompts without tools", () => {
    const result = runLocalHistoricalAgent("invent-an-answer", "ru");
    expect(result.grounded).toBe(false);
    expect(result.actions).toEqual([]);
  });
});
