import { getEraTheme } from "./eraThemes.js";

export const MAP_STYLE_MODES = ["era", "light", "dark", "atlas", "high-contrast"];
export const MAP_STYLE_STORAGE_KEY = "qhm.exhibition.map-style";

const STATIC_PALETTES = {
  light: {
    id: "light",
    name: "Light",
    background: "#e9e4d8",
    surface: "#f7f2e8",
    surfaceStrong: "#ded4c3",
    accent: "#9a6322",
    accentLight: "#633c12",
    secondary: "#176f70",
    text: "#1c2528",
    muted: "#566266",
    water: "#a9cbd2",
    land: "#d9d0bd",
    halo: "#f7f2e8",
  },
  dark: {
    id: "dark",
    name: "Dark",
    background: "#06131c",
    surface: "#0b2532",
    surfaceStrong: "#123846",
    accent: "#d0a354",
    accentLight: "#f0ce8e",
    secondary: "#2b9b8d",
    text: "#fffaf0",
    muted: "#aebdc1",
    water: "#092d40",
    land: "#17383c",
    halo: "#030c12",
  },
  atlas: {
    id: "atlas",
    name: "Atlas",
    background: "#241f18",
    surface: "#393126",
    surfaceStrong: "#4a3e2e",
    accent: "#bd8c48",
    accentLight: "#ead2a0",
    secondary: "#71806e",
    text: "#fbf2dc",
    muted: "#c5b8a0",
    water: "#50696b",
    land: "#665c47",
    halo: "#1a1611",
  },
  "high-contrast": {
    id: "high-contrast",
    name: "High contrast",
    background: "#000000",
    surface: "#0a0a0a",
    surfaceStrong: "#181818",
    accent: "#ffd400",
    accentLight: "#fff19a",
    secondary: "#42f5e0",
    text: "#ffffff",
    muted: "#ffffff",
    water: "#003c68",
    land: "#202020",
    halo: "#000000",
  },
};

export const resolveMapPalette = ({ mode = "era", eraId, year } = {}) => ({
    ...(mode === "era"
      ? getEraTheme({ eraId, year })
      : STATIC_PALETTES[mode] || getEraTheme({ eraId, year })),
    basemapBackground:
      mode === "dark" ? "#25282c"
        : mode === "atlas" ? "#d8d1c2"
          : mode === "high-contrast" ? "#161616"
            : mode === "light" ? "#d7d9dc"
              : "#d5d7d9",
});

export const readStoredMapStyle = (storage = window.localStorage) => {
  try {
    const value = storage?.getItem(MAP_STYLE_STORAGE_KEY);
    return MAP_STYLE_MODES.includes(value) ? value : "era";
  } catch {
    return "era";
  }
};

export const storeMapStyle = (mode, storage = window.localStorage) => {
  if (!MAP_STYLE_MODES.includes(mode)) return false;
  try {
    storage?.setItem(MAP_STYLE_STORAGE_KEY, mode);
    return true;
  } catch {
    return false;
  }
};

export const paletteToCssVariables = (palette) => ({
  "--ex-bg": palette.background,
  "--ex-surface": palette.surface,
  "--ex-surface-strong": palette.surfaceStrong,
  "--ex-gold": palette.accent,
  "--ex-gold-light": palette.accentLight,
  "--ex-teal": palette.secondary,
  "--ex-text": palette.text,
  "--ex-muted": palette.muted,
  "--ex-water": palette.water,
  "--ex-land": palette.land,
  "--ex-map-bg": palette.basemapBackground,
});
