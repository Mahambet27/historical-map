import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getGitCommit } from "./release-metadata.mjs";
import {
  packageRoot,
  repoRoot,
  releaseVersion,
} from "./package-config.mjs";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const commands = [
  "exhibition:release:generate",
  "science:validate:temporal",
  "science:validate:spatial",
  "science:validate:evidence",
  "exhibition:preflight",
  "build",
  "exhibition:budget",
  "exhibition:offline:build",
  "exhibition:checksums",
  "exhibition:integrity",
  "exhibition:online:build",
  "exhibition:release:verify",
  "exhibition:stable:preflight",
];

const results = [];
for (const script of commands) {
  const result = spawnSync(npm, ["run", script], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  results.push({ script, passed: result.status === 0 });
  if (result.status !== 0) {
    console.error(`Package pipeline stopped at ${script}`);
    process.exit(result.status || 1);
  }
}

await mkdir(packageRoot, { recursive: true });
await writeFile(
  path.join(packageRoot, "qazaq-heritage-package-report.json"),
  `${JSON.stringify(
    {
      releaseVersion,
      gitCommit: getGitCommit(),
      releaseChannel: "exhibition-stable",
      integrityStatus: "READY",
      status: "passed",
      deploymentPerformed: false,
      databaseVerification: "blocked_without_docker_or_podman",
      results,
    },
    null,
    2
  )}\n`,
  "utf8"
);
console.log("Safe exhibition package report generated. No deployment performed.");
