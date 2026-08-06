import { describe, expect, it } from "vitest";
import {
  LICENSE_STATUS,
  assertImportableLicense,
  getOpenDataLicenseStatus,
  validateSourceLicense,
} from "./licensing/openDataLicensePolicy.js";
import {
  mergeProvenance,
  validateOpenDataProvenance,
} from "./provenance/openDataProvenance.js";
import {
  getHistoricalNames,
  getPlaceNameAtYear,
  mergeOpenPlaceRecords,
} from "./reconciliation/openPlaceReconciliation.js";
import { getGeographySnapshotAtYear } from "../features/exhibition/temporalGeographyModel.js";

describe("open-data licensing", () => {
  it("blocks an unknown license", () => {
    expect(getOpenDataLicenseStatus("unknown")).toBe(LICENSE_STATUS.UNKNOWN);
    expect(() =>
      assertImportableLicense({ id: "unsafe", license: "unknown" })
    ).toThrow(/blocked/i);
  });

  it("requires attribution policy for CC BY", () => {
    expect(
      validateSourceLicense({
        license: "CC BY 4.0",
        attributionRequired: false,
        commercialUseAllowed: true,
      }).valid
    ).toBe(false);
  });

  it("isolates ODbL/share-alike data", () => {
    expect(getOpenDataLicenseStatus("ODbL 1.0")).toBe(
      LICENSE_STATUS.ISOLATED_SHARE_ALIKE
    );
  });

  it("keeps noncommercial data out of production", () => {
    expect(
      validateSourceLicense({
        license: "CC BY-NC 4.0",
        commercialUseAllowed: false,
      }).productionEligible
    ).toBe(false);
  });
});

describe("provenance and reconciliation", () => {
  const provenance = {
    sourceIds: ["official"],
    sourceRecordIds: ["42"],
    sourceUrls: ["https://example.test/42"],
    sourceVersion: "1",
    accessedAt: "2026-08-06",
    importedAt: "2026-08-06",
    importerVersion: "1",
    licenseStatus: "allowed",
    attribution: "Example",
    rawRecordHash: "abc",
    transformationNotes: ["normalized"],
    verificationStatus: "needs_review",
  };

  it("requires complete record provenance", () => {
    expect(validateOpenDataProvenance(provenance).valid).toBe(true);
    expect(validateOpenDataProvenance({ sourceIds: ["x"] }).valid).toBe(false);
  });

  it("preserves all source IDs while reconciling", () => {
    expect(
      mergeProvenance(
        provenance,
        { ...provenance, sourceIds: ["community"], sourceRecordIds: ["99"] }
      )
    ).toMatchObject({
      sourceIds: ["official", "community"],
      sourceRecordIds: ["42", "99"],
      verificationStatus: "needs_review",
    });
  });

  it("does not replace an official record with a community record", () => {
    const merged = mergeOpenPlaceRecords([
      {
        id: "official",
        wikidataId: "Q1",
        sourceId: "official",
        sourceRecordId: "1",
        sourceIds: ["official"],
        sourceRecordIds: ["1"],
        names: [{ value: "Түркістан", nameType: "historical", language: "kk" }],
      },
      {
        id: "community",
        wikidataId: "Q1",
        sourceId: "community",
        sourceRecordId: "2",
        sourceIds: ["community"],
        sourceRecordIds: ["2"],
        names: [{ value: "Turkistan", nameType: "modern", language: "en" }],
      },
    ])[0];
    expect(merged.id).toBe("official");
    expect(merged.sourceIds).toEqual(["official", "community"]);
  });

  it("selects historical names by period and never falls back to modern names", () => {
    const place = {
      names: [
        {
          value: "Ясы",
          language: "ru",
          nameType: "historical",
          validFromYear: 1300,
          validToYear: 1600,
        },
        { value: "Туркестан", language: "ru", nameType: "modern" },
      ],
    };
    expect(getHistoricalNames(place)).toHaveLength(1);
    expect(getPlaceNameAtYear(place, 1465, "ru")).toBe("Ясы");
    expect(getPlaceNameAtYear(place, 1700, "ru")).toBeNull();
  });

  it("does not interpolate geography without a documented interval", () => {
    expect(getGeographySnapshotAtYear("aral-sea", 1465)?.id).toBe(
      "aral-sea-historical-coarse"
    );
    expect(getGeographySnapshotAtYear("aral-sea", 1960)?.id).toBe(
      "aral-sea-circa-1960-demo"
    );
  });
});
