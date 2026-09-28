// UI prototype only. These illustrative records/positions are NOT the historical
// database, verified reconstructions, or GIS geometry. Do not publish as evidence.
const tr = (ru, kk, en) => ({ ru, kk, en });

export const atlasEras = [
  {
    id: "stone",
    name: tr("Каменный век", "Тас дәуірі", "Stone Age"),
    year: -3000,
    end: -2001,
    period: "≤ 2000 BCE",
  },
  {
    id: "bronze",
    name: tr("Бронзовый век", "Қола дәуірі", "Bronze Age"),
    year: -1500,
    end: -801,
    period: "2000–800 BCE",
  },
  {
    id: "saka",
    name: tr("Сакский период", "Сақ кезеңі", "Saka period"),
    year: -550,
    end: 551,
    period: "800 BCE–551 CE",
  },
  {
    id: "turkic",
    name: tr("Тюркская эпоха", "Түркі дәуірі", "Turkic era"),
    year: 552,
    end: 1218,
    period: "552–1218",
  },
  {
    id: "horde",
    name: tr("Золотая Орда", "Алтын Орда", "Golden Horde"),
    year: 1219,
    end: 1464,
    period: "1219–1464",
  },
  {
    id: "khanate",
    name: tr("Казахское ханство", "Қазақ хандығы", "Kazakh Khanate"),
    year: 1465,
    end: 1799,
    period: "1465–1799",
  },
  {
    id: "nineteenth",
    name: tr("XIX век", "XIX ғасыр", "19th century"),
    year: 1800,
    end: 1899,
    period: "1800–1899",
  },
  {
    id: "twentieth",
    name: tr("XX век", "XX ғасыр", "20th century"),
    year: 1917,
    end: 1990,
    period: "1900–1990",
  },
];

export const atlasCategories = [
  { id: "city", name: tr("Города", "Қалалар", "Cities"), symbol: "◇" },
  { id: "archaeology", name: tr("Археология", "Археология", "Archaeology"), symbol: "⌑" },
  { id: "burial", name: tr("Курганы", "Қорғандар", "Burial mounds"), symbol: "△" },
  { id: "mausoleum", name: tr("Мавзолеи", "Кесенелер", "Mausoleums"), symbol: "▱" },
  { id: "petroglyph", name: tr("Петроглифы", "Петроглифтер", "Petroglyphs"), symbol: "⋈" },
  { id: "battle", name: tr("Сражения", "Шайқастар", "Battles"), symbol: "⚑" },
  { id: "route", name: tr("Маршруты", "Бағыттар", "Routes"), symbol: "↝" },
  {
    id: "heritage",
    name: tr("Культурное наследие", "Мәдени мұра", "Cultural heritage"),
    symbol: "◈",
  },
];

export const atlasLayers = [
  {
    id: "territories",
    name: tr("Исторические территории", "Тарихи аумақтар", "Historical territories"),
    on: true,
  },
  {
    id: "borders",
    name: tr("Исторические границы", "Тарихи шекаралар", "Historical borders"),
    on: true,
  },
  { id: "settlements", name: tr("Населённые пункты", "Елді мекендер", "Settlements"), on: true },
  { id: "trade", name: tr("Торговые пути", "Сауда жолдары", "Trade routes"), on: true },
  {
    id: "modern",
    name: tr("Современные границы", "Қазіргі шекаралар", "Modern borders"),
    on: false,
  },
  { id: "terrain", name: tr("Рельеф", "Жер бедері", "Terrain"), on: true },
  { id: "models", name: tr("3D объекты", "3D нысандар", "3D objects"), on: false, future: true },
];

