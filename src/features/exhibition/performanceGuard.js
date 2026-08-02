export const PERFORMANCE_GUARD_THRESHOLDS = Object.freeze({
  stepModeFps: 20,
  stopContinuousFps: 12,
  sampleDurationMs: 2500,
});

export const evaluatePerformanceGuard = (
  fps,
  { headless = false } = {}
) => {
  if (!Number.isFinite(fps)) {
    return { mode: "continuous", triggered: false, headless };
  }
  if (fps < PERFORMANCE_GUARD_THRESHOLDS.stopContinuousFps) {
    return {
      mode: "stopped",
      triggered: true,
      disableGlow: true,
      disableAtmosphere: true,
      reduceCameraTransitions: true,
      message: "Continuous journey paused. Use step mode.",
      headless,
    };
  }
  if (fps < PERFORMANCE_GUARD_THRESHOLDS.stepModeFps) {
    return {
      mode: "step",
      triggered: true,
      disableGlow: true,
      disableAtmosphere: true,
      reduceCameraTransitions: true,
      message: "Step mode activated for smoother navigation.",
      headless,
    };
  }
  return {
    mode: "continuous",
    triggered: false,
    disableGlow: false,
    disableAtmosphere: false,
    reduceCameraTransitions: false,
    message: "",
    headless,
  };
};

export const getPerformanceGuardFpsOverride = (
  search = globalThis.location?.search || "",
  enabled = Boolean(import.meta.env?.DEV)
) => {
  if (!enabled) return null;
  const value = Number(new URLSearchParams(search).get("mockFps"));
  return Number.isFinite(value) && value > 0 ? value : null;
};
