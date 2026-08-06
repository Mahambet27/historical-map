import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const openExhibition = async (page, query = "?quality=light") => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(`/exhibition${query}${query.includes("?") ? "&" : "?"}legacyUi=true`);
  const hero = page.locator(".ex-hero__actions");
  const autoStarts = /[?&](layers|route|place|story)=/.test(query);
  if (!autoStarts) {
    await expect(hero).toBeVisible();
    await hero.locator("button").last().click();
  }
  await expect(page.locator(".exhibition")).toBeVisible();
};

test("layer panel enables cities and route, then starts and pauses a journey", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openExhibition(page);
  await page.getByRole("button", { name: /Слои/ }).click();
  await expect(page.locator(".ex-layer-panel")).toBeVisible();
  await page.getByLabel("Исторические города").check();
  await page.getByLabel("Торговые маршруты").check();
  await page.locator(".ex-layer-panel").getByRole("button", { name: /Закрыть/ }).click();

  await page.getByRole("button", { name: /Великий Шёлковый путь/ }).click();
  await expect(page.locator(".ex-route-panel")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Великий Шёлковый путь/ })
  ).toBeVisible();
  await page.getByRole("button", { name: /Начать путешествие/ }).click();
  await expect(page.locator(".ex-route-journey")).toBeVisible();
  await page.getByRole("button", {
    name: "Поставить путешествие на паузу",
  }).click();
  await expect(
    page.getByRole("button", { name: "Начать путешествие" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Открыть текущий город" }).click();
  await expect(page.locator(".ex-geography-panel")).toBeVisible();
  await page
    .locator(".ex-geography-panel")
    .getByRole("button", { name: /источники/i })
    .click();
  await expect(page.locator(".ex-sources-panel")).toBeVisible();
});

test("geography story opens from URL and answers a sourced question", async ({
  page,
}) => {
  await openExhibition(
    page,
    "?story=silk-road-geography&layers=routes,cities&quality=light"
  );
  await expect(page.locator(".ex-historical-story")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Географическое положение Центральной Азии",
    })
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: /Источники не фиксируют единую точную линию/,
    })
    .click();
  await expect(page.getByText("Верно")).toBeVisible();
  await expect(page.locator(".ex-atmosphere")).toHaveCount(0);
});

test("mobile layer and route panels fit every required viewport", async ({
  page,
}) => {
  await openExhibition(page, "?route=silk-road&quality=light");
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    const panel = page.locator(".ex-route-panel");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(viewport.width);
  }
});

test("reduced motion and SVG fallback keep P1B layers usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openExhibition(
    page,
    "?fallback=svg&layers=routes,cities,environment,hydrology&quality=high"
  );
  await expect(page.locator(".ex-map-fallback")).toBeVisible();
  await expect(page.locator(".ex-map-fallback__route.is-trade")).toHaveCount(4);
  await expect(page.locator(".ex-map-fallback__historical-place")).not.toHaveCount(0);
  await expect(page.locator(".ex-map-fallback__environment")).not.toHaveCount(0);
  await expect(page.locator(".ex-atmosphere")).toHaveCount(0);
});

test("URL place, offline shell, legacy map and diagnostics remain available", async ({
  page,
  context,
}) => {
  await openExhibition(page, "?place=otrar&layers=cities&quality=light");
  await expect(page.locator(".ex-geography-panel")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Отырар" })).toBeVisible();
  await page.locator(".ex-geography-panel").getByRole("button", { name: /Закрыть/ }).click();
  await page.getByRole("button", { name: /Слои/ }).click();
  await expect(page.locator(".ex-layer-panel")).toBeVisible();
  await page.locator(".ex-layer-panel").getByRole("button", { name: /Закрыть/ }).click();
  await context.setOffline(true);
  await page.getByRole("button", { name: /Слои/ }).click();
  await expect(page.locator(".ex-layer-panel")).toBeVisible();
  await context.setOffline(false);
  await page.goto("/legacy-map");
  await expect(
    page.locator(".map-experience, .route-loading, [role=alert]").first()
  ).toBeVisible();
  await page.goto("/exhibition/diagnostics?quality=light");
  await expect(page.getByRole("heading", { name: "P1B readiness" })).toBeVisible();
  await expect(page.getByText("Environment snapshots")).toBeVisible();
  await expect(page.getByText("SVG fallback readiness")).toBeVisible();
});

test("desktop route panel remains usable at 1920×1080", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openExhibition(page, "?route=silk-road&quality=high");
  await expect(page.locator(".ex-route-panel")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1920);
});

test("ordinary map route does not request P1B data chunks", async ({ page }) => {
  const p1bRequests = [];
  page.on("request", (request) => {
    if (
      /environmentSnapshots|hydrologySnapshots|historicalRoutes|historicalSettlements|routeSegments/.test(
        request.url()
      )
    ) {
      p1bRequests.push(request.url());
    }
  });

  await page.goto("/legacy-map");
  await expect(
    page.locator(".map-experience, .route-loading, [role=alert]").first()
  ).toBeVisible();
  await page.waitForTimeout(500);

  expect(p1bRequests).toEqual([]);
});
