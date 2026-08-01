import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { buildSeedData } from "../../scripts/database/seed-model.mjs";
import { stableStringify } from "../../scripts/database/seed-io.mjs";
import {
  validateGeometryRecord,
  validateGeometryTables,
} from "../../scripts/database/geometry-validation.mjs";
import {
  createHistoricalRepository,
  getHistoricalRepositoryDiagnostics,
  resetHistoricalRepositoryForTests,
} from "./createHistoricalRepository.js";
import {
  HistoricalDataCache,
  buildHistoricalCacheKey,
} from "./cache/historicalDataCache.js";
import LocalHistoricalRepository from "./local/LocalHistoricalRepository.js";
import {
  mapSupabaseEvidence,
  mapSupabaseGeometry,
  mapSupabaseSnapshot,
} from "./supabase/supabaseMappers.js";
import { validateSupabaseConfiguration } from "./supabase/configValidator.js";

const config = (dataSource) => ({
  dataSource,
  url: "https://test.supabase.co",
  anonKey: "eyJx.e30.signature",
  serviceRoleKey: "",
});

const fluentResult = (resultFactory) => {
  const query = {};
  ["select", "eq", "limit", "order"].forEach((method) => {
    query[method] = vi.fn(() => query);
  });
  query.abortSignal = vi.fn((signal) => resultFactory(signal));
  return query;
};

const healthyClient = ({
  version = "p2a-2026-08",
  snapshot,
  evidence,
} = {}) => ({
  from: vi.fn(() =>
    fluentResult(() =>
      Promise.resolve({ data: [{ dataset_version: version }], error: null })
    )
  ),
  rpc: vi.fn((name) =>
    fluentResult(() =>
      Promise.resolve({
        data:
          name === "get_p2a_dataset_status"
            ? { datasetVersion: version, schemaVersion: 1, public: true }
            : name === "get_exhibition_snapshot"
            ? snapshot
            : name === "get_subject_evidence"
              ? evidence
              : { routes: [], segments: [], places: [] },
        error: null,
      })
    )
  ),
});

