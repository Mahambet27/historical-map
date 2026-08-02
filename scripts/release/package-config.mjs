import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
export const releaseVersion = "2026.08-stable1";
export const previousReleaseVersion = "2026.08-rc1";
export const packageRoot = path.join(repoRoot, "release-packages");
export const offlinePackageName = `qazaq-heritage-${releaseVersion}-offline`;
export const onlinePackageName = `qazaq-heritage-${releaseVersion}-online`;
export const offlinePackageDir = path.join(packageRoot, offlinePackageName);
export const onlinePackageDir = path.join(packageRoot, onlinePackageName);

export const excludedPackagePatterns = [
  /(^|[\\/])\.env(?:\.|$)/i,
  /(^|[\\/])\.git([\\/]|$)/i,
  /\.map$/i,
  /models[\\/]source/i,
  /service[-_]?role/i,
  /telemetry/i,
  /test-results/i,
  /playwright-report/i,
  /\.pid$/i,
];

export const shouldExcludePackagePath = (relativePath) =>
  excludedPackagePatterns.some((pattern) => pattern.test(relativePath));
