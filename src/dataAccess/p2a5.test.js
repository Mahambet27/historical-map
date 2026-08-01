import { afterEach, describe, expect, it } from "vitest";
import process from "node:process";

import {
  assertLocalDatabase,
  LocalDatabaseSafetyError,
} from "../../scripts/database/local-database-utils.mjs";

const variableNames = [
  "P2A_LOCAL_DATABASE_URL",
  "P2A_LOCAL_SUPABASE_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
  "SUPABASE_DB_URL",
  "SUPABASE_URL",
  "VITE_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "P2A_SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE_KEY",
  "P2A_PRODUCTION",
  "SUPABASE_ENV",
  "VERCEL_ENV",
];

const originalEnvironment = Object.fromEntries(
  variableNames.map((name) => [name, process.env[name]])
);

afterEach(() => {
  for (const name of variableNames) {
    if (originalEnvironment[name] == null) delete process.env[name];
    else process.env[name] = originalEnvironment[name];
  }
});

describe("P2A.5 local database safety", () => {
  it("allows a preflight without a configured target", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    await expect(assertLocalDatabase()).resolves.toMatchObject({ safe: true });
  });

  it("allows explicit loopback database and API targets", async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    process.env.P2A_LOCAL_DATABASE_URL =
      "postgresql://postgres:local@127.0.0.1:54322/postgres";
    process.env.P2A_LOCAL_SUPABASE_URL = "http://localhost:54321";
    await expect(
      assertLocalDatabase({ requireDatabaseUrl: true, requireApiUrl: true })
    ).resolves.toMatchObject({
      safe: true,
      databaseConfigured: true,
      apiConfigured: true,
    });
  });

  it("rejects a remote database target", async () => {
    process.env.DATABASE_URL =
      "postgresql://readonly@example.supabase.co:5432/postgres";
    await expect(assertLocalDatabase()).rejects.toBeInstanceOf(
      LocalDatabaseSafetyError
    );
  });

  it("rejects a remote API target", async () => {
    process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    await expect(assertLocalDatabase()).rejects.toBeInstanceOf(
      LocalDatabaseSafetyError
    );
  });

  it("rejects service-role variables without logging their values", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "forbidden-test-value";
    await expect(assertLocalDatabase()).rejects.toBeInstanceOf(
      LocalDatabaseSafetyError
    );
  });

  it("rejects a production environment flag", async () => {
    process.env.P2A_PRODUCTION = "true";
    await expect(assertLocalDatabase()).rejects.toBeInstanceOf(
      LocalDatabaseSafetyError
    );
  });
});