describe("P2A data foundation", () => {
  beforeEach(() => {
    resetHistoricalRepositoryForTests();
  });

  it("local repository returns a bounded snapshot", async () => {
    const snapshot = await new LocalHistoricalRepository().getSnapshot({
      year: 1465,
      bbox: [40, 35, 100, 75],
      language: "ru",
    });
    expect(snapshot.datasetVersion).toBe("p2a-2026-08");
    expect(snapshot.geometries.length).toBeGreaterThan(0);
    expect(snapshot.entities.length).toBeGreaterThan(0);
  });

  it("Supabase mapper creates the local geometry domain shape", () => {
    const geometry = mapSupabaseGeometry({
      id: "g",
      subject_id: "e",
      subject_type: "entity",
      reconstruction_method: "reconstruction",
      geojson: { type: "Polygon", coordinates: [] },
      verification_status: "needs_review",
      confidence_level: "low",
      source_ids: ["s"],
    });
    expect(geometry).toMatchObject({
      id: "g",
      entityId: "e",
      verificationStatus: "needs_review",
      sourceIds: ["s"],
    });
  });

  it("local mode never creates a Supabase client", async () => {
    const clientFactory = vi.fn();
    const repository = await createHistoricalRepository({
      dataSource: "local",
      clientFactory,
      config: { dataSource: "local" },
    });
    expect(repository.type).toBe("local");
    expect(clientFactory).not.toHaveBeenCalled();
  });

  it("explicit Supabase mode does not silently fallback", async () => {
    await expect(
      createHistoricalRepository({
        dataSource: "supabase",
        clientFactory: () => {
          throw new Error("offline");
        },
        config: config("supabase"),
      })
    ).rejects.toBeTruthy();
    expect(getHistoricalRepositoryDiagnostics().activeRepository).not.toBe(
      "local-fallback"
    );
  });

  it("auto mode falls back after a timeout", async () => {
    const client = {
      from: () =>
        fluentResult(
          (signal) =>
            new Promise((resolve, reject) => {
              signal.addEventListener(
                "abort",
                () => reject(new DOMException("Aborted", "AbortError")),
                { once: true }
              );
            })
        ),
    };
    const repository = await createHistoricalRepository({
      dataSource: "auto",
      timeoutMs: 5,
      clientFactory: async () => client,
      config: config("auto"),
    });
    expect(repository.type).toBe("local");
    expect(getHistoricalRepositoryDiagnostics().activeRepository).toBe(
      "local-fallback"
    );
  });

  it("auto mode does not fallback for an aborted user request", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      createHistoricalRepository({
        dataSource: "auto",
        signal: controller.signal,
        clientFactory: async () => healthyClient(),
        config: config("auto"),
      })
    ).rejects.toMatchObject({ code: "ABORTED" });
    expect(getHistoricalRepositoryDiagnostics().activeRepository).not.toBe(
      "local-fallback"
    );
  });

  it("repository methods honor AbortSignal", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      new LocalHistoricalRepository().getSnapshot({ signal: controller.signal })
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("cache returns a hit for the same snapshot key", () => {
    const cache = new HistoricalDataCache();
    const key = buildHistoricalCacheKey({
      dataSource: "local",
      year: 1465,
      bbox: [40, 35, 100, 75],
      language: "ru",
      datasetVersion: "v1",
    });
    cache.set(key, { id: 1 });
    expect(cache.get(key)).toEqual({ id: 1 });
    expect(cache.diagnostics().hitCount).toBe(1);
  });

  it("cache has a bounded LRU size", () => {
    const cache = new HistoricalDataCache({ maxEntries: 2 });
    cache.set("a", { id: "a" });
    cache.set("b", { id: "b" });
    cache.set("c", { id: "c" });
    expect(cache.diagnostics().size).toBe(2);
    expect(cache.get("a")).toBeNull();
  });

  it("cache clears on dataset version change", () => {
    const cache = new HistoricalDataCache();
    cache.configure({ dataSource: "local", datasetVersion: "v1" });
    cache.set("a", { id: "a" });
    cache.configure({ dataSource: "local", datasetVersion: "v2" });
    expect(cache.diagnostics().size).toBe(0);
  });

  it("restricted archive URL never enters cache", () => {
    const cache = new HistoricalDataCache();
    cache.set("archive", {
      license: { status: "restricted" },
      imageUrl: "https://private.invalid/full.tif",
    });
    expect(cache.get("archive").imageUrl).toBeNull();
  });

  it("cache removes review notes and token-like fields", () => {
    const cache = new HistoricalDataCache();
    cache.set("safe", {
      reviewNote: "private",
      access_token: "secret",
      value: "public",
    });
    expect(cache.get("safe")).toEqual({ value: "public" });
  });

  it("dataset version mismatch is exposed safely", async () => {
    await createHistoricalRepository({
      dataSource: "supabase",
      clientFactory: async () => healthyClient({ version: "server-v2" }),
      config: config("supabase"),
    });
    expect(getHistoricalRepositoryDiagnostics().versionMatch).toBe(false);
  });

  it("invalid auto health response activates local fallback", async () => {
    const client = {
      from: () =>
        fluentResult(() => Promise.resolve({ data: [], error: null })),
    };
    const repository = await createHistoricalRepository({
      dataSource: "auto",
      clientFactory: async () => client,
      config: config("auto"),
    });
    expect(repository.type).toBe("local");
  });

  it("evidence mapper preserves normalized source relationships", () => {
    const evidence = mapSupabaseEvidence({
      subjectType: "entity",
      subjectId: "kazakh-khanate",
      claims: [
        {
          id: "claim",
          subject_type: "entity",
          subject_id: "kazakh-khanate",
          claim_value: { year: 1465 },
          sources: [{ id: "source", titles: { en: "Source" } }],
        },
      ],
      archiveMaps: [],
    });
    expect(evidence.claims[0].sourceIds).toEqual(["source"]);
    expect(evidence.sources[0].id).toBe("source");
  });

  it("geometry mapper preserves needs_review", () => {
    expect(
      mapSupabaseGeometry({
        id: "g",
        subject_id: "e",
        geojson: { type: "Point", coordinates: [70, 45] },
        verification_status: "needs_review",
      }).verificationStatus
    ).toBe("needs_review");
  });

  it("snapshot mapper rejects an invalid server response", () => {
    expect(() => mapSupabaseSnapshot({ entities: null })).toThrow();
  });

  it("seed generation is deterministic", () => {
    expect(stableStringify(buildSeedData())).toBe(
      stableStringify(buildSeedData())
    );
  });

  it("seed tables contain no duplicate upsert keys", () => {
    const data = buildSeedData();
    Object.entries(data.tables).forEach(([table, records]) => {
      const keys = records.map((record) =>
        table === "source_claim_sources"
          ? `${record.claim_id}:${record.source_id}`
          : record.id
      );
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  it("geometry validator detects a reverse year range", () => {
    const issues = validateGeometryRecord({
      id: "reverse",
      geometry: { type: "Point", coordinates: [70, 45] },
      valid_from_year: 2000,
      valid_to_year: 1900,
      verification_status: "needs_review",
    });
    expect(issues.some((item) => item.code === "reversed_year_range")).toBe(true);
  });

  it("geometry validator detects invalid coordinates", () => {
    const issues = validateGeometryRecord({
      id: "invalid-coordinate",
      geometry: { type: "Point", coordinates: [200, 95] },
      verification_status: "needs_review",
    });
    expect(issues.some((item) => item.code === "invalid_coordinate")).toBe(true);
  });

  it("current seed geometries have no fatal errors", () => {
    expect(validateGeometryTables(buildSeedData()).errors).toBe(0);
  });

  it("config validator rejects service-role browser variables", () => {
    expect(
      validateSupabaseConfiguration({
        ...config("supabase"),
        serviceRoleKey: "secret",
      })
    ).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["SERVICE_ROLE_FORBIDDEN"]),
    });
  });

  it("diagnostics never exposes URL or anon key", () => {
    const serialized = JSON.stringify(getHistoricalRepositoryDiagnostics());
    expect(serialized).not.toContain("supabase.co");
    expect(serialized).not.toContain("eyJ");
  });

  it("/map route does not import the P2A repository", () => {
    const app = readFileSync(path.join(process.cwd(), "src/app/App.jsx"), "utf8");
    const map = readFileSync(
      path.join(process.cwd(), "src/features/map/MapExperience.jsx"),
      "utf8"
    );
    expect(`${app}\n${map}`).not.toContain("dataAccess");
    expect(`${app}\n${map}`).not.toContain("createHistoricalRepository");
  });

  it("offline local repository keeps routes, evidence and stories available", async () => {
    const repository = new LocalHistoricalRepository();
    const [routes, evidence, story] = await Promise.all([
      repository.getRoutes({ year: 1465 }),
      repository.getEvidence("entity", "kazakh-khanate"),
      repository.getStory("historical-evidence"),
    ]);
    expect(routes.routes.length).toBeGreaterThan(0);
    expect(evidence.claims.length).toBeGreaterThan(0);
    expect(story.steps.length).toBeGreaterThan(0);
  });
});
