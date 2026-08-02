export const createKioskResetState = ({
  language = "ru",
  qualityMode = "auto",
  effectiveQuality = "auto",
} = {}) => ({
  started: true,
  selectedYear: 1465,
  selectedEraId: "kazakh-khanate",
  selectedEntity: null,
  panel: null,
  storyId: null,
  comparison: null,
  selectedRouteId: null,
  routeJourneyActive: false,
  atmosphereAnimating: false,
  historicalMapPreset: "clean",
  language,
  qualityMode,
  effectiveQuality,
});

