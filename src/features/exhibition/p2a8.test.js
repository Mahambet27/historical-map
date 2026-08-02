import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  getReleaseChannelPolicy,
  resolveReleaseRepositoryMode,
} from "../../config/releaseChannel.js";
import { EXHIBITION_RELEASE } from "../../config/exhibitionRelease.js";
import {
  isDemoPath,
  parseDemoParams,
  shouldForceOfficialDemo,
} from "./demo/demoRoute.js";
import {
  bootstrapOfficialDemo,
} from "./demo/demoBootstrap.js";
import { runDemoHealthCheck } from "./demo/demoHealthCheck.js";
import {
  detectDeviceProfile,
  getDeviceProfilePolicy,
} from "./demo/deviceProfile.js";
import { createKioskResetState } from "./demo/kioskReset.js";
import { getRecordingModePolicy } from "./demo/recordingMode.js";
import {
  clearProjectCaches,
  isProjectCacheName,
} from "./demo/cacheRecovery.js";
import { evaluatePerformanceGuard } from "./performanceGuard.js";
import {
  generateChecksums,
} from "../../../scripts/release/generate-checksums.mjs";
import {
  verifyChecksums,
} from "../../../scripts/release/verify-checksums.mjs";
import {
  releaseVersion,
  shouldExcludePackagePath,
} from "../../../scripts/release/package-config.mjs";

const tempDirs = [];
afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

const allAssetsFetch = async () => ({ ok: true });
const webGlDocument = {
  createElement: () => ({ getContext: () => ({}) }),
};
const onlineNavigator = {
  onLine: true,
  serviceWorker: {},
  deviceMemory: 8,
  hardwareConcurrency: 8,
  connection: {},
};

