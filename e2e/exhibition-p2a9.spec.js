import { expect, test } from "@playwright/test";

const start = async (page, query) => {
  await page.goto(
    `/demo${query}${query.includes("?") ? "&" : "?"}legacyUi=true`
  );
  await expect(page.locator(".exhibition")).toBeVisible();
};

test("projector mode remains official", async ({ page }) => {
  await start(page, "?projector=true");
  await expect(page.locator(".exhibition")).toHaveAttribute("data-projector", "true");
  await expect(page.locator(".exhibition")).toHaveAttribute("data-official-demo", "true");
});

test("projector mode fits 1366x768", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await start(page, "?projector=true");
  const overflow = await page.evaluate(() => ({
    x: document.documentElement.scrollWidth - innerWidth,
    y: document.documentElement.scrollHeight - innerHeight,
  }));
  expect(overflow.x).toBeLessThanOrEqual(1);
  expect(overflow.y).toBeLessThanOrEqual(1);
});

for (const query of [
  "?projector=true&kiosk=true&fallback=svg",
  "?projector=true&quality=light&fallback=svg",
]) {
  test(`projector combination ${query}`, async ({ page }) => {
    if (query.includes("kiosk=true")) {
      await page.goto(`/demo${query}`);
      await expect(page.locator(".exhibition")).toBeVisible({ timeout: 8000 });
    } else {
      await start(page, query);
    }
    await expect(page.locator(".exhibition")).toHaveAttribute("data-official-demo", "true");
  });
}

test("stable routes remain separated", async ({ page, request }) => {
  await page.goto("/map");
  await expect(page.locator(".ex-demo-startup")).toHaveCount(0);
  const manifest = await (await request.get("/exhibition-release.json")).json();
  expect(manifest).toMatchObject({
    releaseVersion: "2026.08-stable1",
    releaseChannel: "exhibition-stable",
  });
});

test("stable official UI hides debug controls", async ({ page }) => {
  await start(page, "?projector=true&scientificReview=true&lang=kk");
  await expect(page.locator(".ex-data-status")).toHaveCount(0);
  await expect(page.locator(".ex-scientific-review-button")).toHaveCount(0);
});
