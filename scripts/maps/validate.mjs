import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import {
  root,
  readJSON,
  files,
  decodeTile,
  glyphIds,
  localAsset,
  requiredLayers,
  xyz,
} from "./lib.mjs";
export function validateContract(style) {
  const errors = validateStyleMin(style).map((e) => e.message);
  if (/mapbox|openfreemap|google|access_token/i.test(JSON.stringify(style)))
    errors.push("Forbidden provider/token in self-hosted style");
  const urls = [style.glyphs];
  if (style.sprite) urls.push(typeof style.sprite === "string" ? style.sprite : "invalid sprite");
  for (const source of Object.values(style.sources || {})) {
    if (source.type !== "vector" || source.url || !source.tiles?.length)
      errors.push("Expected direct local vector tile source");
    urls.push(...(source.tiles || []));
    if (source.scheme !== "xyz") errors.push("Expected XYZ addressing");
  }
  for (const url of urls) {
    try {
      if (!localAsset(url)) errors.push(`Nonlocal asset: ${url}`);
    } catch {
      errors.push(`Invalid URL: ${url}`);
    }
  }
  if (style.glyphs !== "/maps/fonts/{fontstack}/{range}.pbf")
    errors.push("Unexpected glyph contract");
  if (style.sources?.["atlas-basemap"]?.tiles?.[0] !== "/maps/tiles/{z}/{x}/{y}.pbf")
    errors.push("Unexpected XYZ source contract");
  const layers = new Set((style.layers || []).map((l) => l["source-layer"]));
  for (const name of requiredLayers) if (!layers.has(name)) errors.push(`Missing layer: ${name}`);
  for (const id of [
    "background",
    "country-boundaries",
    "administrative-boundaries",
    "place-labels",
  ])
    if (!style.layers?.some((l) => l.id === id)) errors.push(`Missing style layer: ${id}`);
  return errors;
}
export function validateData(mapsDir) {
  const errors = [],
    counts = {},
    zooms = new Set(),
    codepoints = new Set();
  let tiles = 0,
    tileBytes = 0,
    country = false,
    regions = false;
  for (const file of files(path.join(mapsDir, "tiles"))) {
    if (!file.endsWith(".pbf")) continue;
    const relative = path.relative(path.join(mapsDir, "tiles"), file).replaceAll("\\", "/");
    const match = relative.match(/^(\d+)\/(\d+)\/(\d+)\.pbf$/);
    if (!match) {
      errors.push(`Invalid tile path: ${relative}`);
      continue;
    }
    const [z, x, y] = match.slice(1).map(Number);
    if (z > 14 || x >= 2 ** z || y >= 2 ** z) {
      errors.push(`Invalid XYZ: ${relative}`);
      continue;
    }
    try {
      const data = fs.readFileSync(file);
      const tile = decodeTile(data);
      tileBytes += data.byteLength;
      tiles++;
      zooms.add(z);
      for (const [name, layer] of Object.entries(tile.layers)) {
        counts[name] = (counts[name] || 0) + layer.length;
        for (let i = 0; i < layer.length; i++) {
          const feature = layer.feature(i);
          feature.loadGeometry();
          if (name === "boundary") {
            country ||= feature.properties.admin_level === 2;
            regions ||= feature.properties.admin_level > 2;
          }
          if (name === "place") {
            const label = feature.properties.name ?? feature.properties["name:en"] ?? "";
            for (const char of String(label)) codepoints.add(char.codePointAt(0));
          }
        }
      }
    } catch (error) {
      errors.push(`Invalid MVT ${relative}: ${error.message}`);
    }
  }
  if (!tiles) errors.push("No real vector tile source files: public/maps/tiles is empty");
  for (let z = 0; z <= 14; z++) if (!zooms.has(z)) errors.push(`No tiles at zoom ${z}`);
  for (const layer of requiredLayers) if (!counts[layer]) errors.push(`No features: ${layer}`);
  if (!country || !regions) errors.push("Missing country/admin boundary features");
  // Distributed coverage probes, not proof of every rural feature or legal boundary.
  const probes = {
    Astana: [71.43, 51.13],
    Almaty: [76.89, 43.24],
    Atyrau: [51.92, 47.1],
    Aktau: [51.17, 43.65],
    Shymkent: [69.59, 42.32],
    Oskemen: [82.61, 49.95],
    Petropavl: [69.15, 54.87],
  };
  for (const [name, point] of Object.entries(probes))
    for (const z of [4, 8, 12, 14]) {
      const file = path.join(mapsDir, "tiles", ...xyz(...point, z).map(String)) + ".pbf";
      if (!fs.existsSync(file)) errors.push(`Coverage missing: ${name} z${z}`);
    }
  const available = new Set();
  for (const file of files(path.join(mapsDir, "fonts", "Noto Sans Regular")))
    if (file.endsWith(".pbf")) {
      try {
        for (const id of glyphIds(fs.readFileSync(file))) available.add(id);
      } catch {
        errors.push(`Invalid glyph PBF: ${file}`);
      }
    }
  // Require real Latin/Cyrillic and Kazakh glyphs even before tiles are installed.
  for (const char of "Az\u0410\u044f\u04d8\u04d9\u0492\u0493\u049a\u049b\u04a2\u04a3\u04e8\u04e9\u04b0\u04b1\u04ae\u04af\u04ba\u04bb\u0406\u0456")
    codepoints.add(char.codePointAt(0));
  const missing = [...codepoints].filter((id) => id > 32 && !available.has(id));
  if (missing.length)
    errors.push(
      `Missing glyph codepoints: ${missing
        .slice(0, 30)
        .map((id) => "U+" + id.toString(16))
        .join(", ")} (${missing.length} total)`
    );
  return {
    errors,
    tiles,
    tileBytes,
    counts,
    glyphs: available.size,
    coverage: "Distributed probes only; visual geographic review still required",
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.join(root, "scripts/maps/validate.mjs")
) {
  try {
    const dir = path.join(root, "public/maps");
    const contract = validateContract(readJSON(path.join(dir, "style.json")));
    const report = validateData(dir);
    const errors = [...contract, ...report.errors];
    console.log(
      JSON.stringify({ contract: contract.length ? "FAIL" : "PASS", ...report, errors }, null, 2)
    );
    if (errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
