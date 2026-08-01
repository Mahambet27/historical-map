const tr = (ru, kk, en) => ({ ru, kk, en });
const polygon = (coordinates) => ({
  type: "Feature",
  properties: {},
  geometry: { type: "Polygon", coordinates: [coordinates] },
});

export const ENVIRONMENT_TYPES = [
  "steppe",
  "forest_steppe",
  "desert",
  "semi_desert",
  "mountain",
  "river_valley",
  "wetland",
  "agricultural_zone",
  "pasture",
  "oasis",
];

export const environmentSnapshots = [
  {
    id: "southern-steppe-medieval-demo",
    environmentType: "steppe",
    validFromYear: 500,
    validToYear: 1500,
    names: tr("Степная зона Южного Казахстана", "Оңтүстік Қазақстанның дала аймағы", "Southern Kazakhstan steppe zone"),
    descriptions: tr(
      "Учебная обзорная зона, а не детальная палеоклиматическая реконструкция.",
      "Бұл егжей-тегжейлі палеоклиматтық реконструкция емес, оқу шолу аймағы.",
      "An educational overview zone, not a detailed palaeoclimate reconstruction."
    ),
    geojson: polygon([[55, 41], [77, 41], [78, 48], [58, 49], [55, 41]]),
    sourceIds: ["unesco-silk-roads"],
    confidenceLevel: "low",
    verificationStatus: "needs_review",
    interpolationAllowed: false,
    screenReaderDescriptions: tr(
      "Приблизительная учебная степная зона охватывает часть Южного Казахстана.",
      "Шамамен берілген оқу дала аймағы Оңтүстік Қазақстанның бір бөлігін қамтиды.",
      "An approximate educational steppe zone covers part of southern Kazakhstan."
    ),
  },
  {
    id: "tian-shan-foothills-medieval-demo",
    environmentType: "mountain",
    validFromYear: 500,
    validToYear: 1500,
    names: tr("Предгорья Тянь-Шаня", "Тянь-Шань тау бөктері", "Tian Shan foothills"),
    descriptions: tr(
      "Обобщённая зона гор и предгорий для объяснения географического контекста городов.",
      "Қалалардың географиялық мәнмәтінін түсіндіруге арналған таулар мен тау бөктерінің жалпыланған аймағы.",
      "A generalized mountain and foothill zone used to explain the geographic context of cities."
    ),
    geojson: polygon([[68, 39.5], [81, 39.5], [80, 44], [70, 43.5], [68, 39.5]]),
    sourceIds: ["unesco-silk-roads"],
    confidenceLevel: "low",
    verificationStatus: "demo_only",
    interpolationAllowed: false,
    screenReaderDescriptions: tr(
      "Демонстрационная зона предгорий расположена вдоль южной границы учебной карты.",
      "Демонстрациялық тау бөктері аймағы оқу картасының оңтүстік шекарасы бойында орналасқан.",
      "A demonstration foothill zone runs along the southern edge of the educational map."
    ),
  },
  {
    id: "syr-darya-valley-medieval-demo",
    environmentType: "river_valley",
    validFromYear: 700,
    validToYear: 1500,
    names: tr("Долина Сырдарьи", "Сырдария аңғары", "Syr Darya valley"),
    descriptions: tr(
      "Условная полоса речной долины для образовательного сопоставления городов и маршрутов.",
      "Қалалар мен бағыттарды оқу мақсатында салыстыруға арналған шартты өзен аңғары.",
      "An interpretive river-valley band for educational comparison of cities and routes."
    ),
    geojson: polygon([[61, 41.2], [69.5, 42], [72, 43], [70.5, 44], [62, 42.7], [61, 41.2]]),
    sourceIds: ["unesco-silk-roads"],
    confidenceLevel: "low",
    verificationStatus: "needs_review",
    interpolationAllowed: false,
    screenReaderDescriptions: tr(
      "Условная речная долина проходит с юго-востока к району Аральского моря.",
      "Шартты өзен аңғары оңтүстік-шығыстан Арал теңізі аймағына қарай өтеді.",
      "An interpretive river valley runs northwest from the southeast toward the Aral region."
    ),
  },
];

export const getEnvironmentSnapshotsAtYear = (year) =>
  environmentSnapshots.filter(
    (item) =>
      item.validFromYear <= year &&
      (item.validToYear === null || item.validToYear >= year)
  );

