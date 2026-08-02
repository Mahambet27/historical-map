import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { EXHIBITION_RELEASE } from "../../config/exhibitionRelease.js";
import { getReleaseChannelPolicy } from "../../config/releaseChannel.js";
import { parseDemoParams } from "./demo/demoRoute.js";
import {
  offlinePackageDir,
  previousReleaseVersion,
  releaseVersion,
  shouldExcludePackagePath,
} from "../../../scripts/release/package-config.mjs";
import {
  getGitCommit,
  isSafeCommitIdentifier,
} from "../../../scripts/release/release-metadata.mjs";
import { validateDeploymentUrl } from "../../../scripts/release/verify-preview-deployment.mjs";
import { validateQrUrl } from "../../../scripts/release/generate-demo-qr.mjs";

describe("P2A.9 stable release freeze", () => {
  it("uses the required stable release version", () => {
    expect(releaseVersion).toBe("2026.08-stable1");
    expect(EXHIBITION_RELEASE.version).toBe(releaseVersion);
  });

  it("keeps stable and release-candidate package paths separate", () => {
    expect(offlinePackageDir).toContain(releaseVersion);
    expect(offlinePackageDir).not.toContain(previousReleaseVersion);
    expect(previousReleaseVersion).toBe("2026.08-rc1");
  });

  it("resolves a safe real commit identifier", () => {
    expect(isSafeCommitIdentifier(getGitCommit())).toBe(true);
  });

  it("manifest generator contains build-time commit integration", () => {
    const source = fs.readFileSync(
      path.resolve("scripts/release/generate-exhibition-release.mjs"),
      "utf8"
    );
    expect(source).toContain("getGitCommit()");
    expect(source).not.toContain('"UNCOMMITTED"');
    expect(source).not.toMatch(/C:\\Users/);
  });

  it("preview verifier blocks credential URLs", () => {
    expect(() =>
      validateDeploymentUrl("https://user:secret@example.com")
    ).toThrow(/credentials/i);
  });

  it("preview verifier includes /demo", () => {
    const source = fs.readFileSync(
      path.resolve("scripts/release/verify-preview-deployment.mjs"),
      "utf8"
    );
    expect(source).toContain('"/demo"');
  });

  it("projector mode preserves official mode", () => {
    expect(parseDemoParams("?projector=true&officialDemo=false")).toMatchObject({
      projector: true,
      officialDemo: true,
    });
    expect(getReleaseChannelPolicy("exhibition-stable").defaultOfficialDemo).toBe(true);
  });

  it("projector mode has a 1366x768 guard", () => {
    const css = fs.readFileSync(path.resolve("src/styles/global.css"), "utf8");
    expect(css).toMatch(/max-width:\s*1366px/);
    expect(css).toMatch(/max-height:\s*768px/);
  });

  it("QR is forbidden for localhost", () => {
    expect(() => validateQrUrl("https://localhost/demo")).toThrow(/localhost/i);
  });

  it("stable preflight explicitly records blocked DB status", () => {
    const source = fs.readFileSync(
      path.resolve("scripts/release/stable-release-preflight.mjs"),
      "utf8"
    );
    expect(source).toContain("blocked_without_docker_or_podman");
  });

  it("freeze policy exists", () => {
    expect(fs.existsSync("docs/P2A9_RELEASE_FREEZE_POLICY.md")).toBe(true);
  });

  it("stable package rules exclude secrets", () => {
    expect(shouldExcludePackagePath(".env")).toBe(true);
    expect(shouldExcludePackagePath("operator/service_role.txt")).toBe(true);
  });
});
