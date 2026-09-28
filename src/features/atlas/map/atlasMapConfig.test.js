import { describe, expect, it } from "vitest";
import { resolveAtlasBasemapConfig } from "./atlasMapConfig.js";

describe("Atlas basemap modes", () => {
  it("defaults to the existing remote development provider", () => {
    expect(resolveAtlasBasemapConfig()).toEqual({
      mode: "remote",
      styleUrl: "https://tiles.openfreemap.org/styles/dark",
    });
    expect(
      resolveAtlasBasemapConfig({
        VITE_ATLAS_BASEMAP_MODE: "remote",
        VITE_ATLAS_STYLE_URL: "/ignored.json",
      })
    ).toEqual(resolveAtlasBasemapConfig());
  });
  it("supports a default or custom same-origin self-hosted style", () => {
    expect(resolveAtlasBasemapConfig({ VITE_ATLAS_BASEMAP_MODE: "self-hosted" })).toEqual({
      mode: "self-hosted",
      styleUrl: "/maps/style.json",
    });
    expect(
      resolveAtlasBasemapConfig({
        VITE_ATLAS_BASEMAP_MODE: "self-hosted",
        VITE_ATLAS_STYLE_URL: "/maps/custom/style.json",
      }).styleUrl
    ).toBe("/maps/custom/style.json");
  });
  it("does not use Mapbox URLs or tokens in either mode", () => {
    for (const mode of ["remote", "self-hosted"]) {
      const config = resolveAtlasBasemapConfig({
        VITE_ATLAS_BASEMAP_MODE: mode,
        VITE_MAPBOX_TOKEN: "ignored",
      });
      expect(JSON.stringify(config)).not.toMatch(/mapbox|token|ignored/i);
    }
  });
  it("rejects invalid mode and external self-hosted URLs without silently using remote", () => {
    expect(() => resolveAtlasBasemapConfig({ VITE_ATLAS_BASEMAP_MODE: "typo" })).toThrow();
    for (const styleUrl of [
      "https://example.org/style.json",
      "//example.org/style.json",
      "mapbox://styles/test",
      "/\\example.org/style.json",
    ]) {
      expect(() =>
        resolveAtlasBasemapConfig({
          VITE_ATLAS_BASEMAP_MODE: "self-hosted",
          VITE_ATLAS_STYLE_URL: styleUrl,
        })
      ).toThrow();
    }
  });
});
