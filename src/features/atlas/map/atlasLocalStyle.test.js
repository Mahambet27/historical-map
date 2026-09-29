import { expect, it } from "vitest";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import style from "../../../../public/maps/style.json";
import {
  ATLAS_PLACES_SOURCE,
  ATLAS_PLACES_LAYER,
  resolveAtlasBasemapConfig,
} from "./atlasMapConfig.js";

it("loads a valid local vector style with all required basemap layers", () => {
  expect(validateStyleMin(style)).toEqual([]);
  expect(style.center).toEqual([67, 48]);
  expect(new Set(style.layers.map((layer) => layer["source-layer"]).filter(Boolean))).toEqual(
    new Set(["water", "waterway", "boundary", "transportation", "place"])
  );
  expect(style.layers.some((layer) => layer.type === "symbol")).toBe(true);
});

it("keeps every self-hosted asset URL local without provider APIs or tokens", () => {
  const config = resolveAtlasBasemapConfig({ VITE_ATLAS_BASEMAP_MODE: "self-hosted" });
  const urls = [config.styleUrl, style.glyphs];
  for (const source of Object.values(style.sources)) {
    expect(source.type).toBe("vector");
    expect(source.scheme).toBe("xyz");
    expect(source.url).toBeUndefined();
    urls.push(...source.tiles);
  }
  expect(style.sprite).toBeUndefined();
  for (const url of urls) expect(url).toMatch(/^\/maps\/(?!\/)/);
  expect(JSON.stringify([config, style])).not.toMatch(/mapbox|openfreemap|google|access_token/i);
});

it("reserves historical IDs for the independent snapshot overlay", () => {
  expect(style.sources).not.toHaveProperty(ATLAS_PLACES_SOURCE);
  expect(style.layers.map((layer) => layer.id)).not.toContain(ATLAS_PLACES_LAYER);
  expect(resolveAtlasBasemapConfig().styleUrl).toBe("https://tiles.openfreemap.org/styles/dark");
});
