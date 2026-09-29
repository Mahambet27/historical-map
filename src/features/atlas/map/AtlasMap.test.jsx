import localStyle from "../../../../public/maps/style.json";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { mapInstances, mockSettings } from "./maplibreTestMock.js";
import {
  ATLAS_PLACES_SOURCE,
  ATLAS_PLACES_LAYER,
  resolveAtlasBasemapConfig,
} from "./atlasMapConfig.js";
import AtlasPage from "../AtlasPage.jsx";
import { adaptAtlasSnapshot, atlasObjectsToGeoJSON } from "../data/atlasSnapshotAdapter.js";
import { buildAtlasHistoricalSnapshot } from "../data/atlasHistoricalData.js";
import {
  TERRITORIES_SOURCE,
  BORDERS_SOURCE,
  TERRITORIES_LAYER,
  BORDERS_LAYER,
} from "./atlasHistoricalLayers.js";
vi.mock("maplibre-gl", async () => (await import("./maplibreTestMock.js")).mockMapLibre);
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

it.each(["remote", "self-hosted"])(
  "creates a %s GIS canvas and updates the same source/map when year changes",
  (mode) => {
    vi.stubEnv("VITE_ATLAS_BASEMAP_MODE", mode);
    vi.stubEnv("VITE_ATLAS_STYLE_URL", "/maps/style.json");
    const { container, unmount } = render(<AtlasPage />);
    expect(container.querySelector("canvas.maplibregl-canvas")).toBeInTheDocument();
    const map = mapInstances[0];
    expect(map.options).toMatchObject({
      center: [67, 48],
      style: resolveAtlasBasemapConfig({ VITE_ATLAS_BASEMAP_MODE: mode }).styleUrl,
      maxPitch: 65,
    });
    const source = map.getSource(ATLAS_PLACES_SOURCE);
    expect(source.data.features).toHaveLength(6);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1200" } });
    expect(source.setData).toHaveBeenLastCalledWith(
      expect.objectContaining({ features: expect.any(Array) })
    );
    expect(source.data.features).toHaveLength(8);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "-550" } });
    expect(source.data.features).toEqual([]);
    expect(mapInstances).toHaveLength(1);
    expect(map.addSource).toHaveBeenCalledTimes(3);
    unmount();
    expect(map.remove).toHaveBeenCalledTimes(1);
  }
);
it("selects a GeoJSON feature through the map click handler", () => {
  render(<AtlasPage />);
  act(() => mapInstances[0].handlers.click({ features: [{ properties: { objectId: "otrar" } }] }));
  expect(screen.getByRole("heading", { name: "Отырар" })).toBeInTheDocument();
  expect(mapInstances[0].flyTo).toHaveBeenCalledWith(
    expect.objectContaining({ center: [68.3, 42.85], zoom: 7 })
  );
  expect(
    mapInstances[0]
      .getSource(ATLAS_PLACES_SOURCE)
      .data.features.find((feature) => feature.id === "otrar").properties.selected
  ).toBe(true);
  expect(mapInstances[0].addLayer).toHaveBeenCalledWith(
    expect.objectContaining({
      id: ATLAS_PLACES_LAYER,
      type: "circle",
      paint: expect.objectContaining({
        "circle-radius": ["case", ["==", ["get", "selected"], true], 10, 6],
      }),
    })
  );
});
it("converts snapshot coordinates to detached WGS84 GeoJSON without sketch clipping", () => {
  const view = adaptAtlasSnapshot(buildAtlasHistoricalSnapshot(1465));
  const geojson = atlasObjectsToGeoJSON(view.objects, "en", "otrar");
  expect(geojson.features.find((feature) => feature.id === "otrar")).toMatchObject({
    geometry: { type: "Point", coordinates: [68.3, 42.85] },
    properties: { name: "Otrar", objectId: "otrar", selected: true },
  });
  expect(geojson.features[0].geometry.coordinates).not.toBe(view.objects[0].coordinates);
  expect(
    atlasObjectsToGeoJSON(
      [
        { id: "global", coordinates: [0, 0] },
        { id: "bad", coordinates: [200, 0] },
      ],
      "ru"
    ).features.map((feature) => feature.id)
  ).toEqual(["global"]);
  expect(atlasObjectsToGeoJSON([], "ru")).toEqual({ type: "FeatureCollection", features: [] });
});

it("uses the latest snapshot when style finishes loading, without creating a second map", () => {
  mockSettings.autoLoad = false;
  render(<AtlasPage />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "-550" } });
  act(() => mapInstances[0].handlers.load());
  expect(mapInstances[0].getSource(ATLAS_PLACES_SOURCE).data.features).toEqual([]);
  expect(mapInstances).toHaveLength(1);
});

