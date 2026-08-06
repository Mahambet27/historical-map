import { getEraById } from "../../data/exhibition/eras.js";
import { getHistoricalSnapshotAtYear } from "../../data/exhibition/timeline.js";
import {
  clampYearToEra,
  clampYearToTimeline,
  getEraForYear,
  normalizeHistoricalYear,
} from "./timeline/historicalYear.js";

export const clampHistoricalYear = clampYearToTimeline;

export const resolveYearSelection = (year, preferredEraId = null) => {
  const preferredEra = preferredEraId ? getEraById(preferredEraId) : null;
  const normalized = normalizeHistoricalYear(year);
  const selectedYear = preferredEra
    ? clampYearToEra(normalized, preferredEra)
    : clampHistoricalYear(normalized);
  const era = getEraForYear(selectedYear);
  return {
    selectedYear,
    selectedEraId: era?.id || preferredEra?.id || null,
    activeSnapshot: getHistoricalSnapshotAtYear(selectedYear),
  };
};

export const resolveEraSelection = (eraId, year = null) => {
  const era = getEraById(eraId);
  if (!era) return null;
  const selectedYear = clampYearToEra(year ?? era.defaultYear, era);
  return {
    selectedYear,
    selectedEraId: era.id,
    activeSnapshot: getHistoricalSnapshotAtYear(selectedYear),
  };
};

export const resolveTimelineUrlState = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const eraId = params.get("era");
  const year = params.get("year");
  const era = eraId ? getEraById(eraId) : null;
  if (era) return resolveEraSelection(era.id, year);
  return resolveYearSelection(year ?? 1465);
};

export const writeTimelineUrlState = (eraId, year) => {
  const url = new URL(window.location.href);
  url.searchParams.set("era", eraId);
  url.searchParams.set("year", String(normalizeHistoricalYear(year)));
  window.history.replaceState(window.history.state, "", url);
};
