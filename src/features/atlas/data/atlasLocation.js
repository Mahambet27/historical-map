import { atlasEras } from "./atlasHistoricalData.js";

// A valid explicit year wins over era. Invalid years fall back to the era's default.
export function atlasYearFromSearch(search) {
  const params = new URLSearchParams(search);
  const value = params.get("year");
  const year = value && /^-?\d+$/.test(value) ? Number(value) : NaN;
  if (Number.isInteger(year) && year !== 0 && year >= -3000 && year <= 2026) return year;
  return atlasEras.find((era) => era.id === params.get("era"))?.defaultYear ?? 1465;
}

export function atlasSearchForYear(search, year) {
  const params = new URLSearchParams(search);
  const era = atlasEras.find((item) => item.fromYear <= year && item.toYear >= year);
  params.set("year", String(year));
  if (era) params.set("era", era.id);
  else params.delete("era");
  return `?${params}`;
}
