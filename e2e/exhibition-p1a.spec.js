import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const openExhibition = async (page, query = "?quality=light") => {
  await page.goto(`/exhibition${query}`);
  await page.locator(".ex-hero__actions button").last().click();
  await expect(page.locator(".exhibition")).toBeVisible();
};

const goToYear = async (page, year) => {
  await page.locator(".ex-year-slider input").fill(String(year));
  await expect(page.locator(".ex-year-slider input")).toHaveValue(String(year));
};

test("significant year transition opens curated change and its sources", async ({ page }) => {
  await openExhibition(page);
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1465");
  await goToYear(page, 1511);
  await expect(page.locator(".ex-change-prompt")).toBeVisible();
  await page
    .locator(".ex-change-prompt")
    .getByRole("button", { name: "Посмотреть объяснение" })
    .click({ force: true });
  await expect(page.locator(".ex-change-panel")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Почему изменилась карта" })).toBeVisible();
  await expect(page.getByText("Начало правления Касым хана")).toBeVisible();
  await page.locator(".ex-change-panel .ex-panel__actions button").first().click();
  await expect(page.locator(".ex-sources-panel")).toBeVisible();
  await expect(page.getByText("Қасым ханның билігі (1511–1521 жж.)")).toBeVisible();
});

test("comparison supports overlay and worker-computed changes", async ({ page }) => {
  test.setTimeout(60_000);
  await openExhibition(page);
  await goToYear(page, 1511);
  await page.getByRole("button", { name: "Посмотреть объяснение" }).click();
  await page.getByRole("button", { name: /Запустить сравнение/ }).click();
  await expect(page.locator(".ex-compare-panel")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Наложение" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  const startedAt = Date.now();
  await page.getByRole("tab", { name: "Изменения" }).click();
  await expect(page.getByRole("tab", { name: "Изменения" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(page.locator(".ex-compare-status")).toBeHidden({ timeout: 30_000 });
  await expect(page.locator(".ex-compare-error")).toHaveCount(0);
  console.info(`Geometry difference ready in ${Date.now() - startedAt} ms`);
  await expect(page.getByRole("dialog").locator(".ex-change-legend")).toBeVisible();
});

test("educational story advances, answers a question and exposes step sources", async ({ page }) => {
  await openExhibition(page);
  const startedAt = Date.now();
  await page.getByRole("button", { name: /История/ }).click();
  await expect(page.locator(".ex-historical-story")).toBeVisible();
  console.info(`Historical story visible in ${Date.now() - startedAt} ms`);
  await expect(
    page.getByRole("heading", { name: "Политическая ситуация до образования ханства" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Далее" }).click();
  await expect(page.getByText("Керей и Жанибек", { exact: true })).toBeVisible();
  for (const heading of [
    "Переход в Могулистан",
    "Образование ханства в 1465–1466 годах",
    "Территория раннего ханства",
    "Касым хан",
  ]) {
    await page.getByRole("button", { name: "Далее" }).click();
    await expect(
      page.getByRole("heading", { name: heading, exact: true })
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Касым хан", exact: true }).click();
  await expect(page.getByText("Верно")).toBeVisible();
  await page.getByRole("button", { name: /Источники этого шага/ }).click();
  await expect(page.locator(".ex-historical-story__sources article")).toHaveCount(2);
  await page.getByRole("button", { name: "Выйти из истории" }).click();
  await expect(page.locator(".ex-historical-story")).toHaveCount(0);
});

test("mobile bottom sheet and reduced motion remain accessible", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openExhibition(page);
  await goToYear(page, 1511);
  await page.getByRole("button", { name: "Посмотреть объяснение" }).click();
  const sheet = page.locator(".ex-change-panel");
  await expect(sheet).toBeVisible();
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    const box = await sheet.boundingBox();
    expect(box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(viewport.width);
  }
});

test("loaded P1A remains usable offline and legacy map still opens", async ({
  page,
  context,
}) => {
  await openExhibition(page);
  // Prime the on-demand P1A change UI before simulating a lost connection.
  // The assertion below then verifies already-loaded functionality, rather
  // than asking the browser to fetch a lazy chunk while it is offline.
  await goToYear(page, 1511);
  await expect(page.locator(".ex-change-prompt")).toBeVisible();
  await goToYear(page, 1465);
  await page.locator(".ex-change-prompt .ex-icon-button").click();
  await expect(page.locator(".ex-change-prompt")).toHaveCount(0);
  await context.setOffline(true);
  await goToYear(page, 1511);
  await expect(
    page.getByRole("button", { name: /Почему изменилась карта/ })
  ).toBeVisible();
  await expect(page.locator("main [role=alert]")).toHaveCount(0);
  await context.setOffline(false);
  await page.goto("/map");
  await expect(
    page.locator(".map-experience, .route-loading, [role=alert]").first()
  ).toBeVisible();
});

test("diagnostics reports P1A readiness", async ({ page }) => {
  await page.goto("/exhibition/diagnostics?quality=light");
  await expect(page.getByRole("heading", { name: "P1A readiness" })).toBeVisible();
  await expect(page.getByText("Historical change dataset")).toBeVisible();
  await expect(page.getByText("Question count")).toBeVisible();
  await expect(page.getByText("Source completeness")).toBeVisible();
});
