import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const clearAndOpen = async (page, query) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(`/exhibition${query}${query.includes("?") ? "&" : "?"}legacyUi=true`);
  await expect(page.locator(".exhibition")).toBeVisible();
};

test("official demo starts clean and hides demo-only temporal geography", async ({
  page,
}) => {
  await clearAndOpen(
    page,
    "?officialDemo=true&fallback=svg&layers=hydrology,environment,cities&quality=light"
  );
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1465");
  await expect(page.locator(".ex-map-fallback")).toBeVisible();
  await expect(page.locator(".ex-map-fallback__environment.is-mountain")).toHaveCount(0);
  await page.getByRole("button", { name: /Слои/ }).click();
  await expect(page.locator(".ex-layer-panel__preset select")).toHaveValue("clean");
});

test("official demo supports 1465 to 1511 and opens reconstruction sources", async ({
  page,
}) => {
  await clearAndOpen(page, "?officialDemo=true&quality=light");
  const slider = page.locator(".ex-year-slider input");
  await slider.fill("1511");
  await expect(slider).toHaveValue("1511");
  await expect(page.locator(".ex-official-demo-warning")).toBeVisible();
  await page.getByRole("button", { name: /Научные источники/ }).first().click();
  await expect(page.locator(".ex-sources-panel")).toBeVisible();
});

test("scientific review is explicit and hidden in official demo", async ({
  page,
}) => {
  await clearAndOpen(
    page,
    "?scientificReview=true&layers=cities&quality=light"
  );
  await page.locator(".ex-scientific-review-button").click();
  await expect(page.locator(".ex-scientific-review")).toBeVisible();
  await expect(page.getByText("P2A.7 · read-only")).toBeVisible();

  await page.goto(
    "/exhibition?officialDemo=true&scientificReview=true&quality=light"
  );
  await expect(page.locator(".exhibition")).toBeVisible();
  await expect(page.locator(".ex-scientific-review-button")).toHaveCount(0);
});

test("low FPS mock activates accessible degraded mode", async ({ page }) => {
  await clearAndOpen(
    page,
    "?route=silk-road&layers=routes,cities&quality=high&mockFps=10"
  );
  await page.getByRole("button", { name: /Начать путешествие/ }).click();
  await expect(page.locator(".ex-route-journey")).toBeVisible();
  await expect(page.locator(".ex-performance-guard")).toBeVisible({
    timeout: 7000,
  });
});

test("official demo remains usable on mobile, kiosk and offline", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await clearAndOpen(
    page,
    "?officialDemo=true&kiosk=true&fallback=svg&quality=light"
  );
  await expect(page.locator(".ex-map-fallback")).toBeVisible();
  await context.setOffline(true);
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1465");
  await context.setOffline(false);
});

test("release manifest and diagnostics expose the stable release", async ({
  page,
}) => {
  const response = await page.request.get("/exhibition-release.json");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    releaseChannel: "exhibition-stable",
    noSecrets: true,
  });
  expect(JSON.stringify(manifest)).not.toMatch(/C:\\|C:\/Users/);

  await page.goto("/exhibition/diagnostics");
  await expect(
    page.getByRole("heading", { name: "Scientific and Release Readiness" })
  ).toBeVisible();
  await expect(page.getByText("2026.08-stable1")).toBeVisible();
});

test("ordinary map does not load scientific review UI", async ({ page }) => {
  const scientificChunks = [];
  page.on("response", (response) => {
    if (/ScientificReview|scientificReadiness/.test(response.url())) {
      scientificChunks.push(response.url());
    }
  });
  await page.goto("/legacy-map");
  await expect(page.locator(".map-page, .map-view, main").first()).toBeVisible();
  expect(scientificChunks).toEqual([]);
});
