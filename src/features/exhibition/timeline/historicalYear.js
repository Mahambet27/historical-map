import {
  eraRegistry,
  getEraRegistryEntryAtYear,
} from "../../../data/exhibition/eraRegistry.js";

const labels = {
  ru: { bce: "до н. э.", ce: "н. э.", year: "г." },
  kk: { bce: "б.з.д.", ce: "б.з.", year: "ж." },
  en: { bce: "BCE", ce: "CE", year: "" },
};

const bounds = {
  fromYear: Math.min(...eraRegistry.map((era) => era.fromYear)),
  toYear: Math.max(...eraRegistry.map((era) => era.toYear)),
};

export const isValidHistoricalYear = (year) =>
  Number.isInteger(year) && year !== 0;

export const normalizeHistoricalYear = (year) => {
  const numeric = Number(year);
  if (!Number.isFinite(numeric)) return null;
  const integer = Math.trunc(numeric);
  return integer === 0 ? 1 : integer;
};

export const getYearDisplayParts = (year, language = "ru") => {
  const normalized = normalizeHistoricalYear(year);
  if (normalized == null) return null;
  const locale = labels[language] ? language : "ru";
  return {
    absoluteYear: Math.abs(normalized),
    eraLabel: normalized < 0 ? labels[locale].bce : labels[locale].ce,
    yearLabel: labels[locale].year,
    isBce: normalized < 0,
  };
};

export const formatHistoricalYear = (year, language = "ru") => {
  const parts = getYearDisplayParts(year, language);
  if (!parts) return "";
  if (language === "en") return `${parts.absoluteYear} ${parts.eraLabel}`;
  if (language === "kk") {
    return `${parts.eraLabel} ${parts.absoluteYear} ${parts.yearLabel}`;
  }
  return `${parts.absoluteYear} ${parts.yearLabel} ${parts.eraLabel}`.replace(
    /\s+/g,
    " "
  );
};

export const getNextHistoricalYear = (year) => {
  const normalized = normalizeHistoricalYear(year);
  if (normalized == null) return 1;
  return normalized === -1 ? 1 : normalized + 1;
};

export const getPreviousHistoricalYear = (year) => {
  const normalized = normalizeHistoricalYear(year);
  if (normalized == null) return -1;
  return normalized === 1 ? -1 : normalized - 1;
};

const eraBounds = (era) => ({
  fromYear: era?.fromYear ?? era?.startYear,
  toYear: era?.toYear ?? era?.endYear,
});

export const clampYearToEra = (year, era) => {
  const { fromYear, toYear } = eraBounds(era);
  if (!Number.isFinite(fromYear) || !Number.isFinite(toYear)) return null;
  const normalized = normalizeHistoricalYear(year) ?? era.defaultYear ?? fromYear;
  const clamped = Math.min(toYear, Math.max(fromYear, normalized));
  if (clamped !== 0) return clamped;
  return toYear >= 1 ? 1 : -1;
};

export const historicalYearToSliderIndex = (year, era) => {
  const { fromYear } = eraBounds(era);
  const normalized = clampYearToEra(year, era);
  return normalized - fromYear - (fromYear < 0 && normalized > 0 ? 1 : 0);
};

export const sliderIndexToHistoricalYear = (index, era) => {
  const { fromYear } = eraBounds(era);
  let year = fromYear + Math.max(0, Math.trunc(Number(index) || 0));
  if (fromYear < 0 && year >= 0) year += 1;
  return clampYearToEra(year, era);
};

export const getEraForYear = (year) => {
  const normalized = normalizeHistoricalYear(year);
  if (normalized == null) return null;
  return getEraRegistryEntryAtYear(normalized);
};

export const clampYearToTimeline = (year) => {
  const normalized = normalizeHistoricalYear(year) ?? 1;
  return Math.min(bounds.toYear, Math.max(bounds.fromYear, normalized));
};
