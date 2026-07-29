import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("landing page renders and navigates to the map", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await page.locator('a[href="/map"]').first().click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.locator(".map-experience, .route-loading, [role=alert]").first()).toBeVisible();
});

test("language selection updates the document language", async ({ page }) => {
  await page.goto("/");
  await page.locator(".language-switcher select").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("catalog search filters cards", async ({ page }) => {
  await page.goto("/events");
  const cards = page.locator(".catalog-grid > a");
  await expect(cards).toHaveCount(3);
  await page.locator('input[type="search"]').fill("1643");
  await expect(cards).toHaveCount(1);
});

test("mobile layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("landing page has no serious axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(({ impact }) => ["critical", "serious"].includes(impact))
  ).toEqual([]);
});

test("exhibition route starts the offline-capable historical experience", async ({ page }) => {
  await page.goto("/exhibition");
  await expect(page.getByRole("heading", { name: /Qazaq/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Начать демонстрацию" })).toBeVisible();
  await page.getByRole("button", { name: "Исследовать самостоятельно" }).click();
  await expect(page.locator(".ex-era-selector button")).toHaveCount(5);
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1465");
  await page.locator(".ex-era-selector button").nth(1).click();
  await expect(page.locator(".ex-year-slider input")).toHaveValue("552");
  await page.locator(".ex-era-selector button").nth(2).click();
  await expect(page.locator(".ex-year-slider input")).toHaveValue("1465");
  await expect(page.locator(".ex-disclaimer--map")).toBeVisible();
  await page.getByRole("button", { name: /Научные источники/ }).first().click();
  await expect(page.getByRole("heading", { name: "Научные источники" })).toBeVisible();
});
