import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  canUseInOfficialDemo,
  getScientificReadiness,
  summarizeScientificReadiness,
} from "./scientificReadiness.js";
import {
  canCalculateAreaPrecisely,
  canCalculateDistancePrecisely,
  getSpatialPrecisionWarning,
} from "./spatialPrecision.js";
import { getUncertaintyStyle } from "./uncertaintyStyleRegistry.js";
import { evaluateScientificCalculation } from "./scientificCalculationPolicy.js";
import {
  filterOfficialDemoRecords,
  filterOfficialStorySteps,
  isTransitionAllowedInOfficialDemo,
} from "./officialDemoMode.js";
import { evaluatePerformanceGuard } from "./performanceGuard.js";
import { officialDemoScenario } from "../../data/exhibition/officialDemoScenario.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { historicalPeople } from "../../data/exhibition/people.js";
import { historicalStories } from "../../data/exhibition/stories.js";
import { getGeographySnapshotAtYear } from "./temporalGeographyModel.js";
import {
  findSnapshotIntervalIssues,
  isEntityGeometryWithinPeriod,
  isHistoricalNameWithinPlacePeriod,
  isRouteSegmentWithinPeriod,
} from "../../../scripts/science/validate-temporal-consistency.mjs";
import {
  containsSecretLikeContent,
  hasUtf8Bom,
} from "../../../scripts/science/build-gis-review-package.mjs";
import {
  hasForbiddenModernStyle,
  hasRequiredTranslations,
  hasRestrictedArchivePrecache,
} from "../../../scripts/release/exhibition-preflight.mjs";
import { isSafeReleaseManifest } from "../../../scripts/release/generate-exhibition-release.mjs";
import { createHistoricalBasemapStyle } from "./historicalBasemapPolicy.js";

describe("P2A.7 scientific readiness and precision", () => {
  it("marks a reviewed sourced record exhibition_ready", () => {
    expect(
      getScientificReadiness({
        id: "reviewed",
        verificationStatus: "reviewed",
        sourceIds: ["source"],
        validFromYear: 1,
        validToYear: 2,
      })
    ).toBe("exhibition_ready");
  });

  it("does not upgrade an unqualified needs_review record", () => {
    expect(
      getScientificReadiness({
        verificationStatus: "needs_review",
        sourceIds: ["source"],
      })
    ).toBe("scientific_review_required");
  });

  it("blocks demo_only in official demo", () => {
    expect(canUseInOfficialDemo({ verificationStatus: "demo_only" })).toBe(false);
  });

  it("blocks disputed in official demo", () => {
    expect(canUseInOfficialDemo({ verificationStatus: "disputed" })).toBe(false);
  });

  it("warns about approximate coordinates", () => {
    expect(
      getSpatialPrecisionWarning({ coordinatePrecision: "approximate" }, "en")
    ).toContain("approximate");
  });

  it("blocks precise area for coarse geometry", () => {
    expect(
      canCalculateAreaPrecisely({ spatialPrecision: "coarse_reconstruction" })
    ).toBe(false);
  });

  it("blocks precise distance for schematic route", () => {
    expect(
      canCalculateDistancePrecisely({ spatialPrecision: "schematic" })
    ).toBe(false);
  });

  it("labels Turf difference as a visual estimate", () => {
    expect(evaluateScientificCalculation({ type: "turf_difference" })).toMatchObject({
      allowed: true,
      mode: "visual_estimate",
    });
  });

  it("summarizes readiness statuses for diagnostics", () => {
    expect(
      summarizeScientificReadiness([
        { verificationStatus: "demo_only" },
        { verificationStatus: "disputed" },
      ])
    ).toMatchObject({ demo_only: 1, disputed: 1 });
  });
});

