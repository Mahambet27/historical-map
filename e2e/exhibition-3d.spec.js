import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const openExhibition = async (page, quality = "high") => {
  await page.goto(`/exhibition?legacyUi=true&quality=${quality}`);
  await page.locator(".ex-hero__actions button").last().click();
  await expect(page.locator(".exhibition")).toBeVisible();
};

const openThreeD = (page) =>
  page.getByRole("button", { name: "3D", exact: true }).click();

test("ordinary exhibition does not request GLB or model-viewer", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await openExhibition(page);
  await page.waitForTimeout(500);
  expect(requests.some((url) => /\.glb(?:\?|$)/.test(url))).toBe(false);
  expect(requests.some((url) => /google_model-viewer|model-viewer-F|@google\/model-viewer/.test(url))).toBe(false);
});

test("opening 3D shows the local poster", async ({ page }) => {
  await page.route("**/models/exhibition/*.glb", (route) => route.abort());
  await openExhibition(page);
  await openThreeD(page);
  await expect(page.locator(".ex-3d-poster")).toBeVisible();
  await expect(page.locator(".ex-3d-poster")).toHaveAttribute(
    "src",
    "/models/exhibition/posters/bory-tastagan.webp"
  );
});

test("high quality requests GLB only after opening 3D", async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) =>
    failedRequests.push(`${request.url()} :: ${request.failure()?.errorText}`)
  );
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await openExhibition(page, "high");
  const modelRequest = page.waitForRequest(/\/models\/exhibition\/bory-tastagan\.glb/);
  const openedAt = Date.now();
  await openThreeD(page);
  await modelRequest;
  await page.waitForTimeout(500);
  expect(pageErrors).toEqual([]);
  const unrelatedRepositoryFallback =
    failedRequests.length > 0 &&
    failedRequests.every((value) => /supabase\.co\/rest\/v1\/rpc\//.test(value));
  expect(
    unrelatedRepositoryFallback
      ? consoleErrors.filter((value) => !/ERR_NAME_NOT_RESOLVED/.test(value))
      : consoleErrors,
    failedRequests.join("\n")
  ).toEqual([]);
  await expect(page.locator(".ex-3d-panel")).toHaveAttribute("data-3d-status", "ready", {
    timeout: 20000,
  });
  const localReadyMs = Date.now() - openedAt;
  console.info(`Local production 3D ready in ${localReadyMs} ms`);
});

test("light quality requires explicit 3D loading", async ({ page }) => {
  const modelUrls = [];
  page.on("request", (request) => {
    if (request.url().includes("bory-tastagan.glb")) modelUrls.push(request.url());
  });
  await openExhibition(page, "light");
  await openThreeD(page);
  await expect(page.locator(".ex-3d-panel")).toHaveAttribute("data-3d-status", "idle");
  await expect(page.getByRole("button", { name: /Загрузить 3D вручную/ })).toBeVisible();
  await page.waitForTimeout(400);
  expect(modelUrls).toEqual([]);
  const modelRequest = page.waitForRequest(/\/models\/exhibition\/bory-tastagan\.glb/);
  await page.getByRole("button", { name: /Загрузить 3D вручную/ }).click();
  await modelRequest;
});

test("model error keeps poster and offers retry", async ({ page }) => {
  await page.route("**/models/exhibition/*.glb", (route) =>
    route.fulfill({ status: 404, contentType: "model/gltf-binary", body: "" })
  );
  await openExhibition(page, "high");
  await openThreeD(page);
  await expect(page.locator(".ex-3d-fallback")).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("button", { name: "Повторить", exact: true })
  ).toBeVisible();
  await expect(page.locator(".ex-3d-poster")).toBeVisible();
});

test("diagnostics exposes 3D readiness", async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto("/exhibition/diagnostics?quality=light");
  await expect(page.getByRole("heading", { name: "3D readiness" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Local model-viewer")).toBeVisible();
  await expect(page.getByText("Production model manifest")).toBeVisible();
  await expect(page.getByText("Primary model size")).toBeVisible();
});

test("loaded exhibition remains usable after going offline", async ({ page, context }) => {
  await openExhibition(page, "light");
  await context.setOffline(true);
  await page.locator(".ex-year-slider input").fill("1511");
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1511");
  const sourcesButton = page.locator(".ex-appbar nav button").first();
  await expect(sourcesButton).toBeVisible();
  await sourcesButton.click();
  await expect(page.locator(".ex-sources-panel")).toBeVisible();
});

test("main map does not request model-viewer before explicit 3D action", async ({ page }) => {
  const viewerRequests = [];
  page.on("request", (request) => {
    if (/google_model-viewer|model-viewer-F|@google\/model-viewer/.test(request.url())) {
      viewerRequests.push(request.url());
    }
  });
  await page.goto("/legacy-map");
  await expect(page.locator(".map-experience, .route-loading, [role=alert]").first()).toBeVisible();
  await page.waitForTimeout(500);
  expect(viewerRequests).toEqual([]);
});
