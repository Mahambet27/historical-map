const names = (ru, kk, en) => ({ ru, kk, en });

// Canonical era ranges. Other modules may project this shape for backwards
// compatibility, but must not define independent ranges.
export const eraRegistry = Object.freeze([
  {
    id: "saka",
    order: 1,
    names: names("Сакская эпоха", "Сақ дәуірі", "Saka period"),
    fromYear: -800,
    toYear: -300,
    defaultYear: -550,
    keyYears: [-800, -550, -300],
    featuredEntityIds: ["saka-groups"],
    featuredPlaceIds: ["berel", "issyk"],
    featuredEventIds: [],
    featuredStoryIds: [],
    description: names(
      "Археологически документированный период сакских культур.",
      "Сақ мәдениеттерінің археологиялық деректелген кезеңі.",
      "The archaeologically documented period of the Saka cultures."
    ),
    verificationStatus: "needs_review",
    sourceIds: ["britannica-kazakhstan-history"],
  },
  {
    id: "turkic",
    order: 2,
    names: names("Тюркский период", "Түркі кезеңі", "Turkic period"),
    fromYear: 552,
    toYear: 942,
    defaultYear: 552,
    keyYears: [552, 603, 704, 756, 942],
    featuredEntityIds: ["first-turkic-khaganate", "western-turkic-khaganate"],
    featuredPlaceIds: ["taraz", "otrar"],
    featuredEventIds: [],
    featuredStoryIds: ["silk-road-water"],
    description: names(
      "Период тюркских каганатов и раннесредневековых государств.",
      "Түркі қағанаттары мен ерте ортағасырлық мемлекеттер кезеңі.",
      "The period of Turkic khaganates and early medieval states."
    ),
    verificationStatus: "needs_review",
    sourceIds: ["britannica-kazakhstan-history"],
  },
  {
    id: "kazakh-khanate",
    order: 3,
    names: names("Казахское ханство", "Қазақ хандығы", "Kazakh Khanate"),
    fromYear: 1465,
    toYear: 1847,
    defaultYear: 1465,
    keyYears: [1465, 1511, 1521, 1643, 1723, 1731, 1847],
    featuredEntityIds: ["kazakh-khanate"],
    featuredPlaceIds: ["turkistan"],
    featuredEventIds: ["kazakh-khanate-foundation"],
    featuredStoryIds: ["kazakh-khanate-formation"],
    description: names(
      "Формирование и развитие Казахского ханства.",
      "Қазақ хандығының құрылуы мен дамуы.",
      "Formation and development of the Kazakh Khanate."
    ),
    verificationStatus: "reviewed",
    sourceIds: ["britannica-kazakhstan-history"],
  },
  {
    id: "kazakh-ssr",
    order: 4,
    names: names("Казахская ССР", "Қазақ КСР", "Kazakh SSR"),
    fromYear: 1936,
    toYear: 1990,
    defaultYear: 1936,
    keyYears: [1936, 1960],
    featuredEntityIds: ["kazakh-ssr"],
    featuredPlaceIds: ["almaty", "baikonur"],
    featuredEventIds: ["kazakh-ssr-status"],
    featuredStoryIds: [],
    description: names(
      "Период Казахской Советской Социалистической Республики.",
      "Қазақ Кеңестік Социалистік Республикасы кезеңі.",
      "The period of the Kazakh Soviet Socialist Republic."
    ),
    verificationStatus: "reviewed",
    sourceIds: ["britannica-kazakhstan-history"],
  },
  {
    id: "independent-kazakhstan",
    order: 5,
    names: names(
      "Независимый Казахстан",
      "Тәуелсіз Қазақстан",
      "Independent Kazakhstan"
    ),
    fromYear: 1991,
    toYear: 2026,
    defaultYear: 1991,
    keyYears: [1991, 2026],
    featuredEntityIds: ["republic-kazakhstan"],
    featuredPlaceIds: ["almaty", "astana"],
    featuredEventIds: ["independence-kazakhstan"],
    featuredStoryIds: [],
    description: names(
      "Республика Казахстан после провозглашения независимости.",
      "Тәуелсіздік жарияланғаннан кейінгі Қазақстан Республикасы.",
      "The Republic of Kazakhstan after independence."
    ),
    verificationStatus: "reviewed",
    sourceIds: ["adilet-independence-law", "un-kazakhstan"],
  },
]);

export const getEraRegistryEntry = (id) =>
  eraRegistry.find((era) => era.id === id) || null;

export const getEraRegistryEntryAtYear = (year) =>
  eraRegistry.find((era) => year >= era.fromYear && year <= era.toYear) || null;
