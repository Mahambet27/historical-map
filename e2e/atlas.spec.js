import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import process from "node:process";
import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import { resolveAtlasBasemapConfig } from "../src/features/atlas/map/atlasMapConfig.js";
import { buildAtlasHistoricalSnapshot } from "../src/features/atlas/data/atlasHistoricalData.js";
import { atlasHistoricalGeometry } from "../src/features/atlas/data/atlasHistoricalGeometry.js";
const basemap = resolveAtlasBasemapConfig(process.env);
const ATLAS_BASEMAP_STYLE_URL = basemap.styleUrl;

// Actual deployed style with empty test-only MVT responses, not fabricated geography.
const localStyle = JSON.parse(
  readFileSync(new URL("../public/maps/style.json", import.meta.url), "utf8")
);
// Test-only observation of the actual MapLibre instance; no terrain/source mocks.
async function observeAtlasMap(page) {
  await page.route("**/src/features/atlas/map/createAtlasMap.js*", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    expect(body).toContain("map.addControl(");
    await route.fulfill({
      response,
      body: body.replace("map.addControl(", "window.__atlasTestMap = map; map.addControl("),
    });
  });
}
async function useTestBasemap(page) {
  const response = await page.request.get("/maps/style.json");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual(localStyle);
  await page.route(ATLAS_BASEMAP_STYLE_URL, (route) => route.fulfill({ json: localStyle }));
  // An empty protobuf message is a valid vector tile without layers/features.
  await page.route("**/maps/tiles/**/*.pbf", (route) =>
    route.fulfill({ contentType: "application/vnd.mapbox-vector-tile", body: Buffer.alloc(0) })
  );
}

