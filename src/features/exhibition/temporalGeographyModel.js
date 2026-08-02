import {
  environmentSnapshots,
  getEnvironmentSnapshotsAtYear,
} from "../../data/exhibition/environmentSnapshots.js";
import {
  hydrologySnapshots,
  getHydrologySnapshotsAtYear,
} from "../../data/exhibition/hydrologySnapshots.js";
import { historicalRiverSnapshots } from "../../data/exhibition/historicalRiverSnapshots.js";

const STATUS_SCORE = {
  verified: 4,
  reviewed: 3,
  needs_review: 2,
  approximate: 1,
  demo_only: 0,
};
const CONFIDENCE_SCORE = { high: 3, medium: 2, low: 1 };
const allSnapshots = () => [
  ...hydrologySnapshots,
  ...historicalRiverSnapshots,
  ...environmentSnapshots.map((item) => ({
    ...item,
    featureId: item.featureId || item.id,
    geometry: item.geometry || item.geojson,
    featureType: item.featureType || item.environmentType,
  })),
];
const active = (item, year) =>
  item.validFromYear <= year &&
  (item.validToYear == null || item.validToYear >= year);
const specificity = (item) =>
  item.validToYear == null
    ? Number.MAX_SAFE_INTEGER
    : item.validToYear - item.validFromYear;
const rank = (a, b) =>
  (STATUS_SCORE[b.verificationStatus] || 0) -
    (STATUS_SCORE[a.verificationStatus] || 0) ||
  (CONFIDENCE_SCORE[b.confidenceLevel] || 0) -
    (CONFIDENCE_SCORE[a.confidenceLevel] || 0) ||
  specificity(a) - specificity(b);

export const getAvailableGeographySnapshots = (featureId) =>
  allSnapshots()
    .filter((item) => item.featureId === featureId)
    .sort((a, b) => a.validFromYear - b.validFromYear);

export const getGeographySnapshotAtYear = (featureId, year) =>
  getAvailableGeographySnapshots(featureId)
    .filter((item) => active(item, year))
    .sort(rank)[0] || null;

export const getHydrologyAtYear = (year) => [
  ...getHydrologySnapshotsAtYear(year),
  ...historicalRiverSnapshots.filter((item) => active(item, year)),
];

export const getEnvironmentAtYear = (year) =>
  getEnvironmentSnapshotsAtYear(year);

export const getHistoricalTerrainContext = (
  _year,
  { mode = "subtle", quality = "auto", highContrast = false } = {}
) => ({
  mode: quality === "light" || highContrast ? "off" : mode,
  temporal: false,
  labels: false,
  verificationStatus: "generalized_static_context",
});

const local = (value, language) => value?.[language] || value?.ru || "";
export const getHistoricalGeographyLabels = (year, language = "ru") =>
  getHydrologyAtYear(year)
    .filter((item) => item.names && item.verificationStatus !== "demo_only")
    .map((item) => ({
      id: `${item.id}-label`,
      featureId: item.featureId,
      label: local(item.names, language),
      verificationStatus: item.verificationStatus,
      geometry: item.geometry,
    }));

export const getGeographyVerificationStatus = (featureId, year) => {
  const snapshot = getGeographySnapshotAtYear(featureId, year);
  if (!snapshot) return "data_unavailable";
  if (snapshot.verificationStatus === "verified") return "verified_snapshot";
  if (snapshot.verificationStatus === "reviewed") return "reviewed_reconstruction";
  return "approximate_reconstruction";
};

