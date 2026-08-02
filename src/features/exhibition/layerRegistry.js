const layer = (
  id,
  category,
  defaultEnabled,
  {
    minZoom = 0,
    maxZoom = 24,
    supportedQualityModes = ["auto", "high", "light"],
    requiresInternet = false,
    verificationStatus = "reviewed",
  } = {}
) => ({
  id,
  category,
  defaultEnabled,
  minZoom,
  maxZoom,
  supportedQualityModes,
  requiresInternet,
  verificationStatus,
});

export const EXHIBITION_LAYERS = [
  layer("archiveMaps", "research", false, { verificationStatus: "reviewed" }),
  layer("politicalTerritories", "politics", true),
  layer("stateLabels", "politics", true),
  layer("uncertainty", "politics", true),
  layer("historicalPlaces", "places", true, { minZoom: 3.5 }),
  layer("archaeology", "places", false, { minZoom: 5 }),
  layer("tradeRoutes", "routes", false, { verificationStatus: "needs_review" }),
  layer("nomadicRoutes", "routes", false, { verificationStatus: "needs_review" }),
  layer("militaryRoutes", "routes", false, { verificationStatus: "needs_review" }),
  layer("hydrology", "environment", false, { verificationStatus: "needs_review" }),
  layer("environment", "environment", false, { verificationStatus: "needs_review" }),
  layer("terrain", "environment", true, {
    supportedQualityModes: ["auto", "high"],
    verificationStatus: "needs_review",
  }),
  layer("events", "education", true),
  layer("people", "education", true),
  layer("3dObjects", "education", false, { supportedQualityModes: ["auto", "high"] }),
  layer("atmosphere", "environment", false, { supportedQualityModes: ["auto", "high"] }),
];

export const EXHIBITION_LAYER_ORDER = [
  "archive-map-overlay-layer",
  "historical-terrain-subtle",
  "ex-environment-fill",
  "ex-hydrology-fill",
  "ex-hydrology-line",
  "ex-territories-fill",
  "ex-territories-extrusion",
  "ex-territories-line",
  "historical-boundary-uncertainty",
  "historical-boundary-patterned",
  "historical-boundary-schematic",
  "ex-trade-route-glow",
  "ex-trade-route-line",
  "ex-trade-route-arrows",
  "ex-nomadic-route-line",
  "ex-military-route-line",
  "ex-diplomatic-route-line",
  "historical-places-circle",
  "historical-places-symbol",
  "historical-places-capital",
  "historical-places-archaeology",
  "historical-state-labels",
  "historical-place-labels",
  "historical-hydrology-labels",
  "historical-route-labels",
  "ex-comparison-fill",
  "ex-comparison-line",
  "historical-places-selected",
];

export const layerRegistryById = new Map(
  EXHIBITION_LAYERS.map((entry) => [entry.id, entry])
);

export const getDefaultLayerState = () =>
  Object.fromEntries(
    EXHIBITION_LAYERS.map((entry) => [entry.id, entry.defaultEnabled])
  );

export const ensureExhibitionLayerOrder = (map) => {
  const existing = EXHIBITION_LAYER_ORDER.filter((id) => map.getLayer(id));
  existing.forEach((id, index) => {
    const beforeId = existing[index + 1];
    map.moveLayer(id, beforeId);
  });
};

export const ensureHistoricalLayerOrder = ensureExhibitionLayerOrder;