it("flies to search selection without DOM markers or a Mapbox token", () => {
  vi.stubEnv("VITE_MAPBOX_TOKEN", "");
  const { container } = render(<AtlasPage />);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Otrar" } });
  fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter" });
  expect(mapInstances[0].flyTo).toHaveBeenCalledWith(
    expect.objectContaining({ center: [68.3, 42.85] })
  );
  expect(container.querySelectorAll(".atlas-marker")).toHaveLength(0);
  expect(mapInstances[0].options).not.toHaveProperty("accessToken");
  vi.unstubAllEnvs();
});

it.each(["remote", "self-hosted"])(
  "disposes failed %s GIS and preserves selectable snapshot objects in the placeholder",
  (mode) => {
    vi.stubEnv("VITE_ATLAS_BASEMAP_MODE", mode);
    mockSettings.autoLoad = false;
    const { container } = render(<AtlasPage />);
    act(() => mapInstances[0].handlers.error());
    expect(mapInstances[0].remove).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".atlas-map-fallback")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Выбранный объект: Отырар" }));
    expect(screen.getByRole("heading", { name: "Отырар" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "-550" } });
    expect(container.querySelectorAll(".atlas-marker")).toHaveLength(0);
  }
);

it("appends a valid historical GeoJSON overlay above every local basemap layer", () => {
  vi.stubEnv("VITE_ATLAS_BASEMAP_MODE", "self-hosted");
  render(<AtlasPage />);
  const map = mapInstances[0];
  const [overlay, beforeId] = map.addLayer.mock.calls.find(
    ([layer]) => layer.id === ATLAS_PLACES_LAYER
  );
  expect(beforeId).toBeUndefined();
  expect(overlay.source).toBe(ATLAS_PLACES_SOURCE);
  const combined = {
    ...localStyle,
    sources: {
      ...localStyle.sources,
      [ATLAS_PLACES_SOURCE]: { type: "geojson", data: map.getSource(ATLAS_PLACES_SOURCE).data },
    },
    layers: [...localStyle.layers, overlay],
  };
  expect(combined.layers.at(-1).id).toBe(ATLAS_PLACES_LAYER);
  expect(validateStyleMin(combined)).toEqual([]);
});

it("updates reviewed territories and borders in place, clears absent years and preserves modern style", () => {
  render(<AtlasPage />);
  const map = mapInstances[0];
  const territories = map.getSource(TERRITORIES_SOURCE),
    borders = map.getSource(BORDERS_SOURCE);
  expect(territories.data.features.map((f) => f.id)).toEqual(["khanate-1465"]);
  expect(borders.data.features).toEqual(territories.data.features);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "1510" } });
  expect(territories.data.features.map((f) => f.id)).toEqual(["khanate-1510"]);
  expect(borders.setData).toHaveBeenCalled();
  fireEvent.change(screen.getByRole("slider"), { target: { value: "1522" } });
  expect(territories.data.features).toEqual([]);
  expect(borders.data.features).toEqual([]);
  expect(mapInstances).toHaveLength(1);
  expect(map.addSource).toHaveBeenCalledTimes(3);
  expect(map.addLayer).toHaveBeenCalledTimes(3);
  for (const [name, layer] of [
    ["Исторические территории", TERRITORIES_LAYER],
    ["Исторические границы", BORDERS_LAYER],
  ]) {
    fireEvent.click(screen.getByRole("switch", { name }));
    expect(map.setLayoutProperty).toHaveBeenLastCalledWith(layer, "visibility", "none");
    fireEvent.click(screen.getByRole("switch", { name }));
    expect(map.setLayoutProperty).toHaveBeenLastCalledWith(layer, "visibility", "visible");
  }
  expect(
    map.setLayoutProperty.mock.calls.every(([id]) =>
      [TERRITORIES_LAYER, BORDERS_LAYER].includes(id)
    )
  ).toBe(true);
  const combined = {
    ...localStyle,
    sources: {
      ...localStyle.sources,
      ...Object.fromEntries(
        Object.entries(map.sources).map(([id, source]) => [
          id,
          { type: "geojson", data: source.data },
        ])
      ),
    },
    layers: [...localStyle.layers, ...map.addLayer.mock.calls.map(([layer]) => layer)],
  };
  expect(validateStyleMin(combined)).toEqual([]);
});

it("opens the existing entity card, gives points priority and clears stale territory selection", () => {
  render(<AtlasPage />);
  const map = mapInstances[0];
  const click = () =>
    map.handlers[`click:${TERRITORIES_LAYER}`]({
      point: { x: 0, y: 0 },
      features: [{ properties: { entityId: "kazakh-khanate" } }],
    });
  map.queryRenderedFeatures.mockReturnValueOnce([{}]);
  act(click);
  expect(
    screen.queryByRole("heading", { level: 2, name: "Казахское ханство" })
  ).not.toBeInTheDocument();
  act(click);
  expect(screen.getByRole("heading", { level: 2, name: "Казахское ханство" })).toBeInTheDocument();
  expect(map.flyTo).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("slider"), { target: { value: "1522" } });
  expect(screen.queryByRole("complementary", { name: "Карточка объекта" })).not.toBeInTheDocument();
});
