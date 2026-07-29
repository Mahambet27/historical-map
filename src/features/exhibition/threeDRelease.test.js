import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  exhibitionModels,
  primaryExhibitionModel,
} from "../../data/exhibition/threeDModels.js";
import {
  ADDITIONAL_MODEL_MAX_BYTES,
  checkBudgetEntries,
} from "../../../scripts/3d/check-model-budget.mjs";
import {
  LOCAL_MESHOPT_DECODER_URL,
  loadModelViewer,
  resetModelViewerLoaderForTests,
} from "./threeD/loadModelViewer.js";
import { THREE_D_CACHE_NAME } from "./threeD/offlineModelCache.js";
import {
  initialThreeDState,
  shouldAutoLoadThreeD,
  threeDReducer,
} from "./threeD/threeDState.js";

const publicPath = (url) => path.resolve(process.cwd(), "public", url.replace(/^\//, ""));

afterEach(() => {
  resetModelViewerLoaderForTests();
  vi.restoreAllMocks();
});

describe("P0.5 3D release hardening", () => {
  it("keeps model-viewer behind the lazy 3D panel", () => {
    const pageSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/features/exhibition/ExhibitionPage.jsx"),
      "utf8"
    );
    expect(pageSource).toContain('lazy(() => import("./ExhibitionThreeD.jsx"))');
    expect(pageSource).not.toContain("@google/model-viewer");
  });

  it("returns one import promise while the local viewer is loading", async () => {
    let resolveImport;
    const importer = vi.fn(
      () => new Promise((resolve) => {
        resolveImport = resolve;
      })
    );
    const first = loadModelViewer(importer);
    const second = loadModelViewer(importer);
    expect(first).toBe(second);
    expect(importer).toHaveBeenCalledTimes(1);
    resolveImport({ local: true });
    await expect(first).resolves.toEqual({ local: true });
  });

  it("has a valid production manifest", () => {
    expect(exhibitionModels.length).toBeGreaterThan(0);
    exhibitionModels.forEach((model) => {
      expect(model).toMatchObject({
        id: expect.any(String),
        src: expect.stringMatching(/^\/models\/exhibition\/.+\.glb$/),
        poster: expect.stringMatching(/^\/models\/exhibition\/posters\/.+\.webp$/),
        optimized: true,
        verificationStatus: expect.any(String),
      });
      expect(model.title.ru).toBeTruthy();
      expect(model.title.kk).toBeTruthy();
      expect(model.title.en).toBeTruthy();
    });
  });

  it("ships every production GLB locally with its declared size", () => {
    exhibitionModels.forEach((model) => {
      expect(fs.existsSync(publicPath(model.src))).toBe(true);
      expect(fs.statSync(publicPath(model.src)).size).toBe(model.fileSizeBytes);
    });
  });

  it("ships every production poster locally", () => {
    exhibitionModels.forEach((model) => {
      expect(fs.existsSync(publicPath(model.poster))).toBe(true);
    });
  });

  it("detects a production model over budget", () => {
    expect(
      checkBudgetEntries([
        {
          file: "too-large.glb",
          bytes: ADDITIONAL_MODEL_MAX_BYTES + 1,
          maxBytes: ADDITIONAL_MODEL_MAX_BYTES,
        },
      ])
    ).toEqual([
      {
        file: "too-large.glb",
        bytes: ADDITIONAL_MODEL_MAX_BYTES + 1,
        maxBytes: ADDITIONAL_MODEL_MAX_BYTES,
      },
    ]);
  });

  it("does not auto-load GLB in light or save-data mode", () => {
    expect(shouldAutoLoadThreeD({ effectiveQuality: "light" })).toBe(false);
    expect(shouldAutoLoadThreeD({ effectiveQuality: "high", saveData: true })).toBe(false);
    expect(shouldAutoLoadThreeD({ effectiveQuality: "high", saveData: false })).toBe(true);
  });

  it("retry clears an error", () => {
    const failed = threeDReducer(initialThreeDState, {
      type: "ERROR",
      error: "network",
    });
    expect(failed.status).toBe("error");
    expect(threeDReducer(failed, { type: "RETRY" })).toEqual(initialThreeDState);
  });

  it("timeout enters fallback", () => {
    expect(threeDReducer(initialThreeDState, { type: "TIMEOUT" })).toMatchObject({
      status: "timeout",
      error: expect.any(String),
    });
  });

  it("uses a versioned dedicated offline cache", () => {
    expect(THREE_D_CACHE_NAME).toMatch(/^qazaq-heritage-3d-v\d+$/);
    expect(primaryExhibitionModel.cacheVersion).toBe("v1");
  });

  it("ships a same-origin Meshopt decoder for the optimized GLB", () => {
    expect(LOCAL_MESHOPT_DECODER_URL).toMatch(/^\/vendor\//);
    expect(fs.existsSync(publicPath(LOCAL_MESHOPT_DECODER_URL))).toBe(true);
  });
});
