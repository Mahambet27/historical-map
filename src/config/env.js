export const SUPABASE_URL_ENV_NAME = "VITE_SUPABASE_URL";
export const SUPABASE_ANON_KEY_ENV_NAME = "VITE_SUPABASE_ANON_KEY";
export const SUPABASE_URL_PLACEHOLDER = "your_supabase_project_url";
export const SUPABASE_ANON_KEY_PLACEHOLDER = "your_supabase_anon_key";
export const HISTORICAL_DATA_SOURCE_ENV_NAME = "VITE_HISTORICAL_DATA_SOURCE";
export const HISTORICAL_DATA_SOURCES = ["local", "supabase", "auto"];

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

export { mapboxToken };

const readStringEnv = (name) => {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
};

export const APP_NAME = readStringEnv("VITE_APP_NAME") || "Qazaq Heritage Map";
export const SUPABASE_URL = readStringEnv(SUPABASE_URL_ENV_NAME);
export const SUPABASE_ANON_KEY = readStringEnv(SUPABASE_ANON_KEY_ENV_NAME);
const requestedHistoricalDataSource = readStringEnv(
  HISTORICAL_DATA_SOURCE_ENV_NAME
).toLowerCase();
export const HISTORICAL_DATA_SOURCE = HISTORICAL_DATA_SOURCES.includes(
  requestedHistoricalDataSource
)
  ? requestedHistoricalDataSource
  : "auto";

export const getMapboxTokenError = () => {
  if (typeof mapboxToken !== "string" || !mapboxToken.trim()) {
    return "VITE_MAPBOX_TOKEN is missing or empty.";
  }

  if (!mapboxToken.trim().startsWith("pk.")) {
    return 'VITE_MAPBOX_TOKEN must be a public Mapbox token beginning with "pk.".';
  }

  return "";
};

export const isMapboxTokenConfigured = !getMapboxTokenError();

export const hasSupabaseConfig =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  SUPABASE_URL !== SUPABASE_URL_PLACEHOLDER &&
  SUPABASE_ANON_KEY !== SUPABASE_ANON_KEY_PLACEHOLDER;
