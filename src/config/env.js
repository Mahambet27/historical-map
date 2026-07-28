export const SUPABASE_URL_ENV_NAME = "VITE_SUPABASE_URL";
export const SUPABASE_ANON_KEY_ENV_NAME = "VITE_SUPABASE_ANON_KEY";
export const SUPABASE_URL_PLACEHOLDER = "your_supabase_project_url";
export const SUPABASE_ANON_KEY_PLACEHOLDER = "your_supabase_anon_key";

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

export { mapboxToken };

const readStringEnv = (name) => {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
};

export const APP_NAME = readStringEnv("VITE_APP_NAME") || "Qazaq Heritage Map";
export const SUPABASE_URL = readStringEnv(SUPABASE_URL_ENV_NAME);
export const SUPABASE_ANON_KEY = readStringEnv(SUPABASE_ANON_KEY_ENV_NAME);

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
