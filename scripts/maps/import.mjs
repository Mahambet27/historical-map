import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import { root, files, unpack, decodeTile, sha256, writeJSON } from "./lib.mjs";
export function exportTiles(input, output) {
  const db = new DatabaseSync(input, { readOnly: true });
  let count = 0;
  try {
    const metadata = Object.fromEntries(
      db
        .prepare("SELECT name, value FROM metadata")
        .all()
        .map((row) => [row.name, row.value])
    );
    if (metadata.format !== "pbf") throw new Error("Expected MVT/PBF MBTiles");
    if ([...files(output)].some((f) => f.endsWith(".pbf")))
      throw new Error("Destination contains tiles; archive it before importing a new dataset.");
    for (const row of db
      .prepare(
        "SELECT zoom_level AS z, tile_column AS x, tile_row AS y, tile_data AS data FROM tiles ORDER BY zoom_level, tile_column, tile_row"
      )
      .iterate()) {
      const { z, x, y } = row;
      if (
        ![z, x, y].every(Number.isInteger) ||
        z < 0 ||
        z > 14 ||
        x < 0 ||
        y < 0 ||
        x >= 2 ** z ||
        y >= 2 ** z
      )
        throw new Error("Invalid tile coordinate or zoom >14");
      const data = unpack(row.data);
      decodeTile(data); // Reject corrupt protobuf, including HTML/error pages.
      const file = path.join(output, String(z), String(x), `${2 ** z - 1 - y}.pbf`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, data, { flag: "wx" }); // Uncompressed: static servers need no gzip configuration.
      count++;
    }
    if (!count) throw new Error("Empty MBTiles archive");
    return { count, metadata };
  } finally {
    db.close();
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.join(root, "scripts/maps/import.mjs")
) {
  try {
    const input = path.resolve(process.argv[2] || path.join(root, ".maps-data/kazakhstan.mbtiles"));
    const result = exportTiles(input, path.join(root, "public/maps/tiles"));
    writeJSON(path.join(root, "public/maps/data-manifest.json"), {
      ...result,
      inputSha256: await sha256(input),
      coverage: "UNVERIFIED: run maps:validate and visual review",
    });
    console.log(
      `Imported ${result.count} local XYZ tiles. Run maps:validate before enabling self-hosted mode.`
    );
  } catch (error) {
    console.error(`Import blocked: ${error.message}`);
    process.exitCode = 1;
  }
}
