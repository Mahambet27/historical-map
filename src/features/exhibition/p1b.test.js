import { describe, expect, it, vi } from "vitest";
import { environmentSnapshots, getEnvironmentSnapshotsAtYear } from "../../data/exhibition/environmentSnapshots.js";
import { getHydrologySnapshotAtYear, hydrologySnapshots } from "../../data/exhibition/hydrologySnapshots.js";
import { historicalSettlements } from "../../data/exhibition/historicalSettlements.js";
import { getHistoricalRoutesAtYear, historicalRoutes } from "../../data/exhibition/historicalRoutes.js";
import { getRouteSegments, routeSegments } from "../../data/exhibition/routeSegments.js";
import { historicalSources } from "../../data/exhibition/sources.js";
import { historicalStories } from "../../data/exhibition/stories.js";
import { AGENT_ACTIONS } from "../agent/agentTypes.js";
import { runLocalHistoricalAgent } from "../agent/historicalAgentService.js";
import {
  getPlaceNameAtYear,
  searchPlaceByHistoricalName,
} from "./historicalPlaceNames.js";
import {
  readLayerState,
  resetLayerState,
  storeLayerState,
} from "./layerState.js";
import {
  buildEnvironmentCollection,
  buildHistoricalPlaceCollections,
  buildRouteCollections,
} from "./p1bMapDataUtils.js";
import { parseP1BUrlState } from "./p1bUrlState.js";
import {
  scheduleJourneyFrame,
  shouldAnimateJourney,
  shouldPauseJourneyForVisibility,
} from "./routeJourneyModel.js";
import { validateHistoricalStory } from "./story/historicalStoryModel.js";

describe("P1B temporal datasets", () => {
  it("selects the last applicable Aral snapshot without interpolation", () => {
    expect(getHydrologySnapshotAtYear("aral-sea", 1991)?.id).toBe(
      "aral-sea-circa-1985-demo"
    );
    expect(getHydrologySnapshotAtYear("aral-sea", 1950)?.id).toBe(
      "aral-sea-historical-coarse"
    );
  });

  it("selects environment snapshots by year", () => {
    expect(getEnvironmentSnapshotsAtYear(1000).length).toBeGreaterThan(0);
    expect(getEnvironmentSnapshotsAtYear(1700)).toHaveLength(0);
  });

  it("selects a historical city name and falls back to Russian", () => {
    const taraz = historicalSettlements.find((place) => place.id === "taraz");
    expect(getPlaceNameAtYear(taraz, 1000, "ru")).toBe("Талас");
    expect(getPlaceNameAtYear(taraz, 1000, "de")).toBe("Талас");
  });

  it("searches modern and historical names", () => {
    expect(searchPlaceByHistoricalName("талас", "ru").map((place) => place.id)).toContain("taraz");
    expect(searchPlaceByHistoricalName("тараз", "ru").map((place) => place.id)).toContain("taraz");
  });

  it("filters routes by year and validates segment order", () => {
    expect(getHistoricalRoutesAtYear(1000).map((route) => route.id)).toContain(
      "silk-road-southern-kazakhstan"
    );
    const segments = getRouteSegments("silk-road-southern-kazakhstan", 1000);
    expect(segments.map((segment) => segment.order)).toEqual([1, 2, 3, 4]);
  });

  it("references existing route places and sources", () => {
    const placeIds = new Set(historicalSettlements.map((place) => place.id));
    const sourceIds = new Set(historicalSources.map((source) => source.id));
    historicalRoutes.forEach((route) => {
      route.placeIds.forEach((id) => expect(placeIds.has(id)).toBe(true));
    });
    [
      ...environmentSnapshots,
      ...hydrologySnapshots,
      ...historicalSettlements,
      ...historicalRoutes,
      ...routeSegments,
    ].flatMap((item) => item.sourceIds).forEach((id) => {
      expect(sourceIds.has(id)).toBe(true);
    });
  });

  it("marks every demonstration geometry for review", () => {
    [...environmentSnapshots, ...hydrologySnapshots, ...routeSegments].forEach(
      (item) =>
        expect(["needs_review", "demo_only"]).toContain(
          item.verificationStatus
        )
    );
  });
});

