import { EXHIBITION_RELEASE } from "../../../config/exhibitionRelease.js";
import { OFFLINE_EXHIBITION } from "../../../config/releaseChannel.js";
import { officialDemoScenario } from "../../../data/exhibition/officialDemoScenario.js";
import { primaryExhibitionModel } from "../../../data/exhibition/threeDModels.js";
import { LOCAL_DATASET_VERSION } from "../../../dataAccess/datasetVersion.js";
import {
  createHistoricalBasemapStyle,
  inspectHistoricalBasemap,
} from "../historicalBasemapPolicy.js";
import { recordDemoEvent } from "./demoTelemetry.js";

export const DEMO_HEALTH_STATUS = Object.freeze({
  PASSED: "passed",
  WARNING: "warning",
  FAILED: "failed",
});

const result = (id, status, detail) => ({ id, status, detail });

const assetAvailable = async (url, fetchImpl) => {
  try {
    const response = await fetchImpl(url, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
};

export const summarizeDemoHealth = (checks = []) => {
  const failed = checks.filter((check) => check.status === "failed");
  const warnings = checks.filter((check) => check.status === "warning");
  return {
    status: failed.length
      ? "failed"
      : warnings.length
        ? "warning"
        : "passed",
    passed: checks.length - failed.length - warnings.length,
    warnings: warnings.length,
    failed: failed.length,
  };
};

export const runDemoHealthCheck = async ({
  fetchImpl = fetch,
  hasLocalDataset = Boolean(LOCAL_DATASET_VERSION),
  serviceWorkerSupported = "serviceWorker" in navigator,
  offline = OFFLINE_EXHIBITION || navigator.onLine === false,
} = {}) => {
  const [manifestAvailable, preflightAvailable, posterAvailable, glbAvailable] =
    await Promise.all([
      assetAvailable("/exhibition-release.json", fetchImpl),
      assetAvailable("/exhibition-preflight.json", fetchImpl),
      assetAvailable(primaryExhibitionModel.poster, fetchImpl),
      assetAvailable(primaryExhibitionModel.src, fetchImpl),
    ]);
  const basemap = inspectHistoricalBasemap(createHistoricalBasemapStyle());
  const blocked = officialDemoScenario.steps
    .flatMap((step) => [
      ...(step.entityIds || []),
      ...(step.recordIds || []),
      step.selectedRouteId,
    ])
    .filter(Boolean)
    .filter((id) => EXHIBITION_RELEASE.blockedRecordIds.includes(id));
  const checks = [
    result(
      "release-manifest",
      manifestAvailable ? "passed" : "warning",
      manifestAvailable ? EXHIBITION_RELEASE.version : "manifest unavailable"
    ),
    result(
      "preflight",
      preflightAvailable ? "passed" : "warning",
      preflightAvailable ? "report available" : "report unavailable"
    ),
    result(
      "local-dataset",
      hasLocalDataset ? "passed" : "failed",
      hasLocalDataset ? LOCAL_DATASET_VERSION : "local dataset missing"
    ),
    result(
      "default-year",
      EXHIBITION_RELEASE.officialDemoDefaultYear === 1465 ? "passed" : "failed",
      String(EXHIBITION_RELEASE.officialDemoDefaultYear)
    ),
    result(
      "official-story",
      officialDemoScenario.steps.length ? "passed" : "failed",
      officialDemoScenario.id
    ),
    result(
      "historical-basemap",
      basemap.passed ? "passed" : "failed",
      basemap.passed ? "policy passed" : "modern geography detected"
    ),
    result("svg-fallback", "passed", "local renderer"),
    result(
      "3d-poster",
      posterAvailable ? "passed" : "failed",
      posterAvailable ? "available" : "poster missing"
    ),
    result(
      "production-glb",
      glbAvailable ? "passed" : "warning",
      glbAvailable ? "available" : "manual 3D unavailable; poster remains"
    ),
    result(
      "service-worker",
      serviceWorkerSupported ? "passed" : "warning",
      serviceWorkerSupported ? "supported" : "unsupported"
    ),
    result(
      "offline-shell",
      offline || serviceWorkerSupported ? "passed" : "warning",
      offline ? "offline mode" : "PWA controlled"
    ),
    result("translations", "passed", "ru, kk, en"),
    result(
      "route-registry",
      EXHIBITION_RELEASE.allowedRoutes.length ? "passed" : "warning",
      `${EXHIBITION_RELEASE.allowedRoutes.length} route`
    ),
    result(
      "required-sources",
      officialDemoScenario.sourceIds.length ? "passed" : "failed",
      `${officialDemoScenario.sourceIds.length} sources`
    ),
    result(
      "blocked-records",
      blocked.length ? "failed" : "passed",
      blocked.length ? `${blocked.length} blocked` : "none"
    ),
  ];
  const summary = summarizeDemoHealth(checks);
  recordDemoEvent("demo_health_check_completed", { status: summary.status });
  return { checks, summary };
};

export const getDemoHealthSafeSummary = (health) => ({
  status: health?.summary?.status || "warning",
  passed: health?.summary?.passed || 0,
  warnings: health?.summary?.warnings || 0,
  failed: health?.summary?.failed || 0,
});

