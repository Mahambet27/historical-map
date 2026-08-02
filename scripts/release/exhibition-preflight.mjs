import fs from "node:fs/promises";
import path from "node:path";
import { EXHIBITION_RELEASE } from "../../src/config/exhibitionRelease.js";
import { historicalStories } from "../../src/data/exhibition/stories.js";
import { timelineStates } from "../../src/data/exhibition/timeline.js";
import { historicalRoutes } from "../../src/data/exhibition/historicalRoutes.js";
import { archiveMaps } from "../../src/data/exhibition/archiveMaps.js";
import { primaryExhibitionModel } from "../../src/data/exhibition/threeDModels.js";
import {
  createHistoricalBasemapStyle,
  inspectHistoricalBasemap,
} from "../../src/features/exhibition/historicalBasemapPolicy.js";
import {
  isRecordAllowedInOfficialDemo,
  isStoryAllowedInOfficialDemo,
} from "../../src/features/exhibition/officialDemoMode.js";
import { validateTemporalConsistency } from "../science/validate-temporal-consistency.mjs";
import { validateSpatialConsistency } from "../science/validate-spatial-consistency.mjs";
import { validateScientificEvidence } from "../science/validate-scientific-evidence.mjs";
import { isDirectRun } from "../science/validation-utils.mjs";
import {
  generateExhibitionRelease,
  RELEASE_MANIFEST_PATH,
} from "./generate-exhibition-release.mjs";

const exists = async (file) =>
  fs.access(file).then(() => true).catch(() => false);
const check = (condition, code, detail, errors) => {
  if (!condition) errors.push({ code, detail });
};
const translations = (value) =>
  ["ru", "kk", "en"].every((language) => Boolean(value?.[language]));
export const hasRequiredTranslations = translations;
export const hasForbiddenModernStyle = (style) =>
  !inspectHistoricalBasemap(style).passed;
export const hasRestrictedArchivePrecache = (precache, maps = []) =>
  maps
    .filter((record) => ["restricted", "unknown"].includes(record.license?.status))
    .map((record) => record.imageUrl)
    .filter(Boolean)
    .some((image) => precache.includes(image));