test("atlas desktop interaction, keyboard and accessibility", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await useTestBasemap(page);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/atlas");
  await expect(page.locator(".atlas-gis-canvas")).toHaveAttribute("data-map-status", "ready");
  const canvas = page.locator(".maplibregl-canvas");
  const initialCanvas = await canvas.elementHandle();
  // Isolated Saraishyk point projected using the initial Web Mercator camera.
  const box = await canvas.boundingBox();
  const mercatorY = (lat) =>
    (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
  const point = {
    x: box.width / 2 + ((51.73 - 67) / 360) * 8192,
    y: box.height / 2 + (mercatorY(47.05) - mercatorY(48)) * 8192,
  };
  await expect(async () => {
    await canvas.click({ position: point });
    await expect(page.getByRole("heading", { name: "Сарайчик" })).toBeVisible();
  }).toPass();
  await page.getByRole("button", { name: "Закрыть: Сарайчик" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Казахское ханство");
  await page.screenshot({ path: testInfo.outputPath("atlas-desktop.png") });
  await page.getByRole("searchbox").fill("Otrar");
  await page.getByRole("searchbox").press("Enter");
  await expect(page.getByRole("heading", { name: "Отырар" })).toBeVisible();
  await page.getByRole("button", { name: "Очистить поиск" }).click();
  await expect(page.getByRole("switch", { name: "Торговые пути" })).toBeDisabled();
  await expect(page.getByTestId("atlas-trade-layer")).toHaveCount(0);
  await page.getByRole("button", { name: "Сакская эпоха", exact: true }).click();
  await expect(page.getByRole("slider")).toHaveValue("-550");
  await expect(page.getByRole("complementary", { name: "Карточка объекта" })).toHaveCount(0);
  await expect(page.locator(".atlas-marker")).toHaveCount(0);
  await page.getByRole("button", { name: "Казахское ханство", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Карточка объекта" })).toHaveCount(0);
  await expect(page.getByText("Объекты: 6", { exact: true })).toBeVisible();
  await expect(page.locator(".atlas-marker")).toHaveCount(0);
  expect(await initialCanvas.evaluate((node) => node.isConnected)).toBe(true);
  await page.getByRole("button", { name: "О проекте" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page }).include(".atlas-root").analyze();
  expect(accessibility.violations).toEqual([]);
  expect(errors).toEqual([]);
});

for (const [name, width, height] of [
  ["mobile", 390, 844],
  ["tablet", 834, 1112],
]) {
  test(`atlas ${name} layout and drawer`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await useTestBasemap(page);
    await page.goto("/atlas");
    await expect(page.locator(".atlas-gis-canvas")).toHaveAttribute("data-map-status", "ready");
    await page.screenshot({ path: testInfo.outputPath(`atlas-${name}.png`) });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await page.getByRole("button", { name: "Фильтры", exact: true }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Казахское ханство", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await page.getByRole("searchbox").fill("Otrar");
    await page.getByRole("searchbox").press("Enter");
    await expect(page.getByRole("heading", { name: "Отырар" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`atlas-${name}-card.png`) });
    const accessibility = await new AxeBuilder({ page }).include(".atlas-root").analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test("Atlas uses a live open basemap without Mapbox requests", async ({ page }, testInfo) => {
  test.skip(
    basemap.mode !== "remote",
    "Live external-provider coverage applies only to remote mode."
  );
  const mapboxRequests = [];
  page.on("request", (request) => {
    if (/mapbox\.com/.test(request.url())) mapboxRequests.push(request.url());
  });
  await page.goto("/atlas");
  await expect(page.locator(".atlas-gis-canvas")).toHaveAttribute("data-map-status", "ready");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await expect(page.locator(".atlas-marker")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("atlas-live-basemap.png") });
  expect(mapboxRequests).toEqual([]);
});

test("Atlas falls back to the preserved SVG if the style cannot load", async ({ page }) => {
  const providerRequests = [];
  page.on("request", (request) => {
    if (/openfreemap\.org|mapbox\.com/.test(request.url())) providerRequests.push(request.url());
  });
  await page.route(ATLAS_BASEMAP_STYLE_URL, (route) =>
    route.fulfill({ status: 404, body: "Style not deployed" })
  );
  await page.goto("/atlas");
  await expect(page.locator(".atlas-map-fallback")).toBeVisible();
  await expect(page.locator(".atlas-geography")).toBeVisible();
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(0);
  await page.getByRole("searchbox").fill("Otrar");
  await page.getByRole("searchbox").press("Enter");
  await expect(page.getByRole("heading", { name: "Отырар" })).toBeVisible();
  if (basemap.mode === "self-hosted") expect(providerRequests).toEqual([]);
});

test("Atlas renders real local tiles and keeps the historical overlay interactive", async ({
  page,
}, testInfo) => {
  test.skip(basemap.mode !== "self-hosted", "Requires provisioned local production tiles.");
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const external = [],
    failedAssets = [],
    tiles = new Set(),
    glyphs = new Set();
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["http:", "https:"].includes(url.protocol) && url.origin !== "http://127.0.0.1:4173") {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith("/maps/") && !response.ok()) failedAssets.push(url.pathname);
    if (url.pathname.startsWith("/maps/tiles/") && response.ok()) tiles.add(url.pathname);
    if (url.pathname.startsWith("/maps/fonts/") && response.ok()) glyphs.add(url.pathname);
  });
  await page.goto("/atlas");
  await expect(page.locator(".atlas-gis-canvas")).toHaveAttribute("data-map-status", "ready");
  const canvas = page.locator(".maplibregl-canvas");
  const initial = await canvas.elementHandle();
  await expect.poll(() => tiles.size).toBeGreaterThan(3);
  await expect.poll(() => glyphs.size).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath("atlas-real-kazakhstan-overview.png") });
  const box = await canvas.boundingBox();
  const mercatorY = (lat) =>
    (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
  await canvas.click({
    position: {
      x: box.width / 2 + ((51.73 - 67) / 360) * 8192,
      y: box.height / 2 + (mercatorY(47.05) - mercatorY(48)) * 8192,
    },
  });
  await expect(page.locator(".atlas-object-card")).toBeVisible();
  await page.getByRole("slider").focus();
  await page.keyboard.press("Home");
  await expect(page.locator(".atlas-object-card")).toHaveCount(0);
  expect(await initial.evaluate((node) => node.isConnected)).toBe(true);
  const beforeZoom = tiles.size;
  await page.locator(".maplibregl-ctrl-zoom-in").click();
  await expect.poll(() => tiles.size).toBeGreaterThan(beforeZoom);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2 + 60, { steps: 12 });
  await page.mouse.up();
  await expect(canvas).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("atlas-real-self-hosted.png") });
  expect(external).toEqual([]);
  expect(failedAssets).toEqual([]);
});

