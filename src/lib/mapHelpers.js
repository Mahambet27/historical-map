import mapboxgl from "mapbox-gl";

export const normalizeName = (s) => {
  if (!s) return "";
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replaceAll("ә", "а")
    .replaceAll("қ", "к")
    .replaceAll("ң", "н")
    .replaceAll("ғ", "г")
    .replaceAll("ө", "о")
    .replaceAll("ү", "у")
    .replaceAll("ұ", "у")
    .replaceAll("һ", "х")
    .replaceAll("і", "и");
};

export const isLngLatOk = (coords) =>
  Array.isArray(coords) &&
  coords.length >= 2 &&
  Number.isFinite(coords[0]) &&
  Number.isFinite(coords[1]) &&
  Math.abs(coords[0]) <= 180 &&
  Math.abs(coords[1]) <= 90;

export const toFixed5 = (n) => (Number.isFinite(n) ? Number(n).toFixed(5) : "");

export const getBoundsFromCoords = (coords) => {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return coords.reduce(
    (b, c) => b.extend(c),
    new mapboxgl.LngLatBounds(coords[0], coords[0])
  );
};

export const clearMarkersList = (markersRef) => {
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];
};