export const atlasDemoObjects = [
  {
    id: "otrar",
    name: tr("Отырар", "Отырар", "Otrar"),
    category: "city",
    era: tr("Средневековье", "Орта ғасырлар", "Middle Ages"),
    date: tr("VIII–XVIII вв.", "VIII–XVIII ғғ.", "8th–18th centuries"),
    description: tr(
      "Город на пересечении торговых путей. Место встречи культур, ремёсел и знаний Великого Шёлкового пути.",
      "Сауда жолдары тоғысқан қала. Ұлы Жібек жолының мәдениеті, қолөнері мен білімі тоғысқан мекен.",
      "A city at the meeting of trade routes. A place to explore the cultures, crafts and knowledge of the Silk Road."
    ),
    position: [530, 582],
    coordinates: [68.3, 42.85],
    index: "01",
  },
  {
    id: "turkistan",
    name: tr("Туркестан", "Түркістан", "Turkistan"),
    category: "mausoleum",
    era: tr("Казахское ханство", "Қазақ хандығы", "Kazakh Khanate"),
    date: tr("XIV–XIX вв.", "XIV–XIX ғғ.", "14th–19th centuries"),
    description: tr(
      "Архитектурное и духовное наследие юга Казахстана. Демонстрационная карточка города и мавзолея.",
      "Қазақстанның оңтүстігіндегі сәулет және рухани мұра. Қала мен кесененің үлгілік карточкасы.",
      "Architectural and spiritual heritage of southern Kazakhstan. An illustrative city and mausoleum entry."
    ),
    position: [485, 530],
    coordinates: [68.27, 43.3],
    index: "02",
  },
  {
    id: "bozok",
    name: tr("Бозоқ", "Бозоқ", "Bozok"),
    category: "archaeology",
    era: tr("Средневековье", "Орта ғасырлар", "Middle Ages"),
    date: tr("VIII–XVI вв.", "VIII–XVI ғғ.", "8th–16th centuries"),
    description: tr(
      "Археологический ландшафт степи. В прототипе показано, как будут представлены древние поселения.",
      "Даланың археологиялық ландшафты. Үлгіде көне қоныстардың көрсетілуі берілген.",
      "An archaeological landscape of the steppe. This entry previews the presentation of ancient settlements."
    ),
    position: [656, 292],
    coordinates: [71.24, 51.15],
    index: "03",
  },
  {
    id: "berel",
    name: tr("Берел", "Берел", "Berel"),
    category: "burial",
    era: tr("Сакский период", "Сақ кезеңі", "Saka period"),
    date: tr("IV–III вв. до н. э.", "Б.з.д. IV–III ғғ.", "4th–3rd centuries BCE"),
    description: tr(
      "Курганный комплекс Алтая. Образец карточки для знакомства с погребальной культурой древних кочевников.",
      "Алтай қорғандар кешені. Көне көшпелілердің жерлеу мәдениетімен танысуға арналған карточка үлгісі.",
      "A burial complex in the Altai. A sample entry exploring the funerary culture of ancient nomads."
    ),
    position: [987, 322],
    coordinates: [86.43, 49.37],
    index: "04",
  },
  {
    id: "shilikti",
    name: tr("Шілікті", "Шілікті", "Shilikti"),
    category: "burial",
    era: tr("Сакский период", "Сақ кезеңі", "Saka period"),
    date: tr("VIII–VI вв. до н. э.", "Б.з.д. VIII–VI ғғ.", "8th–6th centuries BCE"),
    description: tr(
      "Наследие раннего железного века в восточном Казахстане. Демо-запись археологического объекта.",
      "Шығыс Қазақстандағы ерте темір дәуірінің мұрасы. Археологиялық нысанның үлгілік жазбасы.",
      "Early Iron Age heritage in eastern Kazakhstan. An illustrative archaeological record."
    ),
    position: [931, 399],
    coordinates: [83.55, 47.17],
    index: "05",
  },
  {
    id: "tamgaly",
    name: tr("Тамғалы", "Таңбалы", "Tamgaly"),
    category: "petroglyph",
    era: tr("Бронзовый век", "Қола дәуірі", "Bronze Age"),
    date: tr("II тысячелетие до н. э.", "Б.з.д. II мыңжылдық", "2nd millennium BCE"),
    description: tr(
      "Петроглифы и культурный ландшафт Жетысу. Пример представления наскального искусства в атласе.",
      "Жетісудың петроглифтері мен мәдени ландшафты. Атласта жартас өнерін көрсету үлгісі.",
      "Petroglyphs and the cultural landscape of Zhetysu. A preview of rock art in the atlas."
    ),
    position: [779, 564],
    coordinates: [75.53, 43.8],
    index: "06",
  },
];

export const atlasKeyDates = [-1500, -550, 552, 1219, 1465, 1731, 1917, 1991, 2026];
export const atlasLocal = (value, language) => value?.[language] || value?.ru || "";
export const atlasEraAtYear = (year) => {
  if (year >= 1991)
    return {
      id: "modern",
      name: tr("Независимый Казахстан", "Тәуелсіз Қазақстан", "Independent Kazakhstan"),
    };
  return atlasEras.find((era) => year <= era.end) || atlasEras.at(-1);
};
export const atlasYear = (year, language) =>
  year < 0
    ? `${Math.abs(year)} ${language === "en" ? "BCE" : language === "kk" ? "б.з.д." : "до н. э."}`
    : String(year);
export const filterAtlasObjects = (query, categories) => {
  const normalized = query.trim().toLocaleLowerCase();
  return atlasDemoObjects.filter((object) => {
    const category = atlasCategories.find((item) => item.id === object.category);
    return (
      categories.includes(object.category) &&
      [object.name, object.era, category.name, object.description]
        .flatMap((field) => Object.values(field))
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized)
    );
  });
};
