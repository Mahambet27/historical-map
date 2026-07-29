const theme = (id, name, colors) => ({ id, name, ...colors });

export const ERA_THEMES = {
  saka: theme("saka-gold", "Saka Gold", {
    background: "#17130d",
    surface: "#272016",
    surfaceStrong: "#342819",
    accent: "#d9a441",
    accentLight: "#f4d58d",
    secondary: "#8f5f31",
    text: "#fff8e8",
    muted: "#c8bda7",
    water: "#173b43",
    land: "#30291e",
    halo: "#120e08",
  }),
  turkic: theme("turkic-azure", "Turkic Azure", {
    background: "#071d2b",
    surface: "#0d3144",
    surfaceStrong: "#12445a",
    accent: "#39a7c4",
    accentLight: "#9fe7f3",
    secondary: "#cf9a46",
    text: "#f2fbff",
    muted: "#a8c5ce",
    water: "#092a40",
    land: "#173744",
    halo: "#04131d",
  }),
  "kazakh-khanate": theme("khanate-steppe", "Kazakh Khanate Steppe", {
    background: "#071722",
    surface: "#102c39",
    surfaceStrong: "#183e49",
    accent: "#d0a354",
    accentLight: "#f0ce8e",
    secondary: "#2b9b8d",
    text: "#fffaf0",
    muted: "#b8c3c5",
    water: "#0b3040",
    land: "#1a3938",
    halo: "#06131b",
  }),
  imperial: theme("imperial-atlas", "Imperial Atlas", {
    background: "#211d18",
    surface: "#342e25",
    surfaceStrong: "#463b2d",
    accent: "#b8945c",
    accentLight: "#e5d0a5",
    secondary: "#6f7d69",
    text: "#f7f0df",
    muted: "#c6baa4",
    water: "#394d52",
    land: "#51493a",
    halo: "#181511",
  }),
  "kazakh-ssr": theme("soviet-constructive", "Soviet Constructive", {
    background: "#181a1c",
    surface: "#2a2d30",
    surfaceStrong: "#3b3e40",
    accent: "#d94a3d",
    accentLight: "#f3a36e",
    secondary: "#d8bd63",
    text: "#fff7e8",
    muted: "#c1beb5",
    water: "#273c47",
    land: "#3c403b",
    halo: "#111214",
  }),
  "independent-kazakhstan": theme(
    "independent-digital",
    "Independent Kazakhstan Digital",
    {
      background: "#031d2a",
      surface: "#073849",
      surfaceStrong: "#0a5061",
      accent: "#21b9ad",
      accentLight: "#8ef0df",
      secondary: "#e4b54e",
      text: "#f2fffd",
      muted: "#a7d0ce",
      water: "#06344d",
      land: "#124950",
      halo: "#02141e",
    }
  ),
};

export const getEraThemeKey = ({ eraId, year } = {}) => {
  if (year >= 1848 && year < 1936) return "imperial";
  if (year >= 1936 && year < 1991) return "kazakh-ssr";
  if (year >= 1991) return "independent-kazakhstan";
  return ERA_THEMES[eraId] ? eraId : "kazakh-khanate";
};

export const getEraTheme = (options) => ERA_THEMES[getEraThemeKey(options)];

