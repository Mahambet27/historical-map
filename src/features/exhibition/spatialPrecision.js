export const SPATIAL_PRECISIONS = Object.freeze([
  "exact",
  "surveyed",
  "approximate",
  "generalized",
  "coarse_reconstruction",
  "schematic",
  "unknown",
]);

const LABELS = {
  exact: { ru: "Точная", kk: "Дәл", en: "Exact" },
  surveyed: { ru: "Инструментальная", kk: "Өлшенген", en: "Surveyed" },
  approximate: { ru: "Приблизительная", kk: "Шамамен", en: "Approximate" },
  generalized: { ru: "Обобщённая", kk: "Жалпыланған", en: "Generalized" },
  coarse_reconstruction: {
    ru: "Грубая реконструкция",
    kk: "Жалпы реконструкция",
    en: "Coarse reconstruction",
  },
  schematic: { ru: "Схематическая", kk: "Схемалық", en: "Schematic" },
  unknown: { ru: "Неизвестная", kk: "Белгісіз", en: "Unknown" },
};

export const getSpatialPrecision = (record = {}) => {
  const explicit =
    record.spatialPrecision ||
    record.geometryPrecision ||
    record.coordinatePrecision;
  if (SPATIAL_PRECISIONS.includes(explicit)) return explicit;
  if (
    record.geometrySourceType === "educational_generalization" ||
    record.reconstructionMethod?.toLowerCase?.().includes("coarse")
  ) {
    return "coarse_reconstruction";
  }
  if (record.routeType || record.routeId || record.durationStatus) {
    return "schematic";
  }
  if (record.geometryType === "reconstruction") {
    return record.confidenceLevel === "low"
      ? "coarse_reconstruction"
      : "generalized";
  }
  if (record.georeferenceType === "image-corners") return "approximate";
  return "unknown";
};

export const getSpatialPrecisionLabel = (record, language = "ru") => {
  const copy = LABELS[getSpatialPrecision(record)] || LABELS.unknown;
  return copy[language] || copy.ru;
};

export const getSpatialPrecisionWarning = (record, language = "ru") => {
  const precision = getSpatialPrecision(record);
  if (["exact", "surveyed"].includes(precision)) return "";
  const warnings = {
    ru: {
      approximate: "Координата приблизительна и не является точкой инструментальной съёмки.",
      generalized: "Геометрия обобщена и не подходит для точного измерения.",
      coarse_reconstruction: "Контур является грубой реконструкцией; метрическая точность не заявляется.",
      schematic: "Схема показывает направление, а не точную траекторию.",
      unknown: "Пространственная точность не установлена.",
    },
    kk: {
      approximate: "Координата шамамен берілген және аспаптық өлшеу нүктесі емес.",
      generalized: "Геометрия жалпыланған және дәл өлшеуге жарамайды.",
      coarse_reconstruction: "Контур жалпы реконструкция; метрикалық дәлдік мәлімделмейді.",
      schematic: "Схема нақты траекторияны емес, бағытты көрсетеді.",
      unknown: "Кеңістіктік дәлдік анықталмаған.",
    },
    en: {
      approximate: "The coordinate is approximate, not a surveyed point.",
      generalized: "The geometry is generalized and unsuitable for precise measurement.",
      coarse_reconstruction: "This is a coarse reconstruction; metric accuracy is not claimed.",
      schematic: "The diagram shows direction, not an exact trajectory.",
      unknown: "Spatial precision is unknown.",
    },
  };
  return (warnings[language] || warnings.ru)[precision] || "";
};

export const getPrecisionStyle = (record, theme = "light") => {
  const precision = getSpatialPrecision(record);
  const highContrast = theme === "high-contrast";
  return {
    precision,
    opacity: ["exact", "surveyed"].includes(precision) ? 0.92 : 0.62,
    linePattern:
      precision === "schematic"
        ? [2, 2]
        : precision === "coarse_reconstruction"
          ? [1, 3]
          : null,
    width: highContrast ? 3 : 2,
    pattern:
      precision === "unknown"
        ? "crosshatch"
        : precision === "approximate"
          ? "soft-edge"
          : "solid",
  };
};

export const canCalculateAreaPrecisely = (record) =>
  ["exact", "surveyed"].includes(getSpatialPrecision(record));

export const canCalculateDistancePrecisely = (record) =>
  ["exact", "surveyed"].includes(getSpatialPrecision(record));

