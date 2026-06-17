export const MAPBOX_TOKEN_ENV_NAME = "VITE_MAPBOX_TOKEN";
export const MAPBOX_TOKEN_PLACEHOLDER = "your_mapbox_public_token_here";

const readStringEnv = (name) => {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
};

export const APP_NAME = readStringEnv("VITE_APP_NAME") || "Qazaq Heritage Map";
export const MAPBOX_TOKEN = readStringEnv(MAPBOX_TOKEN_ENV_NAME);

export const isMapboxTokenConfigured =
  Boolean(MAPBOX_TOKEN) && MAPBOX_TOKEN !== MAPBOX_TOKEN_PLACEHOLDER;
