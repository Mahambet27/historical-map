const tr = (ru, kk, en) => ({ ru, kk, en });

export const ROUTE_TYPES = [
  "trade",
  "caravan",
  "migration",
  "military_campaign",
  "diplomatic_mission",
  "nomadic_seasonal",
  "religious_pilgrimage",
  "archaeological_expedition",
  "administrative",
  "exploration",
];

export const historicalRoutes = [
  {
    id: "silk-road-southern-kazakhstan",
    routeType: "trade",
    names: tr(
      "Великий Шёлковый путь — южноказахстанское направление",
      "Ұлы Жібек жолы — Оңтүстік Қазақстан бағыты",
      "Silk Road — Southern Kazakhstan route"
    ),
    summaries: tr(
      "Реконструированное направление между историческими городскими центрами Южного Казахстана.",
      "Оңтүстік Қазақстанның тарихи қала орталықтары арасындағы реконструкцияланған бағыт.",
      "A reconstructed direction connecting historic urban centres in southern Kazakhstan."
    ),
    validFromYear: -200,
    validToYear: 1500,
    segmentIds: [
      "silk-sayram-taraz",
      "silk-taraz-otrar",
      "silk-otrar-turkistan",
      "silk-turkistan-syganak",
    ],
    placeIds: ["sayram", "taraz", "otrar", "turkistan", "syganak"],
    entityIds: ["first-turkic-khaganate", "kazakh-khanate"],
    eventIds: [],
    goods: [],
    culturalRoles: tr(
      "Маршрут связывал городские центры и поддерживал культурный обмен; точный характер обмена зависит от периода.",
      "Бағыт қала орталықтарын байланыстырып, мәдени алмасуға ықпал етті; алмасудың нақты сипаты кезеңге байланысты.",
      "The route connected urban centres and supported cultural exchange; its exact character varied by period."
    ),
    politicalRoles: tr(
      "Контроль путей и городских центров имел политическое значение, но карта не утверждает постоянный контроль одного государства.",
      "Жолдар мен қала орталықтарын бақылау саяси маңызға ие болды, бірақ карта бір мемлекеттің тұрақты бақылауын мәлімдемейді.",
      "Control of routes and urban centres had political importance, but the map does not assert permanent control by one state."
    ),
    sourceIds: ["unesco-silk-roads", "cambridge-kazakh-history"],
    confidenceLevel: "low",
    verificationStatus: "needs_review",
    interpolationAllowed: false,
  },
  {
    id: "nomadic-seasonal-cycle-demo",
    routeType: "nomadic_seasonal",
    names: tr("Демонстрационный сезонный цикл", "Демонстрациялық маусымдық айналым", "Demonstration seasonal cycle"),
    summaries: tr(
      "Архитектурный пример қыстау–көктеу–жайлау–күзеу без утверждения точного исторического пути.",
      "Нақты тарихи бағытты мәлімдемейтін қыстау–көктеу–жайлау–күзеу архитектуралық мысалы.",
      "An architectural qystau–kokteu–jailau–kuzeu example that does not assert an exact historical route."
    ),
    validFromYear: -3000,
    validToYear: 2026,
    segmentIds: [],
    placeIds: [],
    entityIds: [],
    eventIds: [],
    seasonCycle: [
      { season: "winter", placeId: null, order: 1 },
      { season: "spring", placeId: null, order: 2 },
      { season: "summer", placeId: null, order: 3 },
      { season: "autumn", placeId: null, order: 4 },
    ],
    sourceIds: [],
    confidenceLevel: "low",
    verificationStatus: "needs_review",
    interpolationAllowed: false,
  },
];

export const getHistoricalRoutesAtYear = (year) =>
  historicalRoutes.filter(
    (item) =>
      item.validFromYear <= year &&
      (item.validToYear === null || item.validToYear >= year)
  );

export const historicalRouteById = new Map(
  historicalRoutes.map((route) => [route.id, route])
);

