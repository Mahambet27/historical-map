export const QUALITY_MODES = ["auto", "high", "balanced", "light"];

export const QUALITY_PROFILES = {
  high: {
    mode: "high",
    antialias: true,
    terrainExaggeration: 2.4,
    maxPixelRatio: 2,
    animations: true,
  },
  balanced: {
    mode: "balanced",
    antialias: true,
    terrainExaggeration: 1.6,
    maxPixelRatio: 1.5,
    animations: true,
  },
  light: {
    mode: "light",
    antialias: false,
    terrainExaggeration: 0,
    maxPixelRatio: 1,
    animations: false,
  },
};