describe("P1B layer, URL and journey state", () => {
  it("persists and reads layer state", () => {
    const storage = {
      value: "",
      getItem: vi.fn(() => storage.value),
      setItem: vi.fn((_, value) => {
        storage.value = value;
      }),
    };
    const state = { ...resetLayerState("high"), tradeRoutes: true };
    expect(storeLayerState(state, storage)).toBe(true);
    expect(readLayerState(storage, "high").tradeRoutes).toBe(true);
  });

  it("resets defaults and disables atmosphere in light quality", () => {
    expect(resetLayerState("high").politicalTerritories).toBe(true);
    expect(resetLayerState("light").atmosphere).toBe(false);
  });

  it("pauses hidden journeys and cleans a scheduled frame", () => {
    expect(shouldPauseJourneyForVisibility(true)).toBe(true);
    expect(
      shouldAnimateJourney({
        quality: "light",
        reducedMotion: false,
        hidden: false,
      })
    ).toBe(false);
    const cancelFrame = vi.fn();
    const cleanup = scheduleJourneyFrame({
      callback: vi.fn(),
      requestFrame: vi.fn(() => 42),
      cancelFrame,
    });
    cleanup();
    expect(cancelFrame).toHaveBeenCalledWith(42);
  });

  it("parses valid URL parameters and ignores invalid values", () => {
    expect(
      parseP1BUrlState(
        "?layers=routes,cities&route=silk-road&place=otrar&story=silk-road-geography&atmosphere=false"
      )
    ).toMatchObject({
      layers: ["tradeRoutes", "historicalPlaces"],
      route: "silk-road-southern-kazakhstan",
      place: "otrar",
      story: "silk-road-geography",
      atmosphere: false,
    });
    expect(parseP1BUrlState("?route=invalid&place=invalid")).toMatchObject({
      route: null,
      place: null,
    });
  });
});

describe("P1B story, fallback data and local agent", () => {
  it("ships a valid localized eight-step geography story", () => {
    const story = historicalStories.find((item) => item.id === "silk-road-geography");
    expect(validateHistoricalStory(story)).toBe(true);
    expect(story.steps).toHaveLength(8);
    expect(story.questionIds).toHaveLength(4);
  });

  it("builds the same flat collections used by Mapbox and SVG fallback", () => {
    expect(buildEnvironmentCollection(environmentSnapshots, 1000, "ru").features.length).toBeGreaterThan(0);
    expect(buildHistoricalPlaceCollections(historicalSettlements, 1000, "ru").places.features.length).toBeGreaterThan(0);
    expect(buildRouteCollections(historicalRoutes, routeSegments, 1000, "ru").trade.features).toHaveLength(4);
  });

  it("lets the local agent toggle layers and start a journey", () => {
    expect(runLocalHistoricalAgent("show-silk-road", "ru").actions).toContainEqual(
      expect.objectContaining({ type: AGENT_ACTIONS.TOGGLE_LAYER })
    );
    expect(runLocalHistoricalAgent("start-silk-journey", "ru").actions).toContainEqual(
      expect.objectContaining({ type: AGENT_ACTIONS.START_ROUTE_JOURNEY })
    );
  });

  it("exposes non-empty P1B readiness counts", () => {
    expect({
      environment: environmentSnapshots.length,
      hydrology: hydrologySnapshots.length,
      places: historicalSettlements.length,
      routes: historicalRoutes.length,
      segments: routeSegments.length,
    }).toEqual({
      environment: 3,
      hydrology: 6,
      places: 8,
      routes: 2,
      segments: 4,
    });
  });
});
