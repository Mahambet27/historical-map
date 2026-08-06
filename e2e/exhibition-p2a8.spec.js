import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const openStartup = async (page, query = "") => {
  await page.goto(
    `/demo${query}${query.includes("?") ? "&" : "?"}startup=true`
  );
  await expect(page.locator(".ex-demo-startup")).toBeVisible();
};

const startDemo = async (page, query = "") => {
  await page.goto(
    `/demo${query}${query.includes("?") ? "&" : "?"}legacyUi=true`
  );
  await expect(page.locator(".exhibition")).toBeVisible();
};

test("opens the stable /demo entry", async ({ page }) => {
  await openStartup(page);
  await expect(page.getByText("2026.08-stable1")).toBeVisible();
});

test("/demo always enters official mode", async ({ page }) => {
  await startDemo(page, "?officialDemo=false");
  await expect(page.locator(".exhibition")).toHaveAttribute(
    "data-official-demo",
    "true"
  );
});

test("official demo defaults to 1465", async ({ page }) => {
  await startDemo(page);
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1465");
});

test("official story starts", async ({ page }) => {
  await startDemo(page);
  await page.getByRole("button", { name: /Story|История|Тарих/ }).click();
  await expect(page.locator(".ex-historical-story")).toBeVisible();
});

test("operator reset returns to 1465", async ({ page }) => {
  await startDemo(page);
  await page.keyboard.press("Control+Shift+O");
  await page.getByRole("button", { name: "Reset to 1465" }).click();
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1465");
});

for (const language of ["ru", "kk", "en"]) {
  test(`supports ${language.toUpperCase()} demo`, async ({ page }) => {
    await openStartup(page, `?lang=${language}`);
    await expect(page.locator("html")).toHaveAttribute("lang", language);
  });
}

test("kiosk auto-starts and offers fullscreen", async ({ page }) => {
  await page.goto("/demo?kiosk=true&fallback=svg");
  await expect(page.locator(".exhibition")).toBeVisible({ timeout: 8000 });
  await expect(page.locator(".ex-fullscreen-prompt")).toBeVisible();
});

test("operator menu opens with safe shortcut", async ({ page }) => {
  await startDemo(page);
  await page.keyboard.press("Control+Shift+O");
  await expect(page.locator(".ex-operator-menu")).toBeVisible();
});

test("low-device mock selects light startup", async ({ page }) => {
  await openStartup(page, "?mockDevice=low");
  await expect(page.locator(".ex-demo-startup__language")).toContainText(
    "light"
  );
});

test("low-FPS guard remains available", async ({ page }) => {
  await startDemo(page, "?mockFps=10&quality=high");
  await expect(page.locator(".exhibition")).toHaveAttribute(
    "data-official-demo",
    "true"
  );
});

test("Mapbox absence uses SVG fallback", async ({ page }) => {
  await startDemo(page, "?mapboxFailure=true");
  await expect(page.locator(".ex-map-fallback")).toBeVisible();
});

test("explicit SVG fallback works", async ({ page }) => {
  await startDemo(page, "?fallback=svg");
  await expect(page.locator(".ex-map-fallback")).toBeVisible();
});

test("loaded demo remains usable offline", async ({ page, context }) => {
  await startDemo(page, "?fallback=svg");
  await context.setOffline(true);
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1465");
  await context.setOffline(false);
});

test("recovery mode opens scoped recovery panel", async ({ page }) => {
  await openStartup(page, "?recovery=true");
  await expect(page.locator(".ex-demo-recovery")).toBeVisible();
});

test("recording mode keeps official deterministic mode", async ({ page }) => {
  await startDemo(page, "?recording=true&fallback=svg");
  await expect(page.locator(".exhibition")).toHaveClass(/is-recording/);
  await expect(page.locator(".exhibition")).toHaveAttribute(
    "data-official-demo",
    "true"
  );
});

test("high contrast remains available", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("qhm.exhibition.map-style", "high-contrast")
  );
  await startDemo(page, "?fallback=svg");
  await expect(page.locator(".exhibition")).toHaveClass(/is-contrast/);
});

test("reduced motion remains usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startDemo(page, "?fallback=svg");
  await expect(page.locator(".exhibition")).toHaveAttribute(
    "data-quality",
    "light"
  );
});

test("mobile demo has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startDemo(page, "?fallback=svg&quality=light");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("release manifest matches stable release", async ({ request }) => {
  const response = await request.get("/exhibition-release.json");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({
    releaseVersion: "2026.08-stable1",
    releaseChannel: "exhibition-stable",
    noSecrets: true,
  });
});

test("startup readiness check completes safely", async ({ page }) => {
  await openStartup(page);
  await page
    .locator(".ex-demo-startup__actions button")
    .filter({ hasText: /готов|Check|тексер/i })
    .click();
  await expect(page.locator(".ex-demo-startup__status")).not.toContainText(
    "fatal"
  );
});

test("official demo has no debug UI", async ({ page }) => {
  await startDemo(page, "?scientificReview=true");
  await expect(page.locator(".ex-data-status")).toHaveCount(0);
  await expect(page.getByText(/debug/i)).toHaveCount(0);
});

test("official demo has no Scientific Review panel", async ({ page }) => {
  await startDemo(page, "?scientificReview=true");
  await expect(page.locator(".ex-scientific-review-button")).toHaveCount(0);
});

test("/exhibition remains independent", async ({ page }) => {
  await page.goto("/exhibition?fallback=svg&layers=cities");
  await expect(page.locator(".exhibition")).toBeVisible();
});

test("/legacy-map remains independent", async ({ page }) => {
  await page.goto("/legacy-map");
  await expect(page.locator(".map-page, .map-view, main").first()).toBeVisible();
  await expect(page.locator(".ex-demo-startup")).toHaveCount(0);
});

test("operator diagnostics expose Official Demo Operations", async ({ page }) => {
  await page.goto("/demo/diagnostics");
  await expect(
    page.getByRole("heading", { name: "Official Demo Operations" })
  ).toBeVisible();
});
