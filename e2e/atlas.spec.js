import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import process from "node:process";
import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import { resolveAtlasBasemapConfig } from "../src/features/atlas/map/atlasMapConfig.js";
const basemap = resolveAtlasBasemapConfig(process.env);
const ATLAS_BASEMAP_STYLE_URL = basemap.styleUrl;

// Actual deployed style with empty test-only MVT responses, not fabricated geography.
const localStyle = JSON.parse(
  readFileSync(new URL("../public/maps/style.json", import.meta.url), "utf8")
);
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
