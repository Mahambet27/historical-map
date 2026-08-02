import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { offlinePackageDir, shouldExcludePackagePath } from "./package-config.mjs";

const toPosix = (value) => value.split(path.sep).join("/");

export const hashFile = async (file) =>
  createHash("sha256").update(await readFile(file)).digest("hex");

export const listChecksumFiles = async (root) => {
  const output = [];
  const visit = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      const relative = toPosix(path.relative(root, absolute));
      if (
        relative === "checksums.sha256" ||
        relative === ".demo-server.json" ||
        shouldExcludePackagePath(relative)
      ) {
        continue;
      }
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) output.push(relative);
    }
  };
  await visit(root);
  return output;
};

export const generateChecksums = async (root = offlinePackageDir) => {
  const files = await listChecksumFiles(root);
  const lines = [];
  for (const relative of files) {
    lines.push(`${await hashFile(path.join(root, relative))}  ${relative}`);
  }
  const content = `${lines.join("\n")}\n`;
  await writeFile(path.join(root, "checksums.sha256"), content, "utf8");
  return { root, files: files.length, content };
};

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  generateChecksums()
    .then(({ files }) => console.log(`Checksums generated: ${files} files`))
    .catch((error) => {
      console.error(`Checksum generation failed: ${error.message}`);
      process.exitCode = 1;
    });
}

