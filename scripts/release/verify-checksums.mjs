import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashFile } from "./generate-checksums.mjs";
import { offlinePackageDir, releaseVersion } from "./package-config.mjs";

export const parseChecksums = (content) =>
  content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([a-f0-9]{64})  (.+)$/);
      if (!match) throw new Error("Malformed checksum manifest");
      return { hash: match[1], relative: match[2] };
    });

export const verifyChecksums = async (root = offlinePackageDir) => {
  const checksumPath = path.join(root, "checksums.sha256");
  const entries = parseChecksums(await readFile(checksumPath, "utf8"));
  const errors = [];
  for (const entry of entries) {
    try {
      const actual = await hashFile(path.join(root, entry.relative));
      if (actual !== entry.hash) errors.push(`changed: ${entry.relative}`);
    } catch {
      errors.push(`missing: ${entry.relative}`);
    }
  }
  try {
    const manifest = JSON.parse(
      await readFile(path.join(root, "release-manifest.json"), "utf8")
    );
    if (manifest.releaseVersion !== releaseVersion) {
      errors.push("release version mismatch");
    }
  } catch {
    errors.push("damaged release manifest");
  }
  return { passed: errors.length === 0, checked: entries.length, errors };
};

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  verifyChecksums()
    .then((result) => {
      console.log(
        `Release integrity: ${result.passed ? "READY" : "NOT READY"}; ${result.checked} files`
      );
      result.errors.forEach((error) => console.error(`ERROR ${error}`));
      if (!result.passed) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(`Release integrity failed: ${error.message}`);
      process.exitCode = 1;
    });
}

