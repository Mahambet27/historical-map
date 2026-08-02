import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { EXHIBITION_RELEASE } from "../../src/config/exhibitionRelease.js";
import { runExhibitionPreflight } from "./exhibition-preflight.mjs";
import {
  offlinePackageDir,
  previousReleaseVersion,
  releaseVersion,
} from "./package-config.mjs";
import { getGitCommit, isSafeCommitIdentifier } from "./release-metadata.mjs";
import { verifyChecksums } from "./verify-checksums.mjs";
import { fileURLToPath } from "node:url";

const exists = (target) => access(target).then(() => true).catch(() => false);
const add = (errors, condition, code) => {
  if (!condition) errors.push(code);
};

export const runStableReleasePreflight = async () => {
  const base = await runExhibitionPreflight();
  const errors = base.errors.map(({ code }) => code);
  const manifest = JSON.parse(await readFile("public/exhibition-release.json", "utf8"));
  const commit = getGitCommit();
  add(errors, releaseVersion === "2026.08-stable1", "stable_version_invalid");
  add(errors, EXHIBITION_RELEASE.version === releaseVersion, "runtime_version_mismatch");
  add(errors, manifest.releaseChannel === "exhibition-stable", "stable_channel_missing");
  add(errors, manifest.gitCommit === commit, "actual_git_commit_mismatch");
  add(errors, isSafeCommitIdentifier(manifest.gitCommit), "unsafe_git_commit");
  add(errors, manifest.integrityStatus === "READY", "integrity_status_missing");
  add(errors, await exists(offlinePackageDir), "stable_package_missing");
  add(
    errors,
    await exists(`release-packages/qazaq-heritage-${previousReleaseVersion}-offline`),
    "release_candidate_package_missing"
  );
  for (const required of [
    "docs/P2A9_RELEASE_FREEZE_AUDIT.md",
    "docs/P2A9_PHYSICAL_REHEARSAL_CHECKLIST.md",
    "docs/P2A9_RELEASE_FREEZE_POLICY.md",
    "docs/P2A8_OPERATOR_GUIDE_RU.md",
    "docs/P2A8_OPERATOR_GUIDE_KK.md",
    "docs/P2A8_OPERATOR_GUIDE_EN.md",
    "docs/P2A8_EMERGENCY_CARD_RU.md",
  ]) add(errors, await exists(required), `required_file_missing:${required}`);
  if (await exists(offlinePackageDir)) {
    const files = await readdir(offlinePackageDir, { recursive: true });
    add(errors, !files.some((file) => /^\.env(?:\.|$)/i.test(path.basename(file))), "package_env_detected");
    add(errors, !files.some((file) => /models[\\/]source/i.test(file)), "source_glb_detected");
    const integrity = await verifyChecksums(offlinePackageDir).catch(() => ({ passed: false }));
    add(errors, integrity.passed, "stable_package_integrity_failed");
  }
  const report = {
    status: errors.length ? "failed" : "passed",
    releaseVersion,
    gitCommit: commit,
    releaseChannel: "exhibition-stable",
    databaseVerification: "blocked_without_docker_or_podman",
    remoteSupabaseConnected: false,
    deploymentPerformed: false,
    historicalDataChanged: false,
    errors,
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) process.exitCode = 1;
  return report;
};

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) await runStableReleasePreflight();