describe("P2A.7 temporal, official demo, and performance policies", () => {
  it("never selects modern Aral for an ancient year", () => {
    expect(getGeographySnapshotAtYear("aral-sea", 1000)?.id).not.toBe(
      "aral-sea-modern-demo"
    );
  });

  it("detects overlapping snapshots", () => {
    expect(
      findSnapshotIntervalIssues([
        { id: "a", featureId: "x", validFromYear: 1, validToYear: 10 },
        { id: "b", featureId: "x", validFromYear: 10, validToYear: 20 },
      ])
    ).toContainEqual(expect.objectContaining({ code: "snapshot_overlap" }));
  });

  it("detects entity geometry outside entity period", () => {
    expect(
      isEntityGeometryWithinPeriod(
        { validFromYear: 90, validToYear: 120 },
        { startYear: 100, endYear: 130 }
      )
    ).toBe(false);
  });

  it("detects route segment outside route period", () => {
    expect(
      isRouteSegmentWithinPeriod(
        { validFromYear: 500, validToYear: 1600 },
        { validFromYear: 700, validToYear: 1500 }
      )
    ).toBe(false);
  });

  it("checks historical name periods", () => {
    expect(
      isHistoricalNameWithinPlacePeriod(
        { validFromYear: 600, validToYear: 900 },
        { validFromYear: 700, validToYear: 1000 }
      )
    ).toBe(false);
  });

  it("filters demo and disputed records from official mode", () => {
    expect(
      filterOfficialDemoRecords([
        { id: "a", verificationStatus: "demo_only" },
        { id: "b", verificationStatus: "disputed" },
      ])
    ).toHaveLength(0);
  });

  it("allows the curated 1465 to 1511 transition", () => {
    expect(isTransitionAllowedInOfficialDemo(1465, 1511)).toBe(true);
    expect(isTransitionAllowedInOfficialDemo(1511, 1521)).toBe(false);
  });

  it("filters unsupported official story steps", () => {
    const story = historicalStories.find(
      (record) => record.id === "formation-and-consolidation-kazakh-khanate"
    );
    expect(filterOfficialStorySteps(story).every((step) => step.year !== 1521)).toBe(true);
  });

  it("uses only existing IDs in the official scenario", () => {
    const entities = new Set(allHistoricalEntities.map((record) => record.id));
    const people = new Set(historicalPeople.map((record) => record.id));
    expect(
      officialDemoScenario.steps
        .flatMap((step) => step.entityIds || [])
        .every((id) => entities.has(id))
    ).toBe(true);
    expect(
      officialDemoScenario.steps
        .flatMap((step) => step.personIds || [])
        .every((id) => people.has(id))
    ).toBe(true);
  });

  it("switches low FPS to step mode", () => {
    expect(evaluatePerformanceGuard(18).mode).toBe("step");
  });

  it("stops continuous journey below 12 FPS", () => {
    expect(evaluatePerformanceGuard(10).mode).toBe("stopped");
  });
});

describe("P2A.7 uncertainty, package, and release safety", () => {
  it("has high contrast uncertainty patterns", () => {
    expect(
      getUncertaintyStyle(
        { verificationStatus: "disputed" },
        { theme: "high-contrast" }
      )
    ).toMatchObject({ width: 3, monochromePattern: "crosshatch" });
  });

  it("provides SVG uncertainty styling", () => {
    expect(
      getUncertaintyStyle({ verificationStatus: "demo_only" }).svg
    ).toMatchObject({ fillPattern: "dots" });
  });

  it("detects secret-like package content", () => {
    expect(containsSecretLikeContent("SUPABASE_SERVICE_ROLE_KEY=secretvalue")).toBe(true);
    expect(containsSecretLikeContent("No credentials are included.")).toBe(false);
  });

  it("recognizes the UTF-8 BOM required by Excel", () => {
    expect(hasUtf8Bom("\uFEFFa,b")).toBe(true);
  });

  it("rejects local paths in a release manifest", () => {
    expect(isSafeReleaseManifest({ path: "C:\\Users\\reviewer\\file" })).toBe(false);
  });

  it("detects a forbidden modern style", () => {
    const style = createHistoricalBasemapStyle();
    style.layers.push({ id: "road-primary", type: "line" });
    expect(hasForbiddenModernStyle(style)).toBe(true);
  });

  it("detects restricted archive precache", () => {
    expect(
      hasRestrictedArchivePrecache("asset:/restricted.png", [
        {
          imageUrl: "/restricted.png",
          license: { status: "restricted" },
        },
      ])
    ).toBe(true);
  });

  it("detects missing translations", () => {
    expect(hasRequiredTranslations({ ru: "a", kk: "b" })).toBe(false);
  });

  it("keeps the ordinary map free of scientific review modules", () => {
    const ordinaryMap = fs.readFileSync(
      "src/features/map/MapExperience.jsx",
      "utf8"
    );
    expect(ordinaryMap).not.toMatch(/ScientificReview|scientificReadiness/);
  });
});

