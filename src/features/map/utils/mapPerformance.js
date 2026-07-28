import { QUALITY_MODES, QUALITY_PROFILES } from "../constants/mapConfig.js";

export const getRequestedQualityMode = (search = window.location.search) => {
  const value = new URLSearchParams(search).get("quality") || "auto";
  return QUALITY_MODES.includes(value) ? value : "auto";
};

export const selectQualityMode = ({
  requested = getRequestedQualityMode(),
  width = window.innerWidth,
  deviceMemory = navigator.deviceMemory,
  hardwareConcurrency = navigator.hardwareConcurrency,
  reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  saveData = navigator.connection?.saveData,
  effectiveType = navigator.connection?.effectiveType,
} = {}) => {
  if (requested !== "auto") return requested;
  if (
    width <= 640 ||
    reducedMotion ||
    saveData ||
    (deviceMemory && deviceMemory <= 4) ||
    (hardwareConcurrency && hardwareConcurrency <= 4) ||
    ["slow-2g", "2g"].includes(effectiveType)
  ) {
    return "light";
  }
  if (width <= 1024 || (deviceMemory && deviceMemory <= 8) || effectiveType === "3g") {
    return "balanced";
  }
  return "high";
};

export const getQualityProfile = (options) => QUALITY_PROFILES[selectQualityMode(options)];

export const rafThrottle = (callback) => {
  let frame = 0;
  return (...args) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      callback(...args);
    });
  };
};
