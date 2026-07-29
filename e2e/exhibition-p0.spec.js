import { expect, test } from "@playwright/test";

test("exhibition P0 settings and diagnostics are reachable", async ({ page }) => {
  await page.goto("/exhibition");
  await page.locator(".ex-hero__actions button").last().click();
  await page.locator(".ex-appbar nav button").last().click();
  await page.locator(".ex-access-options select").first().selectOption("atlas");
  await expect(page.locator(".exhibition")).toHaveAttribute("data-theme", "atlas");

  await page.goto("/exhibition/diagnostics");
  await expect(page.getByRole("heading", { name: "Qazaq Heritage Map" })).toBeVisible();
  await expect(page.locator(".ex-diagnostics > .ex-diagnostics__grid article")).toHaveCount(8);
});
