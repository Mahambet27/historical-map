import { isHistoricalRecordActive } from "../../../domain/history/historicalSnapshot.js";
import { atlasLocal, atlasYear } from "./atlasDemoData.js";

const locales = ["ru", "kk", "en"];
const localized = (fn) => Object.fromEntries(locales.map((language) => [language, fn(language)]));
const typeLabels = {
  city: { ru: "Города", kk: "Қалалар", en: "Cities" },
  trade_center: { ru: "Торговые центры", kk: "Сауда орталықтары", en: "Trade centres" },
  archaeological_site: { ru: "Археология", kk: "Археология", en: "Archaeology" },
  sacred_site: { ru: "Священные места", kk: "Киелі орындар", en: "Sacred sites" },
  administrative_center: {
    ru: "Административные центры",
    kk: "Әкімшілік орталықтар",
    en: "Administrative centres",
  },
  capital: { ru: "Столицы", kk: "Астаналар", en: "Capitals" },
  unknown: { ru: "Тип не указан", kk: "Түрі көрсетілмеген", en: "Unspecified type" },
};
const unknownEra = {
  id: null,
  name: { ru: "Эпоха не указана", kk: "Дәуір көрсетілмеген", en: "Era unspecified" },
};

export const validAtlasCoordinates = (coordinates) =>
  Array.isArray(coordinates) &&
  coordinates.length === 2 &&
  coordinates.every(Number.isFinite) &&
  Math.abs(coordinates[0]) <= 180 &&
  Math.abs(coordinates[1]) <= 90;

/** NON-GIS visual projection into the existing 1200x800 placeholder.
 * Linear screen mapping only: not a geographic projection or accurate boundary fit.
 * Out-of-frame coordinates remain searchable but are not placed on the sketch.
 */
export const projectAtlasCoordinates = (coordinates) => {
  if (!validAtlasCoordinates(coordinates)) return null;
  const [longitude, latitude] = coordinates;
  const point = [((longitude - 44) / 46) * 1200, ((57 - latitude) / 18) * 800];
  return point.every((value, index) => value >= 0 && value <= [1200, 800][index]) ? point : null;
};

export function adaptAtlasSnapshot(snapshot) {
  const era = snapshot.era
    ? { ...snapshot.era, name: snapshot.era.names || snapshot.era.name }
    : unknownEra;
  const sources = new Map((snapshot.metadata.sources || []).map((source) => [source.id, source]));
  const objects = snapshot.places.map((place, index) => {
    const activeNames = Array.isArray(place.names)
      ? place.names.filter((name) => isHistoricalRecordActive(name, snapshot.year))
      : [];
    // Match the existing historicalPlaceNames fallback: requested language, then RU.
    const name = localized((language) =>
      Array.isArray(place.names)
        ? activeNames.find((entry) => entry.language === language)?.value ||
          activeNames.find((entry) => entry.language === "ru")?.value ||
          place.id
        : atlasLocal(place.names || place.name, language) || place.id
    );
    const types = Array.isArray(place.placeType)
      ? place.placeType
      : [place.placeType || place.type || "unknown"];
    const category = types[0];
    const coordinates =
      place.coordinates ||
      place.coords ||
      (place.geometry?.type === "Point" ? place.geometry.coordinates : null);
    const from = place.validFromYear ?? place.validFrom ?? place.yearFrom ?? place.fromYear;
    const to = place.validToYear ?? place.validTo ?? place.yearTo ?? place.toYear;
    const date = localized(
      (language) =>
        `${from == null ? "…" : atlasYear(from, language)} — ${to == null ? "…" : atlasYear(to, language)}`
    );
    return {
      id: place.id,
      index: String(index + 1).padStart(2, "0"),
      name,
      era: place.era || era.name,
      date,
      category,
      types,
      categoryLabel: typeLabels[category] || category,
      description: place.description || {},
      alternateNames: [...activeNames.map((entry) => entry.value), ...(place.alternateNames || [])],
      coordinates: validAtlasCoordinates(coordinates) ? coordinates : null,
      position: projectAtlasCoordinates(coordinates),
      coordinatePrecision: place.coordinatePrecision,
      confidence: place.confidenceLevel ?? place.confidence ?? null,
      verificationStatus: place.verificationStatus ?? null,
      sources: (place.sourceIds || []).map((id) => sources.get(id) || { id, title: id }),
      evidence: place.evidence ?? null,
    };
  });
  const categories = [...new Set(objects.flatMap((object) => object.types))].map((id) => ({
    id,
    name: typeLabels[id] || id,
    symbol: "◇",
  }));
  return {
    year: snapshot.year,
    era,
    objects,
    categories,
    layerStats: {
      settlements: objects.length,
      territories: snapshot.territories.length,
      borders: snapshot.borders.length,
    },
    metadata: snapshot.metadata,
  };
}

export function filterAtlasObjects(objects, query, excludedCategories = []) {
  const normalized = query.trim().toLocaleLowerCase().replaceAll("ё", "е");
  return objects.filter(
    (object) =>
      object.types.some((type) => !excludedCategories.includes(type)) &&
      [
        object.name,
        object.era,
        object.categoryLabel,
        object.description,
        ...object.alternateNames,
        ...object.types,
      ]
        .flatMap((field) => (typeof field === "object" && field ? Object.values(field) : [field]))
        .join(" ")
        .toLocaleLowerCase()
        .replaceAll("ё", "е")
        .includes(normalized)
  );
}
