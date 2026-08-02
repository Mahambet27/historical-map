export const EXHIBITION_SYMBOL_LAYER_IDS = new Set([
  // Legacy project-owned id remains allow-listed for compatibility with
  // persisted/reloaded styles, but new Exhibition styles do not create it.
  "ex-entity-labels",
  "historical-state-labels",
  "historical-place-labels",
  "historical-hydrology-labels",
  "historical-route-labels",
]);

export const hideBaseMapLabels = (map) => {
  const layers = map.getStyle?.()?.layers || [];
  layers.forEach((layer) => {
    if (
      layer.type === "symbol" &&
      !EXHIBITION_SYMBOL_LAYER_IDS.has(layer.id) &&
      map.getLayer?.(layer.id)
    ) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  });
};

export const TERRITORY_FILL_PAINT = {
  "fill-color": ["get", "color"],
  "fill-opacity": [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    0.82,
    ["boolean", ["feature-state", "hover"], false],
    0.72,
    0.58,
  ],
};

export const TERRITORY_LINE_PAINT = {
  "line-color": [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    "#ffffff",
    ["get", "borderColor"],
  ],
  "line-width": [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    4,
    ["interpolate", ["linear"], ["zoom"], 3, 1.5, 6, 3.5],
  ],
  "line-opacity": 0.95,
};

export const getExtrusionPaint = ({ light = false, reducedMotion = false } = {}) => ({
  "fill-extrusion-color": ["get", "extrusionColor"],
  "fill-extrusion-height": light
    ? 0
    : ["case", ["boolean", ["feature-state", "selected"], false], 26000, 14000],
  "fill-extrusion-base": 0,
  "fill-extrusion-opacity": light ? 0 : reducedMotion ? 0.32 : 0.42,
  "fill-extrusion-vertical-gradient": true,
  "fill-extrusion-height-transition": { duration: reducedMotion ? 0 : 240 },
});

export const ENTITY_LABEL_LAYOUT = {
  "text-field": ["get", "label"],
  "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
  "text-size": ["interpolate", ["linear"], ["zoom"], 3, 15, 5, 23, 7, 32],
  "text-letter-spacing": 0.12,
  "text-transform": "uppercase",
  "text-allow-overlap": false,
  "text-ignore-placement": false,
  "text-max-width": 10,
  "text-anchor": "center",
  "text-rotate": ["get", "rotation"],
};

export const ENTITY_LABEL_PAINT = {
  "text-color": "#FFF7DF",
  "text-halo-color": "rgba(7, 18, 27, 0.95)",
  "text-halo-width": 2.5,
  "text-halo-blur": 1,
};

const setPaint = (map, layerId, property, value) => {
  if (map.getLayer?.(layerId)) map.setPaintProperty(layerId, property, value);
};

export const applyPaletteToMap = (map, palette) => {
  if (!map?.getStyle?.() || !palette) return;
  const layers = map.getStyle().layers || [];
  layers.forEach((layer) => {
    if (!map.getLayer?.(layer.id)) return;
    const id = layer.id.toLowerCase();
    if (layer.type === "background") {
      setPaint(map, layer.id, "background-color", palette.basemapBackground || palette.background);
    } else if (layer.type === "fill" && id.includes("water")) {
      setPaint(map, layer.id, "fill-color", palette.water);
    } else if (layer.type === "line" && id.includes("water")) {
      setPaint(map, layer.id, "line-color", palette.water);
    }
  });
  setPaint(map, "historical-places-circle", "circle-color", palette.accentLight);
  setPaint(map, "historical-places-circle", "circle-stroke-color", palette.halo);
  ["historical-state-labels", "historical-place-labels", "historical-hydrology-labels", "historical-route-labels"].forEach((id) => {
    setPaint(map, id, "text-color", palette.text);
    setPaint(map, id, "text-halo-color", palette.halo);
  });
  map.setFog?.({
    color: palette.basemapBackground || palette.background,
    "high-color": palette.surfaceStrong,
    "horizon-blend": 0.08,
  });
};
