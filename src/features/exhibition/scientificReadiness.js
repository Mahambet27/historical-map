export const SCIENTIFIC_READINESS = Object.freeze({
  EXHIBITION_READY: "exhibition_ready",
  EDUCATIONAL_RECONSTRUCTION: "educational_reconstruction",
  SCIENTIFIC_REVIEW_REQUIRED: "scientific_review_required",
  DISPUTED: "disputed",
  DEMO_ONLY: "demo_only",
  UNAVAILABLE: "unavailable",
});

const local = (copy, language) => copy[language] || copy.ru;
const validRange = (record) =>
  record?.validFromYear == null ||
  record?.validToYear == null ||
  record.validToYear >= record.validFromYear;
const sourceIds = (record) =>
  record?.sourceIds || (record?.sourceId ? [record.sourceId] : []);
const licenseStatus = (record) =>
  record?.licenseStatus || record?.license?.status || "not_applicable";
const hasGeometryError = (record) =>
  Boolean(
    record?.geometryErrors?.some?.((issue) => issue.severity === "error") ||
      record?.criticalGeometryError
  );
const hasGeometry = (record) =>
  !record?.geometryRequired ||
  Boolean(record?.geometry || record?.geojson || record?.coordinates);

export const getScientificReadiness = (record) => {
  if (!record || !hasGeometry(record) || record.unavailable === true) {
    return SCIENTIFIC_READINESS.UNAVAILABLE;
  }
  if (record.verificationStatus === "disputed" || record.disputed === true) {
    return SCIENTIFIC_READINESS.DISPUTED;
  }
  if (record.verificationStatus === "demo_only") {
    return SCIENTIFIC_READINESS.DEMO_ONLY;
  }
  if (
    ["reviewed", "verified"].includes(record.verificationStatus) &&
    sourceIds(record).length > 0 &&
    licenseStatus(record) !== "unknown" &&
    !hasGeometryError(record) &&
    validRange(record)
  ) {
    return SCIENTIFIC_READINESS.EXHIBITION_READY;
  }
  if (
    record.verificationStatus === "needs_review" &&
    (record.geometryType === "reconstruction" ||
      record.reconstructionMethod ||
      record.coordinatePrecision ||
      record.geometryPrecision ||
      record.interpolationAllowed === false)
  ) {
    return SCIENTIFIC_READINESS.EDUCATIONAL_RECONSTRUCTION;
  }
  return SCIENTIFIC_READINESS.SCIENTIFIC_REVIEW_REQUIRED;
};

const REASONS = {
  exhibition_ready: {
    ru: "Источники и проверочный статус достаточны для выставочного показа.",
    kk: "Дереккөздер мен тексеру мәртебесі көрмеде көрсетуге жеткілікті.",
    en: "Sources and review status permit exhibition display.",
  },
  educational_reconstruction: {
    ru: "Учебная реконструкция: требуется явная маркировка неопределённости.",
    kk: "Оқу реконструкциясы: белгісіздік анық көрсетілуі керек.",
    en: "Educational reconstruction: uncertainty must be labelled.",
  },
  scientific_review_required: {
    ru: "Требуется научная проверка источников, периода или геометрии.",
    kk: "Дереккөзді, кезеңді немесе геометрияны ғылыми тексеру қажет.",
    en: "Scientific review of sources, period, or geometry is required.",
  },
  disputed: {
    ru: "Существуют конкурирующие интерпретации.",
    kk: "Бәсекелес түсіндірулер бар.",
    en: "Competing interpretations exist.",
  },
  demo_only: {
    ru: "Только демонстрационная структура, не подтверждённый факт.",
    kk: "Тек демонстрациялық құрылым, расталған факт емес.",
    en: "Demonstration structure only; not a verified fact.",
  },
  unavailable: {
    ru: "Доступная подтверждённая геометрия отсутствует.",
    kk: "Қолжетімді расталған геометрия жоқ.",
    en: "No usable verified geometry is available.",
  },
};

export const getScientificReadinessReason = (record, language = "ru") =>
  local(REASONS[getScientificReadiness(record)], language);

export const canUseInOfficialDemo = (record) =>
  [
    SCIENTIFIC_READINESS.EXHIBITION_READY,
    SCIENTIFIC_READINESS.EDUCATIONAL_RECONSTRUCTION,
  ].includes(getScientificReadiness(record));

export const canUseInScientificPublication = (record) =>
  getScientificReadiness(record) === SCIENTIFIC_READINESS.EXHIBITION_READY &&
  !["approximate", "generalized", "coarse_reconstruction", "schematic", "unknown"].includes(
    record?.spatialPrecision ||
      record?.geometryPrecision ||
      record?.coordinatePrecision
  );

export const canUseInEducationalStory = (record) =>
  ![
    SCIENTIFIC_READINESS.DISPUTED,
    SCIENTIFIC_READINESS.DEMO_ONLY,
    SCIENTIFIC_READINESS.UNAVAILABLE,
  ].includes(getScientificReadiness(record));

export const getScientificWarnings = (record, language = "ru") => {
  const warnings = [];
  if (!sourceIds(record).length) {
    warnings.push(
      local(
        {
          ru: "Нет связанных источников.",
          kk: "Байланысты дереккөздер жоқ.",
          en: "No linked sources.",
        },
        language
      )
    );
  }
  if (!validRange(record)) {
    warnings.push(
      local(
        {
          ru: "Некорректный временной диапазон.",
          kk: "Уақыт аралығы жарамсыз.",
          en: "Invalid temporal range.",
        },
        language
      )
    );
  }
  if (licenseStatus(record) === "unknown") {
    warnings.push(
      local(
        {
          ru: "Лицензия не установлена.",
          kk: "Лицензия анықталмаған.",
          en: "License is unknown.",
        },
        language
      )
    );
  }
  if (getScientificReadiness(record) !== SCIENTIFIC_READINESS.EXHIBITION_READY) {
    warnings.push(getScientificReadinessReason(record, language));
  }
  return warnings;
};

export const summarizeScientificReadiness = (records = []) =>
  records.reduce(
    (summary, record) => {
      const readiness = getScientificReadiness(record);
      summary[readiness] = (summary[readiness] || 0) + 1;
      return summary;
    },
    Object.fromEntries(Object.values(SCIENTIFIC_READINESS).map((value) => [value, 0]))
  );
