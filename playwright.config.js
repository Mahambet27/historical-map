import { defineConfig, devices } from "@playwright/test";
import process from "node:process";

const localDatabaseTests = process.env.P2A_LOCAL_SUPABASE_TESTS === "true";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    env: {
      ...process.env,
      VITE_HISTORICAL_DATA_SOURCE: localDatabaseTests ? "supabase" : "local",
      ...(localDatabaseTests
        ? {
            VITE_SUPABASE_URL: process.env.P2A_LOCAL_SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY:
              process.env.P2A_LOCAL_SUPABASE_ANON_KEY,
          }
        : {}),
    },
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI && !localDatabaseTests,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
