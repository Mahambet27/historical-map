import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const openExhibition = async (page, query = "?quality=light") => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(`/exhibition${query}`);
  const hero = page.locator(".ex-hero__actions");
  const autoStarts = /[?&](archiveMap|evidence|review|story)=/.test(query);
  if (!autoStarts) {
    await expect(hero).toBeVisible();
    await hero.locator("button").last().click();
  }
  await expect(page.locator(".exhibition")).toBeVisible();
};

test("archive panel selects the permitted overlay, changes opacity and compares by swipe", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openExhibition(page);
  await page.getByRole("button", { name: /Слои/ }).click();
  await page.getByLabel("Архивные карты").check();
  await page.getByRole("button", { name: "Архивные карты" }).click();
  const panel = page.locator(".ex-archive-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator("dd").filter({ hasText: "permission_granted" })).toBeVisible();
  await expect(panel.locator("dd").filter({ hasText: /^unknown$/ }).first()).toBeVisible();
  await panel.getByRole("button", { name: "Показать overlay" }).click();
  await expect(page.locator(".ex-archive-attribution")).toBeVisible();
  const opacity = panel.getByLabel("Прозрачность overlay");
  await opacity.fill("35");
  await expect(page.locator(".ex-archive-attribution")).toContainText("35%");
  await panel.getByRole("button", { name: "Сравнить с реконструкцией" }).click();
  const slider = page.getByRole("slider", { name: "Сравнение карты и реконструкции" });
  await expect(slider).toHaveAttribute("aria-valuenow", "50");
  const swipe = page.locator(".ex-archive-swipe");
  const box = await swipe.boundingBox();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
  await page.mouse.up();
  await expect(slider).toHaveAttribute("aria-valuenow", /2\d|3\d/);
  await slider.press("ArrowRight");
  await expect(slider).not.toHaveAttribute("aria-valuenow", "50");
});

test("entity evidence opens a claim, its source and citation export", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openExhibition(page, "?evidence=entity:kazakh-khanate&quality=light");
  const evidence = page.locator(".ex-evidence-panel");
  await expect(evidence).toBeVisible();
  await expect(evidence.getByText(/Формирование Казахского ханства/)).toBeVisible();
  await evidence.getByRole("button", { name: /Формирование Казахского ханства/ }).click();
  await evidence.getByRole("button", { name: /Формирование Казахского ханства/ }).click();
  await evidence.getByRole("button", { name: "▤ Sources" }).click();
  await expect(page.locator(".ex-sources-panel")).toBeVisible();
  await page.locator(".ex-sources-panel").getByRole("button", { name: /Citation:/ }).first().click();
  await expect(page.locator(".ex-citation-panel")).toBeVisible();
  await page.getByRole("button", { name: /Скопировать цитирование/ }).click();
  await expect(page.getByRole("button", { name: /Скопировать цитирование/ })).toContainText("✓");
});

test("review queue changes local status and exports a JSON report", async ({ page }) => {
  await openExhibition(page);
  await page.keyboard.press("q");
  const review = page.locator(".ex-review-panel");
  await expect(review).toBeVisible();
  await expect(review.locator(".ex-review-list article")).not.toHaveCount(0);
  const status = review.locator("select").first();
  await status.selectOption("in_review");
  await expect(status).toHaveValue("in_review");
  const downloadPromise = page.waitForEvent("download");
  await review.getByRole("button", { name: /review-report.json/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("review-report.json");
});

test("evidence story works in three languages and answers a question", async ({ page }) => {
  await openExhibition(page, "?story=historical-evidence&quality=light");
  const story = page.locator(".ex-historical-story");
  await expect(story).toBeVisible();
  await expect(story.getByText(/Как историки восстанавливают карту прошлого/)).toBeVisible();
  await story.getByRole("button", { name: /Факт прямо связан/ }).click();
  await expect(story.getByText("Верно")).toBeVisible();
  await page.getByRole("button", { name: "KK" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "kk");
  await page.getByRole("button", { name: "EN" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("mobile, reduced motion, high contrast and SVG fallback remain accessible", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openExhibition(page, "?fallback=svg&archiveMap=qhm-evidence-overlay-demo&quality=light");
  await expect(page.locator(".ex-map-fallback")).toBeVisible();
  await expect(page.locator(".ex-archive-attribution")).toBeVisible();
  await page.keyboard.press("e");
  await expect(page.locator(".ex-evidence-panel")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.locator(".ex-evidence-panel .ex-icon-button").click();
  await page.getByRole("button", { name: /Доступность/ }).click();
  await page.getByRole("checkbox", { name: /контраст/i }).check();
  await expect(page.locator(".exhibition")).toHaveClass(/is-contrast/);
});

test("permitted overlay remains usable offline after its explicit first load", async ({ page, context }) => {
  await openExhibition(page, "?archiveMap=qhm-evidence-overlay-demo&quality=light");
  await expect(page.locator(".ex-archive-attribution")).toBeVisible();
  await page.keyboard.press("v");
  await expect(page.locator(".ex-archive-panel")).toBeVisible();
  await page.locator(".ex-archive-panel .ex-icon-button").click();
  await context.setOffline(true);
  await page.keyboard.press("v");
  await expect(page.locator(".ex-archive-panel")).toBeVisible();
  await expect(page.locator(".ex-archive-panel").locator("dd").filter({ hasText: "permission_granted" })).toBeVisible();
  await context.setOffline(false);
});

test("unknown-license URL is blocked and never requests a full image", async ({ page }) => {
  const imageRequests = [];
  page.on("request", (request) => {
    if (
      request.resourceType() === "image" &&
      /future-institutional|archive-placeholder/.test(request.url())
    ) {
      imageRequests.push(request.url());
    }
  });
  await openExhibition(page, "?archiveMap=future-institutional-archive-placeholder&quality=light");
  await expect(page.locator(".ex-archive-panel")).toBeVisible();
  await expect(page.getByText(/Полноразмерный материал не показывается/)).toBeVisible();
  await expect(page.locator(".ex-archive-attribution")).toHaveCount(0);
  expect(imageRequests).toEqual([]);
});

test("ordinary exhibition and /map do not request P1C datasets or full images", async ({ page }) => {
  const p1cRequests = [];
  page.on("request", (request) => {
    if (/sourceClaims|sourceDisputes|archiveMaps|qhm-evidence-overlay/.test(request.url())) {
      p1cRequests.push(request.url());
    }
  });
  await openExhibition(page);
  await page.waitForTimeout(500);
  expect(p1cRequests).toEqual([]);
  await page.goto("/map");
  await expect(page.locator(".map-experience, .route-loading, [role=alert]").first()).toBeVisible();
  await page.waitForTimeout(500);
  expect(p1cRequests).toEqual([]);
});

test("diagnostics reports P1C readiness at desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/exhibition/diagnostics?quality=light");
  await expect(page.getByRole("heading", { name: "P1C readiness" })).toBeVisible();
  await expect(page.getByText("Claim count")).toBeVisible();
  await expect(page.getByText("Validation warnings")).toBeVisible();
});
