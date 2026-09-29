import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { root, files, sha256, writeJSON } from "./lib.mjs";
// Record exact local inputs; no downloader, no implicit latest-version resolution.
const dir = path.join(root, ".maps-data");
const required = [
  "planetiler.jar",
  "kazakhstan.osm.pbf",
  "water-polygons-split-3857.zip",
  "natural_earth_vector.sqlite.zip",
  "lake_centerline.shp.zip",
];
try {
  const inputs = {};
  for (const name of required) {
    const file = path.join(dir, "inputs", name);
    if (!fs.statSync(file).size) throw new Error(`Empty input: ${name}`);
    inputs[name] = { sha256: await sha256(file), bytes: fs.statSync(file).size };
  }
  const glyphs = [...files(path.join(dir, "glyphs", "Noto Sans Regular"))].filter((f) =>
    f.endsWith(".pbf")
  );
  if (!glyphs.length) throw new Error("Provide .maps-data/glyphs/Noto Sans Regular/*.pbf");
  for (const file of glyphs)
    inputs[`../glyphs/Noto Sans Regular/${path.basename(file)}`] = {
      sha256: await sha256(file),
      bytes: fs.statSync(file).size,
    };
  const lock = path.join(dir, "inputs.lock.json");
  if (fs.existsSync(lock))
    throw new Error("Lock already exists; archive it before preparing different inputs.");
  writeJSON(lock, { schemaVersion: 1, inputs, bounds: [45, 39, 90, 57], minzoom: 0, maxzoom: 14 });
  console.log(`Prepared ${lock}. Preserve this lock with source dates/licenses and tool version.`);
} catch (error) {
  console.error(`Preparation blocked: ${error.message}`);
  process.exitCode = 1;
}
