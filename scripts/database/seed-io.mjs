import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(scriptDirectory, "../..");
export const seedDirectory = path.join(projectRoot, "supabase", "seed");
export const seedDataPath = path.join(seedDirectory, "p2a_seed_data.json");
export const seedSqlPath = path.join(seedDirectory, "p2a_seed.sql");
export const seedReportPath = path.join(seedDirectory, "p2a_seed_report.json");

export const stableStringify = (value, space = 2) => {
  const normalize = (item) => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === "object") {
      return Object.fromEntries(
        Object.keys(item)
          .sort()
          .map((key) => [key, normalize(item[key])])
      );
    }
    return item;
  };
  return `${JSON.stringify(normalize(value), null, space)}\n`;
};

export const ensureSeedDirectory = () => mkdir(seedDirectory, { recursive: true });

export const writeIfChanged = async (filePath, content) => {
  let previous = null;
  try {
    previous = await readFile(filePath, "utf8");
  } catch {
    // A missing generated artifact is expected on the first run.
  }
  if (previous === content) return false;
  await writeFile(filePath, content, "utf8");
  return true;
};

export const readSeedData = async () =>
  JSON.parse(await readFile(seedDataPath, "utf8"));

export const sortById = (rows) =>
  [...rows].sort((left, right) => String(left.id).localeCompare(String(right.id)));
