import { expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { validateTerrain } from "./terrain-validate.mjs";

it("rejects missing DEM instead of claiming production coverage", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-dem-"));
  try {
    expect(() => validateTerrain(dir)).toThrow("DEM MISSING");
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
it("validates a small synthetic test-only Terrarium tile and rejects absent coverage", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-dem-"));
  try {
    const manifest = {
      encoding: "terrarium",
      tileSize: 256,
      minzoom: 0,
      maxzoom: 0,
      bounds: [45, 39, 90, 57],
      tiles: ["/maps/terrain/{z}/{x}/{y}.png"],
      tileCount: 1,
      provenance: {
        source: "synthetic unit fixture",
        license: "test",
        version: "1",
        attribution: "test",
      },
    };
    fs.writeFileSync(path.join(dir, "terrain.json"), JSON.stringify(manifest));
    fs.mkdirSync(path.join(dir, "0/0"), { recursive: true });
    const crc32 = (buffer) => {
      let crc = 0xffffffff;
      for (const byte of buffer) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
      return (crc ^ 0xffffffff) >>> 0;
    };
    const chunk = (name, payload) => {
      const head = Buffer.alloc(8),
        tail = Buffer.alloc(4);
      head.writeUInt32BE(payload.length);
      head.write(name, 4);
      tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), payload])));
      return Buffer.concat([head, payload, tail]);
    };
    const header = Buffer.alloc(13);
    header.writeUInt32BE(256);
    header.writeUInt32BE(256, 4);
    header[8] = 8;
    header[9] = 2;
    const pixels = Buffer.alloc(256 * 769);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) pixels[y * 769 + 1 + x * 3] = 128;
    const png = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(pixels)),
      chunk("IEND", Buffer.alloc(0)),
    ]);
    fs.writeFileSync(path.join(dir, "0/0/0.png"), png);
    expect(() => validateTerrain(dir)).toThrow("Verified NASA SRTMGL1 v3 coverage required");
    expect(validateTerrain(dir, { production: false })).toMatchObject({ status: "PASS", tiles: 1 });
    const corrupt = Buffer.from(png);
    corrupt[corrupt.length - 1] ^= 1;
    fs.writeFileSync(path.join(dir, "0/0/0.png"), corrupt);
    expect(() => validateTerrain(dir, { production: false })).toThrow("PNG checksum mismatch");
    fs.unlinkSync(path.join(dir, "0/0/0.png"));
    expect(() => validateTerrain(dir, { production: false })).toThrow();
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
