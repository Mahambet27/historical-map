import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import { root, glyphIds, readJSON } from "./lib.mjs";
const commit = "601ae60796ceceda2cbd2ed3d2ea92d17a84be4b";
const ranges = readJSON(path.join(root, "scripts/maps/glyph-ranges.json"));
try {
  for (const [range, hash] of Object.entries(ranges)) {
    const response = await fetch(
      `https://raw.githubusercontent.com/maplibre/demotiles/${commit}/font/Noto%20Sans%20Regular/${range}.pbf`,
      { signal: AbortSignal.timeout(30000) }
    );
    if (!response.ok) throw new Error(`Glyph HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > 512000 || createHash("sha256").update(data).digest("hex") !== hash)
      throw new Error(`Glyph checksum mismatch: ${range}`);
    if (!glyphIds(data).size) throw new Error(`No glyphs in ${range}`);
    for (const base of [".maps-data/glyphs", "public/maps/fonts"]) {
      const dir = path.join(root, base, "Noto Sans Regular");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${range}.pbf`), data);
    }
  }
  console.log(
    `Installed ${Object.keys(ranges).length} pinned glyph ranges for production place labels.`
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
