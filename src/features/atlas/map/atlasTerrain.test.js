import { expect, it, vi } from "vitest";
import {
  attachAtlasTerrain,
  terrainEnabled,
  validateTerrainManifest,
  TERRAIN_SOURCE,
  HILLSHADE_SOURCE,
  HILLSHADE_LAYER,
} from "./atlasTerrain.js";
const manifest = {
  encoding: "terrarium",
  tileSize: 256,
  minzoom: 0,
  maxzoom: 8,
  bounds: [45, 39, 90, 57],
  tiles: ["/maps/terrain/{z}/{x}/{y}.png"],
};
function mockMap() {
  const sources = new Map(),
    layers = new Map();
  return {
    addSource: vi.fn((id, value) => sources.set(id, value)),
    getSource: (id) => sources.get(id),
    removeSource: vi.fn((id) => sources.delete(id)),
    addLayer: vi.fn((layer) => layers.set(layer.id, layer)),
    getLayer: (id) => layers.get(id),
    removeLayer: vi.fn((id) => layers.delete(id)),
    setTerrain: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getStyle: () => ({
      layers: [
        { id: "background", type: "background" },
        { id: "historical", type: "circle" },
      ],
    }),
  };
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
it("keeps terrain disabled by default and makes no DEM requests", () => {
  const map = mockMap(),
    fetcher = vi.fn();
  expect(terrainEnabled({})).toBe(false);
  expect(terrainEnabled({ VITE_ATLAS_TERRAIN_ENABLED: "false" })).toBe(false);
  expect(terrainEnabled({ VITE_ATLAS_TERRAIN_ENABLED: "true" })).toBe(true);
  attachAtlasTerrain(map, false, fetcher)();
  expect(fetcher).not.toHaveBeenCalled();
  expect(map.setTerrain).not.toHaveBeenCalled();
});
it("attaches local DEM terrain and hillshade below overlay", async () => {
  const map = mockMap();
  const cleanup = attachAtlasTerrain(
    map,
    true,
    vi.fn().mockResolvedValue({ ok: true, json: async () => manifest })
  );
  await settle();
  expect(map.addSource).toHaveBeenCalledWith(
    TERRAIN_SOURCE,
    expect.objectContaining({ type: "raster-dem", encoding: "terrarium", tiles: manifest.tiles })
  );
  expect(map.addLayer).toHaveBeenCalledWith(
    expect.objectContaining({ type: "hillshade" }),
    "historical"
  );
  expect(map.setTerrain).toHaveBeenCalledWith({ source: TERRAIN_SOURCE, exaggeration: 1 });
  map.on.mock.calls[0][1]({ sourceId: HILLSHADE_SOURCE });
  expect(map.setTerrain).toHaveBeenLastCalledWith(null);
  expect(map.getLayer(HILLSHADE_LAYER)).toBeUndefined();
  cleanup();
  expect(map.off).toHaveBeenCalled();
});
it.each(["missing", "invalid", "network"])("preserves basemap when DEM is %s", async (reason) => {
  const map = mockMap();
  const fetcher =
    reason === "network"
      ? vi.fn().mockRejectedValue(new Error("offline"))
      : vi.fn().mockResolvedValue({ ok: reason !== "missing", json: async () => ({}) });
  attachAtlasTerrain(map, true, fetcher);
  await settle();
  expect(map.addSource).not.toHaveBeenCalled();
  expect(map.setTerrain).toHaveBeenLastCalledWith(null);
});
it("ignores a late manifest after unmount", async () => {
  const map = mockMap();
  let resolve;
  const cleanup = attachAtlasTerrain(
    map,
    true,
    () =>
      new Promise((r) => {
        resolve = r;
      })
  );
  cleanup();
  resolve({ ok: true, json: async () => manifest });
  await settle();
  expect(map.addSource).not.toHaveBeenCalled();
});
it("rejects external DEM URLs and unsupported encoding", () => {
  expect(() =>
    validateTerrainManifest({ ...manifest, tiles: ["https://example.com/{z}/{x}/{y}.png"] })
  ).toThrow();
  expect(() => validateTerrainManifest({ ...manifest, encoding: "mapbox" })).toThrow();
});
