import { eraRegistry, getEraRegistryEntry } from "../../../data/exhibition/eraRegistry.js";
import { entityGeometries } from "../../../data/exhibition/entityGeometries.js";
import { historicalEvents } from "../../../data/exhibition/events.js";
import { hydrologySnapshots } from "../../../data/exhibition/hydrologySnapshots.js";
import { historicalRiverSnapshots } from "../../../data/exhibition/historicalRiverSnapshots.js";
import { historicalRoutes } from "../../../data/exhibition/historicalRoutes.js";
import { historicalSettlements } from "../../../data/exhibition/historicalSettlements.js";
import { timelineStates } from "../../../data/exhibition/timeline.js";
import { normalizeHistoricalYear } from "./historicalYear.js";

const activeAt = (item, year) => {
  const from =
    item.validFromYear ??
    item.startYear ??
    item.periodStart ??
    item.year ??
    Number.NEGATIVE_INFINITY;
  const to =
    item.validToYear ??
    item.endYear ??
    item.periodEnd ??
    item.year ??
    Number.POSITIVE_INFINITY;
  return from <= year && to >= year;
};

const exactAt = (item, year) =>
  item.snapshotYear === year ||
  item.year === year ||
  (item.startYear === year && item.endYear === year) ||
  (item.validFromYear === year && item.validToYear === year);

const datasets = {
  boundaries: entityGeometries,
  events: historicalEvents,
  places: historicalSettlements,
  routes: historicalRoutes,
  hydrology: [...hydrologySnapshots, ...historicalRiverSnapshots],
  timeline: timelineStates,
};
const activeCache = new Map();
const availabilityCache = new Map();

export const getActiveSnapshotsAtYear = (year) => {
  const normalized = normalizeHistoricalYear(year);
  if (normalized == null) return {};
  if (activeCache.has(normalized)) return activeCache.get(normalized);
  const result = Object.fromEntries(
    Object.entries(datasets).map(([name, records]) => [
      name,
      records.filter((record) => activeAt(record, normalized)),
    ])
  );
  activeCache.set(normalized, result);
  return result;
};

export const hasExactSnapshot = (year) =>
  Object.values(getActiveSnapshotsAtYear(year))
    .flat()
    .some((record) => exactAt(record, normalizeHistoricalYear(year)));

export const hasIntervalData = (year) =>
  Object.values(getActiveSnapshotsAtYear(year)).some((records) => records.length > 0);

const buildAvailability = (normalized) => {
  if (availabilityCache.has(normalized)) return availabilityCache.get(normalized);
  const records = getActiveSnapshotsAtYear(normalized);
  const exact = hasExactSnapshot(normalized);
  const interval = hasIntervalData(normalized);
  const needsReview = Object.values(records)
    .flat()
    .some((record) =>
      ["needs_review", "approximate", "demo_only"].includes(
        record.verificationStatus
      )
    );
  const result = {
    year: normalized,
    exact,
    interval,
    needsReview,
    status: exact
      ? "exact"
      : interval && needsReview
        ? "approximate"
        : interval
          ? "interval"
          : "unavailable",
    counts: Object.fromEntries(
      Object.entries(records).map(([name, items]) => [name, items.length])
    ),
  };
  availabilityCache.set(normalized, result);
  return result;
};

export const getAvailableDataForYear = (year) => {
  const normalized = normalizeHistoricalYear(year);
  if (normalized == null) {
    return {
      year: null,
      exact: false,
      interval: false,
      needsReview: false,
      status: "unavailable",
      counts: {},
    };
  }
  const result = buildAvailability(normalized);
  // Keep the current and adjacent historical years warm without a permanent RAF.
  for (const adjacent of [normalized - 1, normalized + 1]) {
    const validAdjacent = normalizeHistoricalYear(adjacent);
    if (validAdjacent != null && !availabilityCache.has(validAdjacent)) {
      buildAvailability(validAdjacent);
    }
  }
  return result;
};

export const getYearDataSummary = (year) => {
  const availability = getAvailableDataForYear(year);
  const total = Object.values(availability.counts).reduce(
    (sum, count) => sum + count,
    0
  );
  return { ...availability, total };
};

export const getKeyYearsForEra = (eraId) =>
  getEraRegistryEntry(eraId)?.keyYears || [];

export const getNearestDocumentedYear = (year) => {
  const normalized = normalizeHistoricalYear(year);
  const documented = [...new Set(eraRegistry.flatMap((era) => era.keyYears))];
  return documented.reduce((nearest, candidate) =>
    Math.abs(candidate - normalized) < Math.abs(nearest - normalized)
      ? candidate
      : nearest
  );
};

export const getTimelineWarnings = (year) => {
  const availability = getAvailableDataForYear(year);
  const warnings = [];
  if (!availability.exact && availability.interval) {
    warnings.push("interval_reconstruction");
  }
  if (availability.status === "approximate") warnings.push("approximate");
  if (availability.needsReview) warnings.push("needs_review");
  if (availability.status === "unavailable") warnings.push("data_unavailable");
  return warnings;
};
