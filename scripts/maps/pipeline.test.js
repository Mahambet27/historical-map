// @vitest-environment node

import { afterEach, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { gzipSync } from "node:zlib";
import Pbf from "pbf";

import { exportTiles } from "./import.mjs";
import { decodeTile, glyphIds, localAsset, readJSON, root } from "./lib.mjs";
import { validateContract, validateData } from "./validate.mjs";
const temps = [];
const temp = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-maps-"));
  temps.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of temps.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});
function sampleTile() {
  // Synthetic test-only point. Never installed under public/maps.
  const pbf = new Pbf();
  pbf.writeMessage(
    3,
    (_, layer) => {
      layer.writeStringField(1, "place");
      layer.writeVarintField(15, 2);
      layer.writeVarintField(5, 4096);
      layer.writeMessage(
        2,
        (_, feature) => {
          feature.writeVarintField(1, 1);
          feature.writeVarintField(3, 1);
          feature.writePackedVarint(4, [9, 20, 20]);
        },
        {}
      );
    },
    {}
  );
  return pbf.finish();
}
it("exports real protobuf bytes from gzipped MBTiles with TMS to XYZ conversion", () => {
  const dir = temp(),
    input = path.join(dir, "sample.mbtiles");
  const db = new DatabaseSync(input);
  db.exec(
    "CREATE TABLE metadata(name TEXT,value TEXT); CREATE TABLE tiles(zoom_level INTEGER,tile_column INTEGER,tile_row INTEGER,tile_data BLOB);"
  );
  db.prepare("INSERT INTO metadata VALUES (?,?)").run("format", "pbf");
  db.prepare("INSERT INTO tiles VALUES (?,?,?,?)").run(2, 1, 0, gzipSync(sampleTile()));
  db.close();
  const output = path.join(dir, "tiles");
  expect(exportTiles(input, output).count).toBe(1);
  const bytes = fs.readFileSync(path.join(output, "2/1/3.pbf"));
  expect(decodeTile(bytes).layers.place.feature(0).loadGeometry()[0][0]).toMatchObject({
    x: 10,
    y: 10,
  });
  expect(() => exportTiles(input, output)).toThrow(/contains tiles/);
  expect(validateData(dir).errors.join(" ")).toMatch(/Coverage missing/);
});
it("fails production validation on missing tiles and glyphs instead of treating fixture coverage as complete", () => {
  const result = validateData(temp());
  expect(result.errors.join(" ")).toMatch(/No real vector tile/);
  expect(result.errors.join(" ")).toMatch(/Missing glyph/);
});
it("rejects external source and glyph URLs and missing required layers", () => {
  const style = readJSON(path.join(root, "public/maps/style.json"));
  expect(validateContract(style)).toEqual([]);
  const bad = structuredClone(style);
  bad.glyphs = "https://example.org/{range}.pbf";
  bad.sources["atlas-basemap"].tiles = ["https://example.org/{z}/{x}/{y}.pbf"];
  bad.layers = bad.layers.filter((l) => l["source-layer"] !== "boundary");
  expect(validateContract(bad).join(" ")).toMatch(/Nonlocal asset/);
  expect(validateContract(bad).join(" ")).toMatch(/Missing layer: boundary/);
  expect(localAsset("/maps/../outside.pbf")).toBe(false);
  expect(localAsset("//example.org/x")).toBe(false);
});
it("reads glyph codepoints from the protobuf fontstack", () => {
  const pbf = new Pbf();
  pbf.writeMessage(
    1,
    (_, stack) => stack.writeMessage(3, (_, glyph) => glyph.writeVarintField(1, 0x4d9), {}),
    {}
  );
  expect([...glyphIds(pbf.finish())]).toEqual([0x4d9]);
  expect([...glyphIds(new Uint8Array())]).toEqual([]);
});
