import {
  EXHIBITION_LAYERS,
  getDefaultLayerState,
  layerRegistryById,
} from "./layerRegistry.js";

export const LAYER_STORAGE_KEY = "qhm.exhibition.layers.v1";

export const readLayerState = (
  storage = window.localStorage,
  quality = "auto"
) => {
  const defaults = getDefaultLayerState();
  try {
    const stored = JSON.parse(storage?.getItem(LAYER_STORAGE_KEY) || "{}");
    return Object.fromEntries(
      EXHIBITION_LAYERS.map((entry) => [
        entry.id,
        entry.supportedQualityModes.includes(quality)
          ? Boolean(stored[entry.id] ?? defaults[entry.id])
          : false,
      ])
    );
  } catch {
    return defaults;
  }
};

export const storeLayerState = (state, storage = window.localStorage) => {
  try {
    storage?.setItem(LAYER_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const resetLayerState = (quality = "auto") =>
  Object.fromEntries(
    EXHIBITION_LAYERS.map((entry) => [
      entry.id,
      entry.supportedQualityModes.includes(quality)
        ? entry.defaultEnabled
        : false,
    ])
  );

export const toggleLayerState = (state, layerId, enabled) =>
  layerRegistryById.has(layerId)
    ? { ...state, [layerId]: enabled ?? !state[layerId] }
    : state;

const URL_LAYER_ALIASES = {
  routes: "tradeRoutes",
  cities: "historicalPlaces",
  places: "historicalPlaces",
  archaeology: "archaeology",
  environment: "environment",
  hydrology: "hydrology",
  archive: "archiveMaps",
  archiveMaps: "archiveMaps",
};

export const parseLayerUrlParam = (value) =>
  [...new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean))]
    .map((id) => URL_LAYER_ALIASES[id] || id)
    .filter((id) => layerRegistryById.has(id));

export const applyUrlLayers = (state, value) =>
  parseLayerUrlParam(value).reduce(
    (next, layerId) => ({ ...next, [layerId]: true }),
    state
  );