export const runExhibitionPreflight = async () => {
  const errors = [];
  const warnings = [];
  const temporal = validateTemporalConsistency();
  const spatial = validateSpatialConsistency();
  const evidence = validateScientificEvidence();
  check(!temporal.errors, "temporal_validation_failed", temporal.errors, errors);
  check(!spatial.errors, "spatial_validation_failed", spatial.errors, errors);
  check(!evidence.errors, "evidence_validation_failed", evidence.errors, errors);

  const officialStory = historicalStories.find(
    (story) => story.id === EXHIBITION_RELEASE.officialDemoStoryId
  );
  check(Boolean(officialStory), "official_story_missing", EXHIBITION_RELEASE.officialDemoStoryId, errors);
  check(
    timelineStates.some(
      (state) => state.year === EXHIBITION_RELEASE.officialDemoDefaultYear
    ),
    "official_start_year_missing",
    EXHIBITION_RELEASE.officialDemoDefaultYear,
    errors
  );
  check(
    EXHIBITION_RELEASE.allowedStories.every(isStoryAllowedInOfficialDemo),
    "official_story_not_allowed",
    "",
    errors
  );
  const allowedRouteRecords = historicalRoutes.filter((route) =>
    EXHIBITION_RELEASE.allowedRoutes.includes(route.id)
  );
  check(
    allowedRouteRecords.every(isRecordAllowedInOfficialDemo),
    "official_route_readiness_failed",
    "",
    errors
  );
  check(
    officialStory ? translations(officialStory.titles) : false,
    "missing_translation",
    EXHIBITION_RELEASE.officialDemoStoryId,
    errors
  );
  allowedRouteRecords.forEach((route) =>
    check(translations(route.names), "missing_translation", route.id, errors)
  );

  const poster = path.join("public", primaryExhibitionModel.poster.replace(/^\//, ""));
  check(await exists(poster), "poster_missing", poster, errors);
  check(await exists("public/manifest.webmanifest"), "pwa_manifest_missing", "", errors);
  check(await exists("src/features/exhibition/ExhibitionMapFallback.jsx"), "svg_fallback_missing", "", errors);
  const scenarioText = await fs.readFile(
    "src/features/exhibition/exhibitionScenario.js",
    "utf8"
  );
  check(scenarioText.includes("kiosk"), "kiosk_route_missing", "", errors);
  check(
    inspectHistoricalBasemap(createHistoricalBasemapStyle()).passed,
    "modern_basemap_policy_failed",
    "",
    errors
  );

  const sourceFiles = await fs.readdir("src", { recursive: true });
  for (const relative of sourceFiles) {
    if (!/\.(js|jsx|mjs)$/.test(relative)) continue;
    if (/\.test\.(js|jsx|mjs)$/.test(relative)) continue;
    const content = await fs.readFile(path.join("src", relative), "utf8");
    if (
      !relative.startsWith(`data${path.sep}`) &&
      /https?:\/\/(?:cdn\.|unpkg\.com|cdn\.jsdelivr\.net)/i.test(content)
    ) {
      errors.push({ code: "runtime_cdn_detected", detail: relative });
    }
    if (/(?:service[_-]?role|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]\s*["'][^"']+/i.test(content)) {
      errors.push({ code: "service_role_key_detected", detail: relative });
    }
  }

  const restrictedImages = archiveMaps
    .filter((record) => ["restricted", "unknown"].includes(record.license?.status))
    .map((record) => record.imageUrl)
    .filter(Boolean);
  const serviceWorker = (await exists("dist/sw.js"))
    ? await fs.readFile("dist/sw.js", "utf8")
    : "";
  check(
    !hasRestrictedArchivePrecache(serviceWorker, archiveMaps),
    "restricted_archive_in_precache",
    restrictedImages.join(","),
    errors
  );
  if (await exists("dist")) {
    const distFiles = await fs.readdir("dist", { recursive: true });
    check(
      !distFiles.some((file) => path.basename(file).startsWith(".env")),
      "env_file_in_build",
      "",
      errors
    );
  } else {
    warnings.push({ code: "dist_not_built", detail: "Run npm run build." });
  }

  if (!(await exists(RELEASE_MANIFEST_PATH))) {
    await generateExhibitionRelease();
  }
  check(
    await exists(RELEASE_MANIFEST_PATH),
    "release_manifest_missing",
    "",
    errors
  );
  const releaseManifest = JSON.parse(
    await fs.readFile(RELEASE_MANIFEST_PATH, "utf8")
  );
  check(releaseManifest.noSecrets === true, "release_manifest_secret_marker_missing", "", errors);

  const result = {
    status: errors.length ? "failed" : "passed",
    releaseVersion: EXHIBITION_RELEASE.version,
    buildChannel: "exhibition-stable",
    errors,
    warnings: [
      ...warnings,
      ...(temporal.warnings
        ? [{ code: "temporal_warnings", detail: temporal.warnings }]
        : []),
      ...(spatial.warnings
        ? [{ code: "spatial_warnings", detail: spatial.warnings }]
        : []),
      ...(evidence.warnings
        ? [{ code: "evidence_warnings", detail: evidence.warnings }]
        : []),
    ],
    basemapPolicy: "passed",
    databaseVerification: "blocked_without_docker_or_podman",
    gisReviewPackageGenerated: await exists(
      "review-packages/qazaq-heritage-scientific-review/review-index.json"
    ),
    generatedAt: EXHIBITION_RELEASE.buildDate,
  };
  await fs.writeFile(
    "public/exhibition-preflight.json",
    `${JSON.stringify(result, null, 2)}\n`,
    "utf8"
  );
  result.errors.forEach((error) =>
    console.error(`ERROR ${error.code}: ${error.detail}`)
  );
  result.warnings.forEach((warning) =>
    console.warn(`WARNING ${warning.code}: ${warning.detail}`)
  );
  console.log(
    `Exhibition preflight: ${result.status}; ${errors.length} errors, ${result.warnings.length} warning groups`
  );
  if (errors.length) process.exitCode = 1;
  return result;
};

if (isDirectRun(import.meta.url)) await runExhibitionPreflight();
