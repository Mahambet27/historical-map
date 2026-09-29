import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import Pbf from "pbf";
import { VectorTile } from "@mapbox/vector-tile";
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const requiredLayers = ["boundary", "transportation", "water", "waterway", "place"];
export const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
export function writeJSON(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}
export async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
export function* files(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink()) throw new Error(`Symlinks not accepted: ${entry.name}`);
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(file);
    else yield file;
  }
}
export function unpack(data) {
  return data[0] === 31 && data[1] === 139 ? gunzipSync(data) : data;
}
export function decodeTile(data) {
  return new VectorTile(new Pbf(unpack(data)));
}
export function xyz(lon, lat, z) {
  const n = 2 ** z;
  return [
    z,
    Math.floor(((lon + 180) / 360) * n),
    Math.floor(((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n),
  ];
}
export function glyphIds(data) {
  const ids = new Set();
  new Pbf(unpack(data)).readFields((tag, _, pbf) => {
    if (tag === 1)
      pbf.readMessage((field, __, stack) => {
        if (field === 3)
          stack.readMessage((key, ___, glyph) => {
            if (key === 1) ids.add(glyph.readVarint());
          }, {});
      }, {});
  }, {});
  return ids;
}
export function localAsset(url) {
  return (
    typeof url === "string" &&
    /^\/maps\//.test(url) &&
    !/[\\?#]/.test(url) &&
    !decodeURIComponent(url)
      .split("/")
      .some((part) => part === "..") &&
    !url.includes("://")
  );
}
