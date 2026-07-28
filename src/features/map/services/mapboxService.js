import { getMapboxTokenError, mapboxToken } from "../../../config/env.js";

export const validateMapboxToken = (token = mapboxToken) => {
  if (typeof token !== "string" || !token.trim()) return "Mapbox token is missing.";
  if (!token.trim().startsWith("pk.")) return "Mapbox token must be public.";
  return "";
};

export async function loadMapbox() {
  const error = getMapboxTokenError();
  if (error) throw new Error(error);
  const [{ default: mapboxgl }] = await Promise.all([
    import("mapbox-gl"),
    import("mapbox-gl/dist/mapbox-gl.css"),
  ]);
  mapboxgl.accessToken = mapboxToken;
  return mapboxgl;
}