describe("P2A.8 official demo runtime", () => {
  it("/demo always enables official mode", () => {
    expect(isDemoPath("/demo")).toBe(true);
    expect(shouldForceOfficialDemo({ pathname: "/demo", channel: "development" })).toBe(true);
  });

  it("query cannot disable official mode", () => {
    expect(parseDemoParams("?officialDemo=false").officialDemo).toBe(true);
  });

  it("stable release hides debug and scientific review", () => {
    expect(getReleaseChannelPolicy("exhibition-stable")).toMatchObject({
      showDebugControls: false,
      showScientificReview: false,
      defaultOfficialDemo: true,
    });
  });

  it("offline release resolves the local repository", () => {
    expect(
      resolveReleaseRepositoryMode({
        offline: true,
        channel: "exhibition-stable",
        requested: "supabase",
      })
    ).toBe("local");
  });

  it("offline policy cannot select Supabase", () => {
    expect(
      getReleaseChannelPolicy("exhibition-rc", { offline: true }).repositoryMode
    ).not.toBe("supabase");
  });

  it("missing WebGL/Mapbox capability activates SVG fallback", async () => {
    const boot = await bootstrapOfficialDemo({
      fetchImpl: allAssetsFetch,
      navigatorRef: onlineNavigator,
      documentRef: { createElement: () => ({ getContext: () => null }) },
    });
    expect(boot.forceSvgFallback).toBe(true);
    expect(boot.status).toBe("degraded");
  });

  it("startup reports ready-offline", async () => {
    const boot = await bootstrapOfficialDemo({
      fetchImpl: allAssetsFetch,
      navigatorRef: { ...onlineNavigator, onLine: false },
      documentRef: webGlDocument,
    });
    expect(boot.status).toBe("ready-offline");
  });

  it("missing poster is a health failure", async () => {
    const health = await runDemoHealthCheck({
      fetchImpl: async (url) => ({ ok: !String(url).endsWith(".webp") }),
      serviceWorkerSupported: true,
    });
    expect(
      health.checks.find((check) => check.id === "3d-poster").status
    ).toBe("failed");
  });

  it("missing GLB is a warning rather than fatal", async () => {
    const health = await runDemoHealthCheck({
      fetchImpl: async (url) => ({ ok: !String(url).endsWith(".glb") }),
      serviceWorkerSupported: true,
    });
    expect(
      health.checks.find((check) => check.id === "production-glb").status
    ).toBe("warning");
  });

  it("missing local dataset makes bootstrap fatal", async () => {
    const boot = await bootstrapOfficialDemo({
      fetchImpl: allAssetsFetch,
      navigatorRef: onlineNavigator,
      documentRef: webGlDocument,
      hasLocalDataset: false,
    });
    expect(boot.status).toBe("fatal");
  });

  it("kiosk reset returns to 1465", () => {
    expect(createKioskResetState().selectedYear).toBe(1465);
  });

  it("kiosk reset closes panels", () => {
    expect(createKioskResetState().panel).toBeNull();
  });

  it("kiosk reset stops route journey", () => {
    expect(createKioskResetState().routeJourneyActive).toBe(false);
  });

  it("low device selects light policy", () => {
    const profile = detectDeviceProfile({
      deviceMemory: 2,
      hardwareConcurrency: 2,
      width: 800,
      reducedMotion: false,
    });
    expect(getDeviceProfilePolicy(profile).quality).toBe("light");
  });

  it("performance guard enables step mode below 20 FPS", () => {
    expect(evaluatePerformanceGuard(15).mode).toBe("step");
  });

  it("operator menu contains no Scientific Review entry", () => {
    const source = fs.readFileSync(
      path.resolve("src/features/exhibition/demo/ExhibitionOperatorMenu.jsx"),
      "utf8"
    );
    expect(source).not.toMatch(/Scientific Review|ScientificReviewPanel/);
  });

  it("cache recovery deletes only project caches", async () => {
    const deleted = [];
    const cacheStorage = {
      keys: async () => ["qhm-json-v1", "qazaq-heritage-map-precache", "other-site"],
      delete: async (name) => deleted.push(name),
    };
    await clearProjectCaches(cacheStorage);
    expect(deleted).toEqual(["qhm-json-v1", "qazaq-heritage-map-precache"]);
    expect(isProjectCacheName("other-site")).toBe(false);
  });

  it("checksums are deterministic", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "qhm-checksum-"));
    tempDirs.push(root);
    fs.writeFileSync(path.join(root, "a.txt"), "stable");
    const first = await generateChecksums(root);
    const second = await generateChecksums(root);
    expect(second.content).toBe(first.content);
  });

  it("integrity detects a changed file", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "qhm-integrity-"));
    tempDirs.push(root);
    fs.writeFileSync(path.join(root, "a.txt"), "first");
    fs.writeFileSync(
      path.join(root, "release-manifest.json"),
      JSON.stringify({ releaseVersion })
    );
    await generateChecksums(root);
    fs.writeFileSync(path.join(root, "a.txt"), "changed");
    expect((await verifyChecksums(root)).errors).toContain("changed: a.txt");
  });

  it("offline package excludes .env", () => {
    expect(shouldExcludePackagePath(".env.production")).toBe(true);
  });

  it("offline package excludes service-role material", () => {
    expect(shouldExcludePackagePath("reports/service-role.txt")).toBe(true);
  });

  it("offline package excludes source GLB directory", () => {
    expect(
      shouldExcludePackagePath("dist/models/source/original.glb")
    ).toBe(true);
  });

  it("release manifest version matches package version", () => {
    expect(EXHIBITION_RELEASE.version).toBe(releaseVersion);
  });

  it("recording mode disables inactivity reset and cursor hiding", () => {
    expect(getRecordingModePolicy(true)).toMatchObject({
      inactivityReset: false,
      cursorHiding: false,
      officialDemo: true,
    });
  });

  it("/map implementation does not import demo operation modules", () => {
    const source = fs.readFileSync(
      path.resolve("src/features/map/MapExperience.jsx"),
      "utf8"
    );
    expect(source).not.toMatch(/demoBootstrap|ExhibitionOperatorMenu|cacheRecovery/);
  });
});

