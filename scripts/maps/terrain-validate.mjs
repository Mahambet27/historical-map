import fs from "node:fs";
import path from "node:path";
import { crc32, inflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { validateTerrainManifest } from "../../src/features/atlas/map/atlasTerrain.js";

export function validateTerrain(dir, { production = true } = {}) {
  const file = path.join(dir, "terrain.json");
  if (!fs.existsSync(file))
    throw new Error(
      "DEM MISSING: supply a local metre-elevation GeoTIFF and run maps:terrain:generate. 2D fallback remains available."
    );
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  validateTerrainManifest(manifest);
  if (
    production &&
    (manifest.provenance?.source !== "NASA SRTMGL1 v3" ||
      manifest.provenance?.version !== "003" ||
      manifest.provenance?.resolutionArcSeconds !== 1 ||
      manifest.coverage?.coverage !== "PASS" ||
      manifest.coverage?.nodataPixels !== 0 ||
      manifest.coverage?.mosaicSHA256 !== manifest.inputSHA256 ||
      !/^[a-f0-9]{64}$/.test(manifest.inputSHA256 || ""))
  )
    throw new Error("Verified NASA SRTMGL1 v3 coverage required");
  if (!["source", "license", "version", "attribution"].every((key) => manifest.provenance?.[key]))
    throw new Error("DEM provenance incomplete");
  if (JSON.stringify(manifest.tiles).match(/https?:|mapbox|openfreemap|google/i))
    throw new Error("External terrain URL");
  if (manifest.bounds.some((value, i) => value !== [45, 39, 90, 57][i]))
    throw new Error("Kazakhstan coverage bounds required");
  const xy = (lon, lat, z) => [
    Math.min(2 ** z - 1, Math.floor(((lon + 180) / 360) * 2 ** z)),
    Math.min(
      2 ** z - 1,
      Math.floor(((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z)
    ),
  ];
  let count = 0;
  for (let z = 0; z <= manifest.maxzoom; z++) {
    const [west, south] = xy(45, 39, z),
      [east, north] = xy(90, 57, z);
    for (let x = west; x <= east; x++)
      for (let y = north; y <= south; y++) {
        const data = fs.readFileSync(path.join(dir, `${z}/${x}/${y}.png`));
        if (
          !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
          data.readUInt32BE(16) !== 256 ||
          data.readUInt32BE(20) !== 256 ||
          data[24] !== 8 ||
          data[25] !== 2
        )
          throw new Error(`Invalid RGB DEM tile ${z}/${x}/${y}`);
        let offset = 8;
        const parts = [];
        let ended = false;
        while (offset + 12 <= data.length) {
          const size = data.readUInt32BE(offset),
            type = data.toString("ascii", offset + 4, offset + 8);
          if (offset + 12 + size > data.length) throw new Error("Truncated PNG");
          if (
            crc32(data.subarray(offset + 4, offset + 8 + size)) !==
            data.readUInt32BE(offset + 8 + size)
          )
            throw new Error(`PNG checksum mismatch ${z}/${x}/${y}`);
          if (type === "IDAT") parts.push(data.subarray(offset + 8, offset + 8 + size));
          offset += 12 + size;
          if (type === "IEND") {
            ended = true;
            break;
          }
        }
        if (!ended || offset !== data.length) throw new Error("Incomplete PNG");
        if (inflateSync(Buffer.concat(parts), { maxOutputLength: 256 * 769 }).length !== 256 * 769)
          throw new Error("Invalid DEM pixels");
        count++;
      }
  }
  if (count !== manifest.tileCount) throw new Error("Tile count mismatch");
  return {
    status: "PASS",
    tiles: count,
    zoom: [0, manifest.maxzoom],
    encoding: "terrarium",
    externalTerrainAPI: false,
    source: manifest.provenance.source,
    coverage: manifest.coverage?.coverage,
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(validateTerrain("public/maps/terrain"), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
