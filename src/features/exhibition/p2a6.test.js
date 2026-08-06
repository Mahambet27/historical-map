import { describe, expect, it, vi } from "vitest";
import { hydrologySnapshots } from "../../data/exhibition/hydrologySnapshots.js";
import { historicalRiverSnapshots } from "../../data/exhibition/historicalRiverSnapshots.js";
import {
  createHistoricalBasemapStyle,
  inspectHistoricalBasemap,
  validateHistoricalBasemap,
} from "./historicalBasemapPolicy.js";
import {
  getGeographySnapshotAtYear,
  getGeographyVerificationStatus,
  getHistoricalTerrainContext,
} from "./temporalGeographyModel.js";
import { buildHistoricalPlaceCollections } from "./p1bMapDataUtils.js";
import { historicalSettlements } from "../../data/exhibition/historicalSettlements.js";
import { getPlaceNameAtYear } from "./historicalPlaceNames.js";
import {
  applyHistoricalMapPreset,
  DEFAULT_HISTORICAL_MAP_PRESET,
} from "./historicalMapPresets.js";
import {
  EXHIBITION_LAYER_ORDER,
  ensureHistoricalLayerOrder,
} from "./layerRegistry.js";

describe("P2A.6 historical basemap purity", () => {
  it("contains only a neutral background and no modern base data", () => {
    const style = createHistoricalBasemapStyle("#d7d9dc");
    expect(style.name).toBe("Qazaq Heritage Historical Canvas");
    expect(style.sources).toEqual({});
    expect(style.layers).toEqual([
      expect.objectContaining({
        id: "historical-background",
        type: "background",
        paint: { "background-color": "#d7d9dc" },
      }),
    ]);
    expect(inspectHistoricalBasemap(style).passed).toBe(true);
  });

  it("detects a forbidden road and reports policy failure", () => {
    const style = createHistoricalBasemapStyle();
    style.layers.push({ id: "road-primary", type: "line" });
    const result = validateHistoricalBasemap({ getStyle: () => style });
    expect(result.modernRoadsVisible).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("filters places and never substitutes a future modern name", () => {
    const taraz = historicalSettlements.find((item) => item.id === "taraz");
    expect(getPlaceNameAtYear(taraz, 1000, "ru")).toBe("Талас");
    expect(getPlaceNameAtYear(taraz, 1600, "ru")).toBe("");
    expect(
      buildHistoricalPlaceCollections(historicalSettlements, 1000, "ru")
        .places.features.length
    ).toBeGreaterThan(0);
  });

  it("selects discrete Aral snapshots without leaking the modern outline", () => {
    expect(getGeographySnapshotAtYear("aral-sea", 1960)?.snapshotYear).toBe(1960);
    expect(getGeographySnapshotAtYear("aral-sea", 1000)?.id).toBe(
      "aral-sea-historical-coarse"
    );
    expect(getGeographySnapshotAtYear("aral-sea", 1000)?.id).not.toBe(
      "aral-sea-modern-demo"
    );
    expect(hydrologySnapshots.every((item) => item.interpolationAllowed === false)).toBe(true);
  });

  it("selects rivers by range and reports missing geography honestly", () => {
    expect(getGeographySnapshotAtYear("syr-darya", 1000)?.id).toBe(
      "syr-darya-medieval"
    );
    expect(getGeographySnapshotAtYear("syr-darya", 1800)).toBeNull();
    expect(getGeographyVerificationStatus("unknown", 1000)).toBe(
      "data_unavailable"
    );
    expect(historicalRiverSnapshots.every((item) => item.geometryPrecision === "generalized")).toBe(true);
  });

  it("keeps terrain static and disables it in light quality", () => {
    expect(getHistoricalTerrainContext(1000)).toEqual(
      getHistoricalTerrainContext(1960)
    );
    expect(getHistoricalTerrainContext(1000, { quality: "light" }).mode).toBe("off");
  });

  it("resets to the clean historical preset", () => {
    const state = applyHistoricalMapPreset(
      { tradeRoutes: true },
      DEFAULT_HISTORICAL_MAP_PRESET
    );
    expect(state).toMatchObject({
      politicalTerritories: true,
      stateLabels: true,
      historicalPlaces: true,
      tradeRoutes: false,
    });
  });

  it("maintains a deterministic layer order", () => {
    const present = new Set(EXHIBITION_LAYER_ORDER);
    const moveLayer = vi.fn();
    ensureHistoricalLayerOrder({
      getLayer: (id) => present.has(id),
      moveLayer,
    });
    expect(moveLayer).toHaveBeenCalled();
    expect(EXHIBITION_LAYER_ORDER.indexOf("historical-state-labels")).toBeLessThan(
      EXHIBITION_LAYER_ORDER.indexOf("historical-places-selected")
    );
  });
});

