import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const forbiddenText = ["Ridder", "Öskemen", "Altai", "KA207", "G219", "P-256"];
const forbiddenNetwork =
  /mapbox-streets|satellite|terrain-v2|bathymetry|terrain-rgb|terrain-dem/i;

const openHistoricalRoute = async (page, route) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(route);
  if (route === "/demo") {
    const start = page.locator(".ex-demo-startup__actions button").first();
    if (await start.count()) {
      await expect(start).toBeEnabled();
      await start.click();
    }
  } else if (route === "/exhibition") {
    const explore = page.locator(".ex-hero__actions button").last();
    await expect(explore).toBeVisible();
    await explore.click();
  }
  await expect(page.locator(".exhibition")).toBeVisible();
  await expect(page.locator(".ex-map-fallback")).toBeVisible();
  await expect(page.locator(".map-experience")).toHaveCount(0);
  await expect(page.locator(".mapboxgl-canvas")).toHaveCount(0);
  const body = await page.locator("body").innerText();
  for (const text of forbiddenText) expect(body).not.toContain(text);
  expect(requests.filter((url) => forbiddenNetwork.test(url))).toEqual([]);
  await page.waitForTimeout(500);
  return requests;
};

test.beforeAll(async () => {
  await mkdir("artifacts/visual", { recursive: true });
});

test("root is the clean historical product at 1366x768", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openHistoricalRoute(page, "/");
  await page.screenshot({
    path: "artifacts/visual/root-1366x768.png",
    fullPage: true,
  });
});

test("demo is the same clean historical product", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openHistoricalRoute(page, "/demo");
  await page.screenshot({
    path: "artifacts/visual/demo-1366x768.png",
    fullPage: true,
  });
});

test("exhibition is the same clean historical product", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openHistoricalRoute(page, "/exhibition");
  await page.screenshot({
    path: "artifacts/visual/exhibition-1366x768.png",
    fullPage: true,
  });
});

test("root mobile remains the clean historical product", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHistoricalRoute(page, "/");
  await page.screenshot({
    path: "artifacts/visual/root-390x844.png",
    fullPage: true,
  });
});

test("/map is historical and old Mapbox UI is isolated", async ({ page }) => {
  await openHistoricalRoute(page, "/map");
});
