import { EXHIBITION_RELEASE } from "../../../config/exhibitionRelease.js";
import { OFFLINE_EXHIBITION } from "../../../config/releaseChannel.js";
import { officialDemoScenario } from "../../../data/exhibition/officialDemoScenario.js";
import { getDeviceProfilePolicy, detectDeviceProfile } from "./deviceProfile.js";
import { runDemoHealthCheck } from "./demoHealthCheck.js";
import { parseDemoParams } from "./demoRoute.js";
import { recordDemoEvent } from "./demoTelemetry.js";

export const DEMO_BOOT_STATES = Object.freeze([
  "initializing",
  "checking-assets",
  "ready-online",
  "ready-offline",
  "degraded",
  "fatal",
]);

export const hasWebGl = (documentRef = document) => {
  try {
    const canvas = documentRef.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
};

export const createInitialDemoBootState = () => ({
  status: "initializing",
  language: "ru",
  quality: "auto",
  offline: false,
  forceSvgFallback: false,
  releaseVersion: EXHIBITION_RELEASE.version,
  message: "Preparing the exhibition",
});

export const bootstrapOfficialDemo = async ({
  search = window.location.search,
  navigatorRef = navigator,
  documentRef = document,
  fetchImpl = fetch,
  mockDeviceProfile,
  hasLocalDataset,
} = {}) => {
  recordDemoEvent("demo_boot_started");
  const params = parseDemoParams(search);
  const offline = OFFLINE_EXHIBITION || navigatorRef.onLine === false;
  const deviceProfile = detectDeviceProfile({
    mockProfile: mockDeviceProfile,
  });
  const devicePolicy = getDeviceProfilePolicy(deviceProfile);
  const health = await runDemoHealthCheck({
    fetchImpl,
    serviceWorkerSupported: "serviceWorker" in navigatorRef,
    offline,
    hasLocalDataset,
  });
  const webgl = hasWebGl(documentRef);
  const fatal = health.checks.some(
    (check) => check.id === "local-dataset" && check.status === "failed"
  );
  const degraded =
    !webgl ||
    health.summary.status !== "passed" ||
    params.forceSvg ||
    offline;
  const status = fatal
    ? "fatal"
    : degraded && !offline
      ? "degraded"
      : offline
        ? "ready-offline"
        : "ready-online";
  const quality =
    params.quality === "auto" ? devicePolicy.quality : params.quality;
  const state = {
    status,
    language: params.language || "ru",
    quality,
    offline,
    webgl,
    serviceWorker: "serviceWorker" in navigatorRef,
    offlineShell: true,
    forceSvgFallback:
      params.forceSvg || params.mockMapboxFailure || offline || !webgl,
    releaseVersion: EXHIBITION_RELEASE.version,
    defaultYear: EXHIBITION_RELEASE.officialDemoDefaultYear,
    officialStoryId: EXHIBITION_RELEASE.officialDemoStoryId,
    scenarioId: officialDemoScenario.id,
    initialPreset: officialDemoScenario.initialPreset,
    deviceProfile,
    health,
    params,
    message: fatal
      ? "Local exhibition data is unavailable"
      : degraded
        ? "The exhibition is ready in safe fallback mode"
        : offline
          ? "The exhibition is ready offline"
          : "The exhibition is ready",
  };
  recordDemoEvent(
    fatal ? "demo_boot_degraded" : "demo_boot_completed",
    { status, offline, profile: deviceProfile, quality }
  );
  recordDemoEvent("device_profile_selected", {
    profile: deviceProfile,
    quality,
  });
  if (params.recording) recordDemoEvent("recording_mode_started");
  return state;
};
