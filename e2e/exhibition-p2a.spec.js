import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const testConfig = (dataSource) => ({
  dataSource,
  url: "https://p2a.test.invalid",
  anonKey: "eyJx.e30.signature",
  serviceRoleKey: "",
});

const installDataSource = async (page, dataSource) => {
  await page.addInitScript((configuration) => {
    window.__QHM_P2A_TEST_CONFIG__ = configuration;
    localStorage.clear();
  }, testConfig(dataSource));
};

const openExhibition = async (page, query = "?quality=light") => {
  await page.goto(`/exhibition${query}`);
  const hero = page.locator(".ex-hero__actions");
  await expect(hero).toBeVisible();
  await hero.locator("button").last().click();
  await expect(page.locator(".exhibition")).toBeVisible();
};

const snapshot = (datasetVersion = "p2a-2026-08") => ({
  datasetVersion,
  year: 1465,
  language: "ru",
  entities: [],
  geometries: [],
  places: [],
  routes: { routes: [], segments: [], places: [] },
  environment: [],
  hydrology: [],
  labels: [],
});

const installMockSupabase = async (
  page,
  { datasetVersion = "p2a-2026-08", invalidSnapshot = false } = {}
) => {
  await page.route("https://p2a.test.invalid/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/rest/v1/p2a_dataset_metadata")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ dataset_version: datasetVersion }]),
      });
      return;
    }
    if (url.includes("/rest/v1/rpc/get_p2a_dataset_status")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          datasetVersion,
          schemaVersion: 1,
          public: true,
        }),
      });
      return;
    }
    if (url.includes("/rest/v1/rpc/get_exhibition_snapshot")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          invalidSnapshot ? { unsupported: true } : snapshot(datasetVersion)
        ),
      });
      return;
    }
    if (url.includes("/rest/v1/rpc/get_historical_routes")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ routes: [], segments: [], places: [] }),
      });
      return;
    }
    if (url.includes("/rest/v1/rpc/get_educational_story")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
};

test("local mode opens Exhibition without Supabase requests", async ({ page }) => {
  await installDataSource(page, "local");
  const requests = [];
  page.on("request", (request) => {
    if (request.url().includes("p2a.test.invalid")) requests.push(request.url());
  });
  await openExhibition(page);
  await expect(page.locator(".ex-data-status")).toContainText(/локальные/i);
  await page.getByRole("button", { name: "EN" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(requests).toEqual([]);
});

test("auto mode uses a successful mocked Supabase snapshot", async ({ page }) => {
  await installDataSource(page, "auto");
  await installMockSupabase(page);
  await openExhibition(page);
  await expect(page.locator(".ex-data-status")).toContainText(/сервер/i);
  await page.goto("/exhibition/diagnostics?quality=light");
  await expect(page.getByRole("heading", { name: "P2A Data Foundation" })).toBeVisible();
  await expect(page.getByText("p2a-2026-08").first()).toBeVisible();
  await expect(page.getByText("supabase", { exact: true }).first()).toBeVisible();
});

test("auto mode exposes fallback and retries without reloading the page", async ({ page }) => {
  await installDataSource(page, "auto");
  let serverReady = false;
  await page.route("https://p2a.test.invalid/**", async (route) => {
    if (!serverReady) {
      await route.abort("failed");
      return;
    }
    const url = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        url.includes("get_p2a_dataset_status")
          ? {
              datasetVersion: "p2a-2026-08",
              schemaVersion: 1,
              public: true,
            }
          : url.includes("p2a_dataset_metadata")
            ? [{ dataset_version: "p2a-2026-08" }]
            : snapshot()
      ),
    });
  });
  await openExhibition(page);
  const status = page.locator(".ex-data-status");
  await expect(status).toContainText(/локальный резерв/i);
  serverReady = true;
  await status.getByRole("button", { name: /Повторить подключение/i }).click();
  await expect(status).toContainText(/сервер/i);
  await expect(page.locator(".exhibition")).toBeVisible();
});

test("invalid server snapshot activates local fallback and keeps P1A–P1C usable", async ({ page }) => {
  await installDataSource(page, "auto");
  await installMockSupabase(page, { invalidSnapshot: true });
  await openExhibition(page, "?fallback=svg&quality=light");
  await expect(page.locator(".ex-data-status")).toContainText(/локальный резерв/i);
  await expect(page.locator(".ex-map-fallback")).toBeVisible();
  await page.keyboard.press("v");
  await expect(page.locator(".ex-archive-panel")).toBeVisible();
  await page.locator(".ex-archive-panel .ex-icon-button").click();
  await page.keyboard.press("e");
  await expect(page.locator(".ex-evidence-panel")).toBeVisible();
});

test("fallback remains responsive on mobile, reduced motion and high contrast", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installDataSource(page, "auto");
  await page.route("https://p2a.test.invalid/**", (route) => route.abort("failed"));
  await openExhibition(page, "?fallback=svg&quality=light");
  await expect(page.locator(".ex-data-status")).toContainText(/резерв/i);
  await page.getByRole("button", { name: /Доступность/ }).click();
  await page.getByRole("checkbox", { name: /контраст/i }).check();
  await expect(page.locator(".exhibition")).toHaveClass(/is-contrast/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("/map and kiosk mode make no P2A network request", async ({ page }) => {
  await installDataSource(page, "auto");
  const requests = [];
  page.on("request", (request) => {
    if (request.url().includes("p2a.test.invalid")) requests.push(request.url());
  });
  await page.goto("/map");
  await expect(
    page.locator(".map-experience, .route-loading, [role=alert]").first()
  ).toBeVisible();
  await page.waitForTimeout(500);
  expect(requests).toEqual([]);
  await page.goto("/exhibition?kiosk=1&quality=light");
  await expect(page.locator(".exhibition, .ex-hero").first()).toBeVisible();
});
