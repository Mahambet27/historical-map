const name = (value, language, validFromYear, validToYear = null) => ({
  value,
  language,
  validFromYear,
  validToYear,
});

const place = ({
  id,
  coordinates,
  names,
  placeType = ["city", "trade_center"],
  validFromYear = 500,
  validToYear = null,
  entityIds = [],
  routeIds = ["silk-road-southern-kazakhstan"],
  sourceIds = ["unesco-silk-roads"],
  verificationStatus = "needs_review",
}) => ({
  id,
  placeType,
  names,
  validFromYear,
  validToYear,
  coordinates,
  coordinatePrecision: "approximate",
  entityIds,
  routeIds,
  eventIds: [],
  personIds: [],
  sourceIds,
  confidenceLevel: verificationStatus === "reviewed" ? "medium" : "low",
  verificationStatus,
});

export const historicalSettlements = [
  place({
    id: "taraz",
    coordinates: [71.37, 42.9],
    names: [
      name("Талас", "ru", 500, 1200),
      name("Талас", "kk", 500, 1200),
      name("Talas", "en", 500, 1200),
      name("Тараз", "ru", 1997),
      name("Тараз", "kk", 1997),
      name("Taraz", "en", 1997),
    ],
  }),
  place({
    id: "otrar",
    coordinates: [68.3, 42.85],
    placeType: ["city", "trade_center", "archaeological_site"],
    names: [name("Отырар", "ru", 700), name("Отырар", "kk", 700), name("Otrar", "en", 700), name("Фараб", "ru", 800, 1300), name("Farab", "en", 800, 1300)],
  }),
  place({
    id: "sayram",
    coordinates: [69.76, 42.3],
    names: [name("Испиджаб", "ru", 700, 1200), name("Испиджаб", "kk", 700, 1200), name("Ispidjab", "en", 700, 1200), name("Сайрам", "ru", 1200), name("Сайрам", "kk", 1200), name("Sayram", "en", 1200)],
  }),
  place({
    id: "turkistan",
    coordinates: [68.25, 43.3],
    placeType: ["city", "sacred_site", "administrative_center"],
    names: [name("Ясы", "ru", 900, 1500), name("Ясы", "kk", 900, 1500), name("Yasi", "en", 900, 1500), name("Туркестан", "ru", 1500), name("Түркістан", "kk", 1500), name("Turkistan", "en", 1500)],
    entityIds: ["kazakh-khanate"],
  }),
  place({
    id: "syganak",
    coordinates: [66.02, 44.17],
    placeType: ["city", "capital", "archaeological_site"],
    names: [name("Сыганак", "ru", 900), name("Сығанақ", "kk", 900), name("Syganak", "en", 900)],
    entityIds: ["kazakh-khanate"],
  }),
  place({
    id: "saraishyk",
    coordinates: [51.73, 47.05],
    placeType: ["city", "trade_center", "archaeological_site"],
    names: [name("Сарайчик", "ru", 1200), name("Сарайшық", "kk", 1200), name("Saraishyk", "en", 1200)],
    entityIds: ["kazakh-khanate"],
    routeIds: [],
  }),
  place({
    id: "balasagun",
    coordinates: [75.25, 42.75],
    placeType: ["city", "trade_center", "archaeological_site"],
    names: [name("Баласагун", "ru", 900, 1300), name("Баласағұн", "kk", 900, 1300), name("Balasagun", "en", 900, 1300)],
    validToYear: 1400,
  }),
  place({
    id: "ispidjab",
    coordinates: [69.76, 42.3],
    names: [name("Испиджаб", "ru", 700, 1200), name("Испиджаб", "kk", 700, 1200), name("Ispidjab", "en", 700, 1200)],
    validToYear: 1200,
  }),
];

export const getHistoricalSettlementsAtYear = (year) =>
  historicalSettlements.filter(
    (item) =>
      item.validFromYear <= year &&
      (item.validToYear === null || item.validToYear >= year)
  );

export const historicalSettlementById = new Map(
  historicalSettlements.map((item) => [item.id, item])
);

