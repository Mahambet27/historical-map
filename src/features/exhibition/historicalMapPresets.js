export const DEFAULT_HISTORICAL_MAP_PRESET = "clean";

export const HISTORICAL_MAP_PRESETS = Object.freeze({
  clean: {
    politicalTerritories: true,
    stateLabels: true,
    historicalPlaces: true,
    archaeology: false,
    hydrology: false,
    environment: false,
    terrain: true,
    tradeRoutes: false,
    nomadicRoutes: false,
    militaryRoutes: false,
  },
  political: {
    politicalTerritories: true,
    stateLabels: true,
    historicalPlaces: true,
    archaeology: false,
    hydrology: false,
    environment: false,
    terrain: false,
    tradeRoutes: false,
    nomadicRoutes: false,
    militaryRoutes: false,
  },
  geography: {
    politicalTerritories: false,
    stateLabels: false,
    historicalPlaces: true,
    archaeology: false,
    hydrology: true,
    environment: true,
    terrain: true,
    tradeRoutes: false,
    nomadicRoutes: false,
    militaryRoutes: false,
  },
  routes: {
    politicalTerritories: true,
    stateLabels: false,
    historicalPlaces: true,
    archaeology: false,
    hydrology: true,
    environment: false,
    terrain: false,
    tradeRoutes: true,
    nomadicRoutes: true,
    militaryRoutes: true,
  },
});

export const applyHistoricalMapPreset = (state, presetId, quality = "auto") => {
  const preset =
    HISTORICAL_MAP_PRESETS[presetId] ||
    HISTORICAL_MAP_PRESETS[DEFAULT_HISTORICAL_MAP_PRESET];
  return {
    ...state,
    ...preset,
    terrain: quality === "light" ? false : preset.terrain,
  };
};

