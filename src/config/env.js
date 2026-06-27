export const MAPBOX_TOKEN_ENV_NAME = "VITE_MAPBOX_TOKEN";
export const MAPBOX_TOKEN_PLACEHOLDER = "your_mapbox_public_token_here";
export const SUPABASE_URL_ENV_NAME = "VITE_SUPABASE_URL";
export const SUPABASE_ANON_KEY_ENV_NAME = "VITE_SUPABASE_ANON_KEY";
export const SUPABASE_URL_PLACEHOLDER = "your_supabase_project_url";
export const SUPABASE_ANON_KEY_PLACEHOLDER = "your_supabase_anon_key";

const readStringEnv = (name) => {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
};

export const APP_NAME = readStringEnv("VITE_APP_NAME") || "Qazaq Heritage Map";
export const MAPBOX_TOKEN = readStringEnv(MAPBOX_TOKEN_ENV_NAME);
export const SUPABASE_URL = readStringEnv(SUPABASE_URL_ENV_NAME);
export const SUPABASE_ANON_KEY = readStringEnv(SUPABASE_ANON_KEY_ENV_NAME);

export const isMapboxTokenConfigured =
  Boolean(MAPBOX_TOKEN) && MAPBOX_TOKEN !== MAPBOX_TOKEN_PLACEHOLDER;

export const hasSupabaseConfig =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  SUPABASE_URL !== SUPABASE_URL_PLACEHOLDER &&
  SUPABASE_ANON_KEY !== SUPABASE_ANON_KEY_PLACEHOLDER;
