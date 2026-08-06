import { expect, test } from "@playwright/test";
import process from "node:process";

const enabled = process.env.P2A_LOCAL_SUPABASE_TESTS === "true";
const apiUrl = process.env.P2A_LOCAL_SUPABASE_URL;
const anonKey = process.env.P2A_LOCAL_SUPABASE_ANON_KEY;

test.describe("P2A.5 real local Supabase", () => {
  test.skip(!enabled, "P2A local Supabase tests are opt-in.");
  test.describe.configure({ mode: "serial" });

  const installMode = async (page, dataSource) => {
    await page.addInitScript(
      ({ source, url, key }) => {
        window.__QHM_P2A_TEST_CONFIG__ = {
          dataSource: source,
          url,
          anonKey: key,
          serviceRoleKey: "",
        };
        localStorage.clear();
      },
      { source: dataSource, url: apiUrl, key: anonKey }
    );
  };

  const openExhibition = async (page, query = "?quality=light") => {
    await page.goto(`/exhibition${query}`);
    const hero = page.locator(".ex-hero__actions");
    await expect(hero).toBeVisible();
    await hero.locator("button").last().click();
    await expect(page.locator(".exhibition")).toBeVisible();
  };

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };

  test("real health, snapshot, places, routes, evidence and story", async ({
    page,
    request,
  }) => {
    await installMode(page, "supabase");
    const requests = [];
    page.on("request", (browserRequest) => {
      if (browserRequest.url().startsWith(apiUrl)) {
        requests.push(browserRequest.url());
      }
    });
    await openExhibition(page);
    await expect(page.locator(".ex-data-status")).toContainText(/сервер/i);
    await expect
      .poll(() => requests.some((url) => url.includes("get_exhibition_snapshot")))
      .toBe(true);
    await expect
      .poll(() => requests.some((url) => url.includes("get_historical_routes")))
      .toBe(true);

    const places = await request.post(
      `${apiUrl}/rest/v1/rpc/get_historical_places`,
      {
        headers,
        data: {
          p_year: 1465,
          p_west: 40,
          p_south: 35,
          p_east: 100,
          p_north: 75,
          p_place_types: null,
          p_limit: 500,
        },
      }
    );
    expect(places.ok()).toBe(true);
    expect(Array.isArray(await places.json())).toBe(true);

    const evidence = await request.post(
      `${apiUrl}/rest/v1/rpc/get_subject_evidence`,
      {
        headers,
        data: {
          p_subject_type: "entity",
          p_subject_id: "kazakh-khanate",
        },
      }
    );
    expect(evidence.ok()).toBe(true);
    expect(Array.isArray((await evidence.json()).claims)).toBe(true);

    const story = await request.post(
      `${apiUrl}/rest/v1/rpc/get_educational_story`,
      {
        headers,
        data: { p_story_id: "historical-evidence" },
      }
    );
    expect(story.ok()).toBe(true);
    expect((await story.json()).story.id).toBe("historical-evidence");
  });

  test("real anonymous RLS reads and denies writes", async ({ request }) => {
    const metadata = await request.post(
      `${apiUrl}/rest/v1/rpc/get_p2a_dataset_status`,
      { headers, data: {} }
    );
    expect(metadata.ok()).toBe(true);
    expect((await metadata.json()).datasetVersion).toBe("p2a-2026-08");

    for (const method of ["post", "patch", "delete"]) {
      const response = await request[method](
        `${apiUrl}/rest/v1/historical_entities?id=eq.__p2a_e2e_write_test`,
        {
          headers,
          data:
            method === "delete"
              ? undefined
              : { id: "__p2a_e2e_write_test", default_name: "Forbidden" },
        }
      );
      expect(response.ok()).toBe(false);
    }
  });

  test("archive masking and dataset version are real", async ({ request }) => {
    const archives = await request.get(
      `${apiUrl}/rest/v1/p2a_public_archive_maps?select=id,image_url,georeference_data,license`,
      { headers }
    );
    expect(archives.ok()).toBe(true);
    const rows = await archives.json();
    for (const row of rows.filter(
      (item) => item.license?.status === "unknown"
    )) {
      expect(row.image_url).toBeNull();
      expect(row.georeference_data).toEqual({});
    }
    const baseTable = await request.get(
      `${apiUrl}/rest/v1/archive_maps?select=id`,
      { headers }
    );
    expect(baseTable.ok()).toBe(false);
  });

  test("auto fallback and retry retain Exhibition", async ({ page }) => {
    await installMode(page, "auto");
    await openExhibition(page);
    await expect(page.locator(".ex-data-status")).toContainText(/сервер/i);

    await page.route(`${apiUrl}/**`, (route) => route.abort("failed"));
    await page.reload();
    const hero = page.locator(".ex-hero__actions");
    await expect(hero).toBeVisible();
    await hero.locator("button").last().click();
    const status = page.locator(".ex-data-status");
    await expect(status).toContainText(/локальный резерв/i);
    await expect(page.locator(".exhibition")).toBeVisible();

    await page.unroute(`${apiUrl}/**`);
    await status.getByRole("button", { name: /Повторить подключение/i }).click();
    await expect(status).toContainText(/сервер/i);
  });

  test("explicit Supabase outage is visible and does not silently fallback", async ({
    page,
  }) => {
    await installMode(page, "supabase");
    await page.route(`${apiUrl}/**`, (route) => route.abort("failed"));
    await page.goto("/exhibition?quality=light");
    await expect(page.locator(".ex-hero")).toBeVisible();
    await page.locator(".ex-hero__actions button").last().click();
    await expect(page.locator(".ex-data-status")).not.toHaveAttribute(
      "data-source",
      "local-fallback"
    );
    await expect(page.locator("body")).toContainText(
      /сервер|подключ|недоступ|ошиб/i
    );
  });

  test("local mode and /legacy-map make no local database requests", async ({ page }) => {
    await installMode(page, "local");
    const databaseRequests = [];
    page.on("request", (browserRequest) => {
      if (browserRequest.url().startsWith(apiUrl)) {
        databaseRequests.push(browserRequest.url());
      }
    });
    await openExhibition(page, "?fallback=svg&quality=light");
    await expect(page.locator(".ex-data-status")).toContainText(/локальные/i);
    expect(databaseRequests).toEqual([]);

    await page.goto("/legacy-map");
    await expect(
      page.locator(".map-experience, .route-loading, [role=alert]").first()
    ).toBeVisible();
    await page.waitForTimeout(500);
    expect(databaseRequests).toEqual([]);
  });
});
