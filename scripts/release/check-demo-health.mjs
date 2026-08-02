import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoRoot, releaseVersion } from "./package-config.mjs";

const checks = [
  ["release-manifest", "public/exhibition-release.json", true],
  ["preflight", "public/exhibition-preflight.json", true],
  ["offline-shell", "public/offline.html", true],
  ["pwa-manifest", "public/manifest.webmanifest", true],
  ["3d-poster", "public/models/exhibition/posters/bory-tastagan.webp", true],
  ["production-glb", "public/models/exhibition/bory-tastagan.glb", false],
  ["meshopt", "public/vendor/meshoptimizer/meshopt_decoder.js", true],
  ["official-story", "src/data/exhibition/officialDemoScenario.js", true],
  ["local-dataset", "src/dataAccess/local/LocalHistoricalRepository.js", true],
];

export const checkDemoHealth = async () => {
  const results = [];
  for (const [id, relative, required] of checks) {
    try {
      await access(path.join(repoRoot, relative));
      results.push({ id, status: "passed" });
    } catch {
      results.push({
        id,
        status: required ? "failed" : "warning",
        detail: "missing",
      });
    }
  }
  try {
    const release = JSON.parse(
      await readFile(path.join(repoRoot, "public", "exhibition-release.json"), "utf8")
    );
    results.push({
      id: "release-version",
      status: release.releaseVersion === releaseVersion ? "passed" : "failed",
    });
  } catch {
    results.push({ id: "release-version", status: "failed" });
  }
  const failed = results.filter((item) => item.status === "failed").length;
  const warnings = results.filter((item) => item.status === "warning").length;
  const report = {
    status: failed ? "failed" : warnings ? "warning" : "passed",
    failed,
    warnings,
    results,
    databaseVerification: "blocked_without_docker_or_podman",
  };
  await writeFile(
    path.join(repoRoot, "public", "exhibition-health.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
  return report;
};

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  checkDemoHealth()
    .then((report) => {
      console.log(
        `Demo health: ${report.status}; ${report.failed} failed, ${report.warnings} warnings`
      );
      if (report.failed) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

