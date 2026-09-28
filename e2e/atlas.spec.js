import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ATLAS_BASEMAP_STYLE_URL } from "../src/features/atlas/map/atlasMapConfig.js";

// Network-independent GIS regression: real WebGL + workers + snapshot sources.
// A separate live-provider test below checks the configured public basemap.
const testStyle = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#101b23" } }],
};
async function useTestBasemap(page) {
  await page.route(ATLAS_BASEMAP_STYLE_URL, (route) => route.fulfill({ json: testStyle }));
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
  await page.route(ATLAS_BASEMAP_STYLE_URL, (route) => route.abort());
  await page.goto("/atlas");
  await expect(page.locator(".atlas-map-fallback")).toBeVisible();
  await expect(page.locator(".atlas-geography")).toBeVisible();
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(0);
  await page.getByRole("searchbox").fill("Otrar");
  await page.getByRole("searchbox").press("Enter");
  await expect(page.getByRole("heading", { name: "Отырар" })).toBeVisible();
});
