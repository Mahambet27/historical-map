const clampProfile = (value) =>
  ["low", "medium", "high", "unknown"].includes(value) ? value : "unknown";

export const getDeviceProfilePolicy = (profile) => {
  const normalized = clampProfile(profile);
  if (normalized === "low") {
    return {
      profile: normalized,
      quality: "light",
      terrain: false,
      atmosphere: false,
      routeMode: "step",
      extrusion: false,
      threeD: "manual",
    };
  }
  if (normalized === "high") {
    return {
      profile: normalized,
      quality: "high",
      terrain: true,
      atmosphere: true,
      routeMode: "guarded-animation",
      extrusion: true,
      threeD: "after-user-action",
    };
  }
  return {
    profile: normalized,
    quality: "auto",
    terrain: false,
    atmosphere: normalized === "medium",
    routeMode: "guarded-animation",
    extrusion: false,
    threeD: "after-user-action",
  };
};

export const detectDeviceProfile = ({
  deviceMemory = navigator.deviceMemory,
  hardwareConcurrency = navigator.hardwareConcurrency,
  saveData = navigator.connection?.saveData,
  effectiveType = navigator.connection?.effectiveType,
  width = window.innerWidth,
  reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    ?.matches,
  measuredFps,
  mockProfile,
} = {}) => {
  if (import.meta.env.DEV && mockProfile) return clampProfile(mockProfile);
  if (
    saveData ||
    reducedMotion ||
    width < 720 ||
    (deviceMemory && deviceMemory <= 4) ||
    (hardwareConcurrency && hardwareConcurrency <= 4) ||
    ["slow-2g", "2g", "3g"].includes(effectiveType) ||
    (measuredFps != null && measuredFps < 20)
  ) {
    return "low";
  }
  if (
    deviceMemory >= 8 &&
    hardwareConcurrency >= 8 &&
    width >= 1280 &&
    (measuredFps == null || measuredFps >= 45)
  ) {
    return "high";
  }
  if (deviceMemory || hardwareConcurrency) return "medium";
  return "unknown";
};

export const getSafeDeviceProfileSummary = (profile) => ({
  profile: clampProfile(profile),
  policy: getDeviceProfilePolicy(profile),
});

