import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  offlinePackageDir,
  onlinePackageDir,
  repoRoot,
  releaseVersion,
} from "./package-config.mjs";
import { verifyChecksums } from "./verify-checksums.mjs";

export const verifyExhibitionRelease = async () => {
  const errors = [];
  for (const target of [
    path.join(offlinePackageDir, "dist", "index.html"),
    path.join(offlinePackageDir, "start-demo.ps1"),
    path.join(offlinePackageDir, "check-demo.ps1"),
    path.join(onlinePackageDir, "DEPLOYMENT_CHECKLIST.md"),
  ]) {
    try {
      await access(target);
    } catch {
      errors.push(`missing required release file: ${path.basename(target)}`);
    }
  }
  try {
    const preflight = JSON.parse(
      await readFile(path.join(repoRoot, "public", "exhibition-preflight.json"), "utf8")
    );
    if (preflight.status !== "passed") errors.push("preflight not passed");
  } catch {
    errors.push("preflight unreadable");
  }
  try {
    const manifest = JSON.parse(
      await readFile(path.join(offlinePackageDir, "release-manifest.json"), "utf8")
    );
    if (manifest.releaseVersion !== releaseVersion)
      errors.push("package release version mismatch");
    if (!manifest.noSecrets) errors.push("package noSecrets marker missing");
  } catch {
    errors.push("package manifest unreadable");
  }
  try {
    const integrity = await verifyChecksums();
    errors.push(...integrity.errors);
  } catch (error) {
    errors.push(`integrity unavailable: ${error.message}`);
  }
  return { passed: errors.length === 0, errors };
};

const direct =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (direct) {
  verifyExhibitionRelease().then((result) => {
    console.log(
      `Exhibition release verification: ${result.passed ? "READY" : "NOT READY"}`
    );
    result.errors.forEach((error) => console.error(`ERROR ${error}`));
    if (!result.passed) process.exitCode = 1;
  });
}

