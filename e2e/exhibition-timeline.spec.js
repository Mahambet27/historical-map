import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const openTimeline = async (page, query = "") => {
  await page.goto(`/exhibition?legacyUi=true${query ? `&${query}` : ""}`);
  const explore = page.locator(".ex-hero__actions button").last();
  await expect(explore).toBeVisible();
  await explore.click();
  await expect(page.locator(".ex-year-slider input")).toBeVisible();
};

test.beforeAll(async () => {
  await mkdir("artifacts/visual", { recursive: true });
});

test("restores era/year from URL and clamps an invalid year", async ({ page }) => {
  await openTimeline(page, "era=turkic&year=700");
  await expect(page.locator(".ex-era-selector button.is-active")).toContainText(
    /Тюрк|Turkic|Түркі/
  );
  await expect(page.locator(".ex-year-slider input")).toHaveValue("700");
  await page.goto("/exhibition?legacyUi=true&era=turkic&year=100");
  await expect(page.locator(".ex-hero__actions button").last()).toBeVisible();
  await page.locator(".ex-hero__actions button").last().click();
  await expect(page.locator(".ex-year-slider input")).toHaveValue("552");
  await expect(page).toHaveURL(/era=turkic&year=552/);
});

test("all eras expose their first and last year", async ({ page }) => {
  await openTimeline(page);
  const ranges = [
    [-800, -300],
    [552, 942],
    [1465, 1847],
    [1936, 1990],
    [1991, 2026],
  ];
  const eras = page.locator(".ex-era-selector button");
  for (let index = 0; index < ranges.length; index += 1) {
    await eras.nth(index).click();
    const slider = page.locator(".ex-year-slider input");
    await slider.fill(String(ranges[index][0]));
    await expect(slider).toHaveValue(String(ranges[index][0]));
    await slider.fill(String(ranges[index][1]));
    await expect(slider).toHaveValue(String(ranges[index][1]));
  }
});

test("BCE is human-readable and year zero is absent", async ({ page }) => {
  await openTimeline(page, "era=saka&year=-550");
  await expect(page.locator(".ex-year-slider strong")).toContainText(
    "550 Г. ДО Н. Э."
  );
  await expect(page.locator(".exhibition")).not.toContainText(/(^|\s)-550(\s|$)/);
  await expect(page.locator(".exhibition")).not.toContainText(/(^|\s)0 Г\./);
  await page.screenshot({
    path: "artifacts/visual/timeline-bce.png",
    fullPage: true,
  });
});

test("key-year and single-year navigation update URL", async ({ page }) => {
  await openTimeline(page, "era=kazakh-khanate&year=1465");
  await page.getByRole("button", { name: /Следующая ключевая дата/ }).click();
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1511");
  await expect(page).toHaveURL(/era=kazakh-khanate&year=1511/);
  await page.getByRole("button", { name: /Уменьшить|Минус|−1/i }).click();
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1510");
});

test("keyboard navigation supports arrows, Page keys, Home and End", async ({
  page,
}) => {
  await openTimeline(page, "era=kazakh-khanate&year=1511");
  const slider = page.locator(".ex-year-slider input");
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("1512");
  await slider.press("PageUp");
  await expect(slider).toHaveValue("1521");
  await slider.press("Home");
  await expect(slider).toHaveValue("1465");
  await slider.press("End");
  await expect(slider).toHaveValue("1847");
});

test("play/pause supports 1, 5, 10 and 25 year steps", async ({ page }) => {
  await openTimeline(page, "era=kazakh-khanate&year=1465");
  const speed = page.locator(".ex-year-slider select");
  await expect(speed.locator("option")).toHaveCount(4);
  await speed.selectOption("5");
  await page
    .locator(".ex-year-slider")
    .getByRole("button", { name: "Воспроизвести" })
    .click();
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1470", {
    timeout: 5000,
  });
  await page.locator(".ex-year-slider").getByRole("button", { name: "Пауза" }).click();
});

test("availability distinguishes exact and interval reconstruction", async ({
  page,
}) => {
  await openTimeline(page, "era=kazakh-khanate&year=1465");
  await expect(page.locator(".ex-year-availability")).toContainText(/snapshot/i);
  await page.locator(".ex-year-slider input").fill("1466");
  await expect(page.locator(".ex-year-availability")).toContainText(
    /интервал|реконструкц/i
  );
});

test("timeline keeps local historical canvas and does not call setStyle", async ({
  page,
}) => {
  await openTimeline(page);
  await page.locator(".ex-year-slider input").fill("1511");
  await expect(page.locator(".mapboxgl-canvas")).toHaveCount(0);
  await expect(page.locator(".ex-map-fallback")).toBeVisible();
});

test("timeline supports RU, KK and EN year labels", async ({ page }) => {
  await openTimeline(page, "era=saka&year=-550");
  await page.locator(".ex-language button").filter({ hasText: "KK" }).click();
  await expect(page.locator(".ex-year-slider strong")).toContainText("Б.З.Д.");
  await page.locator(".ex-language button").filter({ hasText: "EN" }).click();
  await expect(page.locator(".ex-year-slider strong")).toContainText("550 BCE");
});

test("desktop timeline visual", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openTimeline(page, "era=kazakh-khanate&year=1465");
  await page.screenshot({
    path: "artifacts/visual/timeline-desktop.png",
    fullPage: true,
  });
  await page.screenshot({
    path: "artifacts/visual/timeline-1465.png",
    fullPage: true,
  });
});

test("mobile timeline remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTimeline(page, "era=kazakh-ssr&year=1960");
  await expect(page.locator(".ex-era-selector")).toBeVisible();
  await expect(page.locator(".ex-year-slider input")).toBeVisible();
  const controls = page.locator(".ex-year-slider__steps button");
  for (let index = 0; index < (await controls.count()); index += 1) {
    const box = await controls.nth(index).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({
    path: "artifacts/visual/timeline-mobile.png",
    fullPage: true,
  });
  await page.screenshot({
    path: "artifacts/visual/timeline-aral-1960.png",
    fullPage: true,
  });
});
