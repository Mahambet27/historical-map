export const EXHIBITION_QUALITY_MODES = ["auto", "high", "light"];
export const QUALITY_STORAGE_KEY = "qhm.exhibition.quality";

export const readStoredQualityMode = (
  storage = window.localStorage,
  search = window.location.search
) => {
  try {
    const queryMode = new URLSearchParams(search).get("quality");
    if (EXHIBITION_QUALITY_MODES.includes(queryMode)) return queryMode;
    const value = storage?.getItem(QUALITY_STORAGE_KEY);
    return EXHIBITION_QUALITY_MODES.includes(value) ? value : "auto";
  } catch {
    return "auto";
  }
};

export const storeQualityMode = (mode, storage = window.localStorage) => {
  if (!EXHIBITION_QUALITY_MODES.includes(mode)) return false;
  try {
    storage?.setItem(QUALITY_STORAGE_KEY, mode);
    return true;
  } catch {
    return false;
  }
};

export const detectExhibitionQuality = ({
  requested = "auto",
  width = window.innerWidth,
  deviceMemory = navigator.deviceMemory,
  hardwareConcurrency = navigator.hardwareConcurrency,
  reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
  saveData = navigator.connection?.saveData,
  effectiveType = navigator.connection?.effectiveType,
} = {}) => {
  if (requested === "high" || requested === "light") return requested;
  return width <= 760 ||
    reducedMotion ||
    saveData ||
    (deviceMemory && deviceMemory <= 4) ||
    (hardwareConcurrency && hardwareConcurrency <= 4) ||
    ["slow-2g", "2g", "3g"].includes(effectiveType)
    ? "light"
    : "high";
};