test("Atlas retains basemap and cards when optional DEM is unavailable", async ({ page }) => {
  test.skip(process.env.VITE_ATLAS_TERRAIN_ENABLED !== "true", "Requires enabled terrain");
  let requested = false;
  await page.route("**/maps/terrain/terrain.json", (route) => {
    requested = true;
    return route.fulfill({ status: 404, body: "DEM not provisioned" });
  });
  await page.goto("/atlas");
  await expect.poll(() => requested).toBe(true);
  await expect(page.locator(".atlas-gis-canvas")).toHaveAttribute("data-map-status", "ready");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await expect(page.locator(".atlas-map-fallback")).toHaveCount(0);
  await page.getByRole("searchbox").fill("Otrar");
  await page.getByRole("searchbox").press("Enter");
  await expect(page.locator(".atlas-object-card")).toBeVisible();
});

test("Atlas renders local NASA SRTM terrain and hillshade with real elevations", async ({
  page,
}, testInfo) => {
  test.skip(process.env.VITE_ATLAS_TERRAIN_ENABLED !== "true", "Requires enabled terrain");
  test.setTimeout(120000);
  await observeAtlasMap(page);
  const demTiles = new Set(),
    failures = [],
    external = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (["http:", "https:"].includes(url.protocol) && url.origin !== "http://127.0.0.1:4173")
      external.push(url.href);
  });
  page.on("response", (response) => {
    if (/\/maps\/terrain\/.*\.png/.test(response.url())) {
      if (response.ok()) demTiles.add(response.url());
      else failures.push(response.url());
    }
  });
  await page.goto("/atlas");
  await expect
    .poll(() => page.evaluate(() => window.__atlasTestMap?.getTerrain()?.source))
    .toBe("atlas-local-dem");
  expect(
    await page.evaluate(() => window.__atlasTestMap.getLayer("atlas-local-hillshade").type)
  ).toBe("hillshade");
  await expect.poll(() => demTiles.size).toBeGreaterThan(3);
  await page.evaluate(() =>
    window.__atlasTestMap.jumpTo({ center: [77.08, 43.08], zoom: 9, pitch: 55 })
  );
  await expect
    .poll(
      () => page.evaluate(() => window.__atlasTestMap.queryTerrainElevation([77.08, 43.08]) ?? 0),
      { timeout: 60000 }
    )
    .toBeGreaterThan(1500);
  await page.screenshot({ path: testInfo.outputPath("atlas-srtm-tian-shan.png") });
  await page.getByRole("slider").focus();
  await page.keyboard.press("Home");
  expect(await page.evaluate(() => window.__atlasTestMap.getTerrain().source)).toBe(
    "atlas-local-dem"
  );
  expect(
    await page.evaluate(() => Boolean(window.__atlasTestMap.getLayer("atlas-local-hillshade")))
  ).toBe(true);
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
});

test("Atlas removes terrain and hillshade after a DEM tile failure", async ({ page }) => {
  test.skip(process.env.VITE_ATLAS_TERRAIN_ENABLED !== "true", "Requires enabled terrain");
  await observeAtlasMap(page);
  let failed = 0;
  await page.route("**/maps/terrain/**/*.png", (route) => {
    failed++;
    return route.fulfill({ status: 404, body: "Test-only missing DEM tile" });
  });
  await page.goto("/atlas");
  await expect.poll(() => failed).toBeGreaterThan(0);
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__atlasTestMap?.getTerrain())))
    .toBe(false);
  expect(
    await page.evaluate(() => Boolean(window.__atlasTestMap.getLayer("atlas-local-hillshade")))
  ).toBe(false);
  await expect(page.locator(".atlas-gis-canvas")).toHaveAttribute("data-map-status", "ready");
  await page.getByRole("searchbox").fill("Otrar");
  await page.getByRole("searchbox").press("Enter");
  await expect(page.locator(".atlas-object-card")).toBeVisible();
});

