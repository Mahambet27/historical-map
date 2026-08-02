import fs from "node:fs/promises";
import path from "node:path";
import { EXHIBITION_RELEASE } from "../../src/config/exhibitionRelease.js";
import { scienceDatasets, allScienceRecords } from "../science/science-data.mjs";
import { getScientificReadiness } from "../../src/features/exhibition/scientificReadiness.js";
import { validateTemporalConsistency } from "../science/validate-temporal-consistency.mjs";
import { validateSpatialConsistency } from "../science/validate-spatial-consistency.mjs";
import { validateScientificEvidence } from "../science/validate-scientific-evidence.mjs";
import { isDirectRun } from "../science/validation-utils.mjs";
import { getBuildTimestamp, getGitCommit } from "./release-metadata.mjs";

export const RELEASE_MANIFEST_PATH = path.resolve(
  "public/exhibition-release.json"
);
export const isSafeReleaseManifest = (manifest) => {
  const serialized =
    typeof manifest === "string" ? manifest : JSON.stringify(manifest);
  return !/C:\\|C:\/Users|service[_-]?role\s*[:=]/i.test(serialized);
};

export const generateExhibitionRelease = async (
  output = RELEASE_MANIFEST_PATH
) => {
  const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));
  const records = allScienceRecords()
    .filter(({ recordType }) => !["sources", "disputes"].includes(recordType))
    .map(({ record }) => record);
  const readiness = records.map(getScientificReadiness);
  const temporal = validateTemporalConsistency();
  const spatial = validateSpatialConsistency();
  const evidence = validateScientificEvidence();
  const gitCommit = getGitCommit();
  const buildTimestamp = getBuildTimestamp();
  const manifest = {
    applicationVersion: packageJson.version,
    datasetVersion: EXHIBITION_RELEASE.datasetVersion,
    releaseVersion: EXHIBITION_RELEASE.version,
    releaseChannel: "exhibition-stable",
    buildDate: EXHIBITION_RELEASE.buildDate,
    buildTimestamp,
    gitCommit,
    integrityStatus: "READY",
    supportedLanguages: ["ru", "kk", "en"],
    availableStories: EXHIBITION_RELEASE.allowedStories,
    availableRoutes: EXHIBITION_RELEASE.allowedRoutes,
    verifiedRecordCount: readiness.filter(
      (value) => value === "exhibition_ready"
    ).length,
    educationalReconstructionCount: readiness.filter(
      (value) => value === "educational_reconstruction"
    ).length,
    needsReviewCount: records.filter(
      (record) => record.verificationStatus === "needs_review"
    ).length,
    demoOnlyCount: records.filter(
      (record) => record.verificationStatus === "demo_only"
    ).length,
    blockedCount: EXHIBITION_RELEASE.blockedRecordIds.length,
    scientificValidationSummary: {
      temporal: { errors: temporal.errors, warnings: temporal.warnings },
      spatial: { errors: spatial.errors, warnings: spatial.warnings },
      evidence: { errors: evidence.errors, warnings: evidence.warnings },
    },
    officialDemoRecordCount:
      scienceDatasets.geometries.filter((record) =>
        ["reviewed", "verified", "needs_review"].includes(
          record.verificationStatus
        )
      ).length,
    gisReviewPackageGenerated: await fs
      .access(
        "review-packages/qazaq-heritage-scientific-review/review-index.json"
      )
      .then(() => true)
      .catch(() => false),
    noSecrets: true,
  };
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  if (!isSafeReleaseManifest(serialized)) {
    throw new Error("Release manifest contains a local path or secret marker.");
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, serialized, "utf8");
  console.log(`Exhibition release manifest: ${output}`);
  return manifest;
};

if (isDirectRun(import.meta.url)) await generateExhibitionRelease();
