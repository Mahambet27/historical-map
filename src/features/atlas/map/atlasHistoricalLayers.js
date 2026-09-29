export const TERRITORIES_SOURCE = "atlas-historical-territories";
export const BORDERS_SOURCE = "atlas-historical-borders";
export const TERRITORIES_LAYER = "atlas-historical-territories-fill";
export const BORDERS_LAYER = "atlas-historical-borders-line";

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
];