test("Atlas reviewed historical territories, borders, entity card and timeline updates", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await observeAtlasMap(page);
  await useTestBasemap(page);
  await page.goto("/atlas");
  await expect(page.locator(".atlas-gis-canvas")).toHaveAttribute("data-map-status", "ready");
  const canvas = await page.locator(".maplibregl-canvas").elementHandle();
  const data = (source) =>
    page.evaluate((id) => window.__atlasTestMap.getSource(id).getData(), source);
  const expected = atlasHistoricalGeometry(buildAtlasHistoricalSnapshot(1465));
  await expect.poll(() => data("atlas-historical-territories")).toEqual(expected.territories);
  expect(await data("atlas-historical-borders")).toEqual(expected.borders);
  const modern = await page.evaluate(() =>
    window.__atlasTestMap
      .getStyle()
      .layers.filter((l) => ["country-boundaries", "administrative-boundaries"].includes(l.id))
  );
  await page.evaluate(() => {
    window.__atlasInitialMap = window.__atlasTestMap;
    window.__atlasTerritorySource = window.__atlasTestMap.getSource("atlas-historical-territories");
    window.__atlasBorderSource = window.__atlasTestMap.getSource("atlas-historical-borders");
  });
  const location = await page.evaluate(() => {
    const p = window.__atlasTestMap.project([70, 46]);
    const box = window.__atlasTestMap.getCanvas().getBoundingClientRect();
    return { x: box.x + p.x, y: box.y + p.y };
  });
  await expect(async () => {
    await page.mouse.click(location.x, location.y);
    await expect(page.locator(".atlas-object-card h2")).toHaveText("Казахское ханство");
  }).toPass();
  await page.getByRole("button", { name: "Закрыть: Казахское ханство" }).click();
  for (const [label, id] of [
    ["Исторические территории", "atlas-historical-territories-fill"],
    ["Исторические границы", "atlas-historical-borders-line"],
  ]) {
    const toggle = page.getByRole("switch", { name: label });
    await toggle.uncheck();
    await expect
      .poll(() =>
        page.evaluate((layer) => window.__atlasTestMap.getLayoutProperty(layer, "visibility"), id)
      )
      .toBe("none");
    await toggle.check();
    await expect
      .poll(() =>
        page.evaluate((layer) => window.__atlasTestMap.getLayoutProperty(layer, "visibility"), id)
      )
      .toBe("visible");
  }
  for (const year of [1510, 1522, 1200, -550]) {
    await page.getByRole("slider").evaluate((input, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
        input,
        String(value)
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, year);
    const next = atlasHistoricalGeometry(buildAtlasHistoricalSnapshot(year));
    await expect.poll(() => data("atlas-historical-territories")).toEqual(next.territories);
    await expect.poll(() => data("atlas-historical-borders")).toEqual(next.borders);
  }
  expect(
    await page.evaluate(
      () =>
        window.__atlasTestMap === window.__atlasInitialMap &&
        window.__atlasTerritorySource ===
          window.__atlasTestMap.getSource("atlas-historical-territories") &&
        window.__atlasBorderSource === window.__atlasTestMap.getSource("atlas-historical-borders")
    )
  ).toBe(true);
  expect(await canvas.evaluate((node) => node.isConnected)).toBe(true);
  expect(
    await page.evaluate(() =>
      window.__atlasTestMap
        .getStyle()
        .layers.filter((l) => ["country-boundaries", "administrative-boundaries"].includes(l.id))
    )
  ).toEqual(modern);
  await page.screenshot({ path: testInfo.outputPath("atlas-phase6-reviewed-territories.png") });
});
