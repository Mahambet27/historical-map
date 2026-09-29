import { attachAtlasTerrain, terrainEnabled } from "./atlasTerrain.js";
import { Map as LibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import {
  TERRITORIES_LAYER,
  ROUTES_LAYER,
  EVENTS_LAYER,
  LABELS_LAYER,
  historicalSources,
  historicalLayers,
} from "./atlasHistoricalLayers.js";
import {
  getAtlasBasemapConfig,
  ATLAS_MAP_VIEW,
  ATLAS_PLACES_SOURCE,
  ATLAS_PLACES_LAYER,
} from "./atlasMapConfig.js";

setWorkerUrl(workerUrl);
const empty = { type: "FeatureCollection", features: [] };

/** GeoJSON renderer only. No knowledge of historical datasets or temporal rules. */
export function createAtlasMap(container, onStatus) {
  const { styleUrl } = getAtlasBasemapConfig();
  const map = new LibreMap({
    container,
    style: styleUrl,
    ...ATLAS_MAP_VIEW,
    maxPitch: 65,
    renderWorldCopies: false,
    // Keep the provider's default attribution. Navigation is the only added control.
    attributionControl: { compact: true },
  });
  map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
  let state = { geojson: empty, selectedId: null, onSelect: () => {} };
  let ready = false;
  let disposeTerrain = () => {};
  let disposed = false;
  let lastData = null;
  let lastSelected = null;
  const lastHistorical = new Map();
  const visibility = new Map();
  let labelLanguage = null;
  const historicalData = (key) => state.historical?.[key] || empty;
  const syncHistorical = () => {
    for (const [key, source, layer, toggle] of historicalSources) {
      const data = historicalData(key);
      if (lastHistorical.get(source) !== data) {
        map
          .getSource(source)
          .setData(data)
          ?.catch?.(() => {
            if (!disposed) onStatus("error");
          });
        lastHistorical.set(source, data);
      }
      const next = state.layers?.[toggle] ? "visible" : "none";
      if (visibility.get(layer) !== next) {
        map.setLayoutProperty(layer, "visibility", next);
        visibility.set(layer, next);
      }
    }
    const labelsVisible = state.layers?.territories && state.layers?.labels ? "visible" : "none";
    if (visibility.get(LABELS_LAYER) !== labelsVisible) {
      map.setLayoutProperty(LABELS_LAYER, "visibility", labelsVisible);
      visibility.set(LABELS_LAYER, labelsVisible);
    }
    const language = state.language || "ru";
    if (labelLanguage !== language) {
      map.setLayoutProperty(LABELS_LAYER, "text-field", ["get", `name_${language}`]);
      labelLanguage = language;
    }
  };
  const timeout = window.setTimeout(() => {
    if (!ready && !disposed) onStatus("error");
  }, 20000);
  const flyToSelection = () => {
    if (!ready || lastSelected === state.selectedId) return;
    lastSelected = state.selectedId;
    const selected = state.geojson.features.find(
      (feature) => feature.properties.objectId === state.selectedId
    );
    if (selected)
      map.flyTo({
        center: selected.geometry.coordinates,
        zoom: Math.max(map.getZoom(), 7),
        duration: 900,
      });
  };
  const sync = () => {
    if (!ready || disposed) return;
    syncHistorical();
    if (lastData !== state.geojson) {
      lastData = state.geojson;
      map
        .getSource(ATLAS_PLACES_SOURCE)
        .setData(state.geojson)
        ?.catch?.(() => {
          if (!disposed) onStatus("error");
        });
    }
    flyToSelection();
  };
  const load = () => {
    if (disposed) return;
    window.clearTimeout(timeout);
    for (const [key, id] of historicalSources) {
      map.addSource(id, { type: "geojson", data: historicalData(key) });
      lastHistorical.set(id, historicalData(key));
    }
    for (const layer of historicalLayers) map.addLayer(layer);
    map.addSource(ATLAS_PLACES_SOURCE, { type: "geojson", data: state.geojson });
    map.addLayer({
      id: ATLAS_PLACES_LAYER,
      type: "circle",
      source: ATLAS_PLACES_SOURCE,
      paint: {
        "circle-radius": ["case", ["==", ["get", "selected"], true], 10, 6],
        "circle-color": ["case", ["==", ["get", "selected"], true], "#fff0bb", "#d2b478"],
        "circle-stroke-color": "#14212b",
        "circle-stroke-width": 2,
      },
    });
    lastData = state.geojson;
    ready = true;
    syncHistorical();
    flyToSelection();
    onStatus("ready");
    disposeTerrain = attachAtlasTerrain(map, terrainEnabled(import.meta.env));
  };
  const click = (event) => {
    const id = event.features?.[0]?.properties?.objectId;
    if (state.geojson.features.some((feature) => feature.properties.objectId === id))
      state.onSelect(id);
  };
  const error = () => {
    if (!disposed && !ready) onStatus("error");
  };
  const territoryClick = (event) => {
    if (!state.layers?.territories) return;
    // Place selection wins where point and territory layers overlap.
    if (map.queryRenderedFeatures(event.point, { layers: [ATLAS_PLACES_LAYER, EVENTS_LAYER, ROUTES_LAYER] }).length) return;
    const id = event.features?.[0]?.properties?.entityId;
    if (
      id &&
      historicalData("territories").features.some((feature) => feature.properties.entityId === id)
    )
      state.onSelectEntity?.(id);
  };
  const overlayClick = (key, toggle, higherLayers) => (event) => {
    if (!state.layers?.[toggle]) return;
    if (map.queryRenderedFeatures(event.point, { layers: higherLayers }).length) return;
    const id = event.features?.[0]?.properties?.objectId;
    if (id && historicalData(key).features.some((f) => f.properties.objectId === id))
      state.onSelectOverlay?.(id);
  };
  const routeClick = overlayClick("routes", "trade", [ATLAS_PLACES_LAYER, EVENTS_LAYER]);
  const eventClick = overlayClick("events", "events", [ATLAS_PLACES_LAYER]);
  const enter = () => {
    map.getCanvas().style.cursor = "pointer";
  };
  const leave = () => {
    map.getCanvas().style.cursor = "";
  };
  const contextLost = () => {
    if (!disposed) onStatus("error");
  };
  map.on("load", load);
  map.on("error", error);
  map.on("click", TERRITORIES_LAYER, territoryClick);
  map.on("mouseenter", TERRITORIES_LAYER, enter);
  map.on("mouseleave", TERRITORIES_LAYER, leave);
  for (const [layer, handler] of [[ROUTES_LAYER, routeClick], [EVENTS_LAYER, eventClick]]) {
    map.on("click", layer, handler);
    map.on("mouseenter", layer, enter);
    map.on("mouseleave", layer, leave);
  }
  map.on("click", ATLAS_PLACES_LAYER, click);
  map.on("mouseenter", ATLAS_PLACES_LAYER, enter);
  map.on("mouseleave", ATLAS_PLACES_LAYER, leave);
  map.getCanvas().addEventListener("webglcontextlost", contextLost);
  const resize =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => map.resize());
  resize?.observe(container);
  return {
    update(next) {
      state = next;
      sync();
      container
        .querySelectorAll(
          ".maplibregl-ctrl-zoom-in, .maplibregl-ctrl-zoom-out, .maplibregl-ctrl-compass"
        )
        .forEach((control, index) => {
          const label = [state.text.zoomIn, state.text.zoomOut, state.text.resetView][index];
          control.setAttribute("aria-label", label);
          control.title = label;
        });
      map.getCanvas().setAttribute("aria-label", `${state.text.map} — GIS`);
    },
    dispose() {
      disposed = true;
      disposeTerrain();
      window.clearTimeout(timeout);
      resize?.disconnect();
      map.off("load", load);
      map.off("error", error);
      map.off("click", ATLAS_PLACES_LAYER, click);
      map.off("click", TERRITORIES_LAYER, territoryClick);
      map.off("mouseenter", TERRITORIES_LAYER, enter);
      map.off("mouseleave", TERRITORIES_LAYER, leave);
      for (const [layer, handler] of [[ROUTES_LAYER, routeClick], [EVENTS_LAYER, eventClick]]) {
        map.off("click", layer, handler);
        map.off("mouseenter", layer, enter);
        map.off("mouseleave", layer, leave);
      }
      map.off("mouseenter", ATLAS_PLACES_LAYER, enter);
      map.off("mouseleave", ATLAS_PLACES_LAYER, leave);
      map.getCanvas().removeEventListener("webglcontextlost", contextLost);
      map.remove();
    },
  };
}
