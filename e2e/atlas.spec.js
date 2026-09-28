import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("atlas desktop interaction, keyboard and accessibility", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/atlas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Казахское ханство");
  await page.screenshot({ path: testInfo.outputPath("atlas-desktop.png") });
  await page.getByRole("searchbox").fill("Otrar");
  await page.getByRole("searchbox").press("Enter");
  await expect(page.getByRole("heading", { name: "Отырар" })).toBeVisible();
  await page.getByRole("button", { name: "Очистить поиск" }).click();
  await expect(page.getByRole("switch", { name: "Торговые пути" })).toBeDisabled();
  await expect(page.getByTestId("atlas-trade-layer")).toHaveCount(0);
  await page.getByRole("button", { name: "Сакская эпоха", exact: true }).click();
  await expect(page.getByRole("slider")).toHaveValue("-550");
  await expect(page.getByRole("complementary", { name: "Карточка объекта" })).toHaveCount(0);
  await expect(page.locator(".atlas-marker")).toHaveCount(0);
  await page.getByRole("button", { name: "Казахское ханство", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Карточка объекта" })).toHaveCount(0);
  await expect(page.locator(".atlas-marker")).toHaveCount(6);
  await page.getByRole("button", { name: "О проекте" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const accessibility = await new AxeBuilder({ page }).include(".atlas-root").analyze();
  expect(accessibility.violations).toEqual([]);
  expect(errors).toEqual([]);
});

for (const [name, width, height] of [
  ["mobile", 390, 844],
  ["tablet", 834, 1112],
]) {
  test(`atlas ${name} layout and drawer`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto("/atlas");
    await page.screenshot({ path: testInfo.outputPath(`atlas-${name}.png`) });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await page.getByRole("button", { name: "Фильтры", exact: true }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Казахское ханство", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await page.getByRole("searchbox").fill("Otrar");
    await page.getByRole("searchbox").press("Enter");
    await expect(page.getByRole("heading", { name: "Отырар" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`atlas-${name}-card.png`) });
    const accessibility = await new AxeBuilder({ page }).include(".atlas-root").analyze();
    expect(accessibility.violations).toEqual([]);
  });
}
