import { attachAtlasTerrain, terrainEnabled } from "./atlasTerrain.js";
import { Map as LibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
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
      map.off("mouseenter", ATLAS_PLACES_LAYER, enter);
      map.off("mouseleave", ATLAS_PLACES_LAYER, leave);
      map.getCanvas().removeEventListener("webglcontextlost", contextLost);
      map.remove();
    },
  };
}
