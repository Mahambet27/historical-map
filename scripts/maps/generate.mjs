import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { root, readJSON, sha256 } from "./lib.mjs";
try {
  const dir = path.join(root, ".maps-data");
  const lock = readJSON(path.join(dir, "inputs.lock.json"));
  for (const [name, expected] of Object.entries(lock.inputs)) {
    const file = path.resolve(dir, "inputs", name);
    if (!file.startsWith(dir + path.sep)) throw new Error("Input outside local data directory");
    if ((await sha256(file)) !== expected.sha256) throw new Error(`Input changed: ${name}`);
  }
  const output = path.join(dir, "kazakhstan.mbtiles");
  if (fs.existsSync(output)) throw new Error("Output exists; archive it before a new generation.");
  const input = (name) => path.join(dir, "inputs", name);
  const args = [
    "-Xmx4g",
    "-jar",
    input("planetiler.jar"),
    "--download=false",
    "--fetch-wikidata=false",
    "--use-wikidata=false",
    "--only-fetch-wikidata=false",
    "--refresh-sources=false",
    "--only-download=false",
    "--download-osm-tile-weights=false",
    `--osm-path=${input("kazakhstan.osm.pbf")}`,
    `--water-polygons-path=${input("water-polygons-split-3857.zip")}`,
    `--natural-earth-path=${input("natural_earth_vector.sqlite.zip")}`,
    `--lake-centerlines-path=${input("lake_centerline.shp.zip")}`,
    "--bounds=45,39,90,57",
    "--minzoom=0",
    "--maxzoom=14",
    "--tile-format=mvt",
    `--output=${output}`,
  ];
  console.log(
    "Offline Planetiler generation; requires Java 21+ and the locked OpenMapTiles-profile JAR."
  );
  const result = spawnSync("java", args, { cwd: dir, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Planetiler exited ${result.status}`);
} catch (error) {
  console.error(`Generation blocked: ${error.message}`);
  process.exitCode = 1;
}
