import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listModelFiles } from "./model-utils.mjs";

export const MIB = 1024 * 1024;
export const PRIMARY_MODEL_MAX_BYTES = 15 * MIB;
export const ADDITIONAL_MODEL_MAX_BYTES = 10 * MIB;
export const POSTER_MAX_BYTES = 250 * 1024;

export const checkBudgetEntries = (entries) =>
  entries
    .filter(({ bytes, maxBytes }) => bytes > maxBytes)
    .map(({ file, bytes, maxBytes }) => ({ file, bytes, maxBytes }));

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const workspace = path.resolve(scriptDirectory, "../..");
  const productionDirectory = path.join(workspace, "public/models/exhibition");
  const posterDirectory = path.join(productionDirectory, "posters");
  const modelEntries = listModelFiles(productionDirectory).map((file) => ({
    file: path.relative(workspace, file),
    bytes: fs.statSync(file).size,
    maxBytes: path.basename(file) === "bory-tastagan.glb"
      ? PRIMARY_MODEL_MAX_BYTES
      : ADDITIONAL_MODEL_MAX_BYTES,
  }));
  const posterEntries = fs.existsSync(posterDirectory)
    ? fs.readdirSync(posterDirectory)
        .filter((file) => file.endsWith(".webp"))
        .map((file) => {
          const fullPath = path.join(posterDirectory, file);
          return {
            file: path.relative(workspace, fullPath),
            bytes: fs.statSync(fullPath).size,
            maxBytes: POSTER_MAX_BYTES,
          };
        })
    : [];
  const failures = checkBudgetEntries([...modelEntries, ...posterEntries]);
  console.table([...modelEntries, ...posterEntries].map((entry) => ({
    file: entry.file,
    bytes: entry.bytes,
    maxBytes: entry.maxBytes,
    status: entry.bytes <= entry.maxBytes ? "ok" : "over budget",
  })));
  if (!modelEntries.length || failures.length) {
    if (!modelEntries.length) console.error("No production GLB found.");
    if (failures.length) console.error("3D production budget exceeded.");
    process.exitCode = 1;
  }
}

