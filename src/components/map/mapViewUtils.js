export const getPlaceType = (place) => place?.type || "Тарихи нысан";

export const hasPlaceMedia = (place) => {
  return Boolean(
    (Array.isArray(place?.images) && place.images.length > 0) ||
      place?.model3d ||
      place?.modelViewerUrl
  );
};

export const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const distanceKm = (from, to, isLngLatOk) => {
  if (!isLngLatOk(from) || !isLngLatOk(to)) return Number.POSITIVE_INFINITY;

  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to[1] - from[1]);
  const dLng = toRad(to[0] - from[0]);
  const lat1 = toRad(from[1]);
  const lat2 = toRad(to[1]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const smoothMapEasing = (t) => {
  return t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
};

export const smoothCameraOptions = {
  duration: 2200,
  easing: smoothMapEasing,
  essential: true,
};

export const smoothFitOptions = {
  duration: 2100,
  easing: smoothMapEasing,
  essential: true,
};

export const POPULAR_ERA = 5;

export const PROTECTED_AREA_LAYER_IDS = [
  "protected-areas-glow",
  "protected-areas-fill",
  "protected-areas-outline",
];

export const HISTORICAL_BORDER_LAYER_IDS = [
  "historical-borders-fill",
  "historical-borders-outline",
  "historical-borders-label",
];

export const localizePlace = (place, language) => {
  if (!place) return place;

  const translation = place.translations?.[language];
  if (!translation) return place;

  return {
    ...place,
    type: translation.type || place.type,
    name: translation.name || place.name,
    short: translation.short || place.short,
    full: translation.full || place.full,
    shortDescription: translation.short || place.shortDescription,
    fullDescription: translation.full || place.fullDescription,
  };
};

export const getPlaceFavoriteId = (place) =>
  String(place?.id ?? place?.name ?? place?.coords?.join(",") ?? "unknown-place");

export const favoriteText = {
  favoritesOnly: "Favorites only",
  add: "Add to favorites",
  remove: "Remove favorite",
  count: "Favorites",
};
