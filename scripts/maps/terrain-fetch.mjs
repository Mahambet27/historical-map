// Explicit bulk download of NASA SRTMGL1 v3 from OpenTopography's public mirror.
// No elevation API, credentials, or application runtime network dependency.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const work = path.join(root, ".maps-data/terrain");
const inputs = path.join(work, "inputs");
const base = "https://opentopography.s3.sdsc.edu/raster/";
fs.mkdirSync(inputs, { recursive: true });
function curl(url, destination) {
  return new Promise((resolve, reject) => {
    const child = spawn("curl.exe", [
      "--fail",
      "--silent",
      "--show-error",
      "--location",
      "--retry",
      "4",
      "--connect-timeout",
      "30",
      "--max-time",
      "300",
      url,
      "--output",
      destination,
    ]);
    let error = "";
    child.stderr.on("data", (data) => {
      error += data;
    });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${url}: ${error}`))));
  });
}
async function sha256(file) {
  const hash = createHash("sha256");
  for await (const data of fs.createReadStream(file)) hash.update(data);
  return hash.digest("hex");
}
const entries = [];
for (let lat = 39; lat < 57; lat++) {
  const listing = path.join(work, `listing-N${lat}.xml`);
  await curl(`${base}?list-type=2&prefix=SRTM_GL1/SRTM_GL1_srtm/N${lat}E`, listing);
  const xml = fs.readFileSync(listing, "utf8");
  if (!xml.includes("<IsTruncated>false</IsTruncated>")) throw new Error("Incomplete S3 listing");
  for (const item of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
    const key = item[1].match(/<Key>(.*?)<\/Key>/)[1];
    const match = key.match(/N(\d{2})E(\d{3})\.tif$/);
    if (!match || +match[2] < 45 || +match[2] >= 90) continue;
    entries.push({
      file: path.basename(key),
      url: base + key,
      bytes: +item[1].match(/<Size>(\d+)<\/Size>/)[1],
      lastModified: item[1].match(/<LastModified>(.*?)<\/LastModified>/)[1],
    });
  }
}
// The distributor omits these eleven whole-water Caspian Sea cells.
// They remain nodata in the scientific mosaic; never substitute fabricated land.
const waterCells = [
  "N39E050",
  "N39E051",
  "N40E051",
  "N41E050",
  "N41E051",
  "N42E049",
  "N42E050",
  "N43E048",
  "N43E049",
  "N44E048",
  "N44E049",
];
const names = new Set(entries.map((entry) => entry.file));
for (let lat = 39; lat < 57; lat++)
  for (let lon = 45; lon < 90; lon++) {
    const cell = `N${lat}E${String(lon).padStart(3, "0")}`;
    if (!names.has(`${cell}.tif`) && !waterCells.includes(cell))
      throw new Error(`Missing land cell ${cell}`);
  }
if (entries.length !== 799)
  throw new Error(`Expected 799 distributed cells, found ${entries.length}`);
console.log(
  `Downloading ${entries.length} SRTMGL1 v3 cells, ${entries.reduce((n, e) => n + e.bytes, 0)} bytes`
);
let index = 0,
  complete = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (index < entries.length) {
      const entry = entries[index++];
      const destination = path.join(inputs, entry.file);
      const partial = destination + ".part";
      if (!fs.existsSync(destination) || fs.statSync(destination).size !== entry.bytes) {
        await curl(entry.url, partial);
        if (fs.statSync(partial).size !== entry.bytes) throw new Error(`Truncated ${entry.file}`);
        fs.renameSync(partial, destination);
      }
      entry.sha256 = await sha256(destination);
      complete++;
      if (complete % 20 === 0 || complete === entries.length)
        console.log(`${complete}/${entries.length} verified`);
    }
  })
);
const provenance = {
  source: "NASA SRTMGL1 v3",
  version: "003",
  doi: "https://doi.org/10.5067/MEaSUREs/SRTM/SRTMGL1.003",
  license: "NASA Earth science open data; OpenTopography acknowledgement required",
  attribution: "NASA / NGA SRTMGL1 v3. Distributed by OpenTopography.",
  distribution: "https://portal.opentopography.org/raster?opentopoID=OTSRTM.082015.4326.1",
  horizontalDatum: "WGS84 (EPSG:4326)",
  verticalDatum: "EGM96 orthometric height, metres (EPSG:5773)",
  resolutionArcSeconds: 1,
  bounds: [45, 39, 90, 57],
  omittedWaterCells: waterCells,
  retrievedAt: new Date().toISOString(),
};
fs.writeFileSync(
  path.join(work, "sources.lock.json"),
  JSON.stringify({ provenance, entries }, null, 2) + "\n"
);
fs.writeFileSync(path.join(work, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n");
console.log("Source lock and provenance written; all source files verified.");
