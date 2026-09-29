export const TERRITORIES_SOURCE = "atlas-historical-territories";
export const BORDERS_SOURCE = "atlas-historical-borders";
export const TERRITORIES_LAYER = "atlas-historical-territories-fill";
export const BORDERS_LAYER = "atlas-historical-borders-line";
export const ROUTES_SOURCE = "atlas-historical-routes";
export const EVENTS_SOURCE = "atlas-historical-events";
export const ROUTES_LAYER = "atlas-historical-routes-line";
export const EVENTS_LAYER = "atlas-historical-events-point";
export const LABELS_LAYER = "atlas-historical-territory-labels";
export const historicalSources = [
  ["territories", TERRITORIES_SOURCE, TERRITORIES_LAYER, "territories"],
  ["borders", BORDERS_SOURCE, BORDERS_LAYER, "borders"],
  ["routes", ROUTES_SOURCE, ROUTES_LAYER, "trade"],
  ["events", EVENTS_SOURCE, EVENTS_LAYER, "events"],
];

export const historicalLayers = [
  {
    id: TERRITORIES_LAYER,
    source: TERRITORIES_SOURCE,
    type: "fill",
    paint: {
      "fill-color": "#c6a15b",
      "fill-opacity": ["match", ["get", "confidenceLevel"], "high", 0.22, "medium", 0.16, 0.1],
    },
  },
  {
    id: BORDERS_LAYER,
    source: BORDERS_SOURCE,
    type: "line",
    paint: {
      "line-color": "#e2bd77",
      "line-width": 1.8,
      "line-opacity": 0.85,
      "line-dasharray": [4, 3],
    },
  },
  {
    id: LABELS_LAYER, source: TERRITORIES_SOURCE, type: "symbol",
    layout: {
      "text-field": ["get", "name_ru"], "text-font": ["Noto Sans Regular"],
      "text-size": 15, "text-max-width": 12,
    },
    paint: { "text-color": "#fff0bb", "text-halo-color": "#14212b", "text-halo-width": 2 },
  },
  {
    id: ROUTES_LAYER, source: ROUTES_SOURCE, type: "line",
    paint: { "line-color": "#73cbb7", "line-width": 3, "line-dasharray": [3, 2] },
  },
  {
    id: EVENTS_LAYER, source: EVENTS_SOURCE, type: "circle",
    paint: { "circle-color": "#ed997e", "circle-radius": 7, "circle-stroke-width": 2, "circle-stroke-color": "#14212b" },
  },
];
