import {
  historicalSettlementById,
  historicalSettlements,
} from "../../data/exhibition/historicalSettlements.js";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase()
    .replaceAll("ё", "е");

const matchesYear = (name, year) =>
  name.validFromYear <= year &&
  (name.validToYear === null || name.validToYear >= year);

export const getPlaceNameAtYear = (place, year, language = "ru") => {
  if (!place) return "";
  const activeNames = place.names.filter((entry) => matchesYear(entry, year));
  const latestNames = [...place.names].sort(
    (a, b) => b.validFromYear - a.validFromYear
  );
  return (
    activeNames.find((entry) => entry.language === language)?.value ||
    activeNames.find((entry) => entry.language === "ru")?.value ||
    latestNames.find((entry) => entry.language === language)?.value ||
    latestNames.find((entry) => entry.language === "ru")?.value ||
    ""
  );
};

export const getPlaceNamesAtYear = (year, language = "ru") =>
  historicalSettlements
    .filter(
      (place) =>
        place.validFromYear <= year &&
        (place.validToYear === null || place.validToYear >= year)
    )
    .map((place) => ({
      id: place.id,
      name: getPlaceNameAtYear(place, year, language),
      place,
    }));

export const getHistoricalNameVariants = (placeId) => {
  const place = historicalSettlementById.get(placeId);
  return place ? [...place.names] : [];
};

export const searchPlaceByHistoricalName = (query, language) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  return historicalSettlements.filter((place) =>
    place.names.some(
      (entry) =>
        (!language || entry.language === language || entry.language === "ru") &&
        normalize(entry.value).includes(normalizedQuery)
    )
  );
};
