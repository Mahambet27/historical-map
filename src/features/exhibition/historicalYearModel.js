import { getEraAtYear, getEraById } from "../../data/exhibition/eras.js";
import { getHistoricalSnapshotAtYear } from "../../data/exhibition/timeline.js";

export const clampHistoricalYear = (year) =>
  Math.min(2026, Math.max(-3000, Number(year)));

export const resolveYearSelection = (year) => {
  const selectedYear = clampHistoricalYear(year);
  return {
    selectedYear,
    selectedEraId: getEraAtYear(selectedYear)?.id || null,
    activeSnapshot: getHistoricalSnapshotAtYear(selectedYear),
  };
};

export const resolveEraSelection = (eraId) => {
  const era = getEraById(eraId);
  if (!era) return null;
  return {
    selectedYear: era.defaultYear,
    selectedEraId: era.id,
    activeSnapshot: getHistoricalSnapshotAtYear(era.defaultYear),
  };
};
