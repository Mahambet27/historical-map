const tr = (ru, kk, en) => ({ ru, kk, en });

export const historicalEntities = [
  {
    id: "saka-communities",
    entityType: "cultural_political_communities",
    startYear: -800,
    endYear: -300,
    names: tr("Сакские сообщества", "Сақ қауымдары", "Saka communities"),
    descriptions: tr(
      "Группы раннего железного века, известные по письменным свидетельствам и археологическим материалам. Не являлись единым государством в современном смысле.",
      "Жазба деректер мен археологиялық материалдардан белгілі ерте темір дәуірі топтары. Қазіргі түсініктегі біртұтас мемлекет болған жоқ.",
      "Iron Age groups known from written and archaeological evidence; they were not a single state in the modern sense."
    ),
    origins: tr("Формировались в разнообразной среде степей и предгорий.", "Дала мен тау бөктерінің әртүрлі ортасында қалыптасты.", "Formed across diverse steppe and foothill environments."),
    capitals: [],
    people: [],
    eventIds: ["saka-archaeological-record"],
    sourceIds: ["britannica-kazakhstan-history"],
    neighbours: [],
    stages: tr("Археологические культуры различались по регионам и времени.", "Археологиялық мәдениеттер аймақ пен уақытқа қарай ерекшеленді.", "Archaeological cultures differed by region and time."),
    confidenceLevel: "low",
  },
  {
    id: "first-turkic-khaganate",
    entityType: "state",
    startYear: 552,
    endYear: 603,
    names: tr("Тюркский каганат", "Түрік қағанаты", "First Turkic Khaganate"),
    descriptions: tr(
      "Крупное политическое объединение Центральной Евразии, основанное правящей династией Ашина.",
      "Ашина әулеті құрған Орталық Еуразиядағы ірі саяси бірлестік.",
      "A major Central Eurasian polity founded by the Ashina ruling house."
    ),
    origins: tr("Возник в ходе консолидации тюркских племён и борьбы за политическое господство.", "Түркі тайпаларының бірігуі және саяси үстемдік үшін күрес барысында құрылды.", "Emerged through Turkic consolidation and competition for political power."),
    capitals: [tr("Отюкен (политический центр)", "Өтүкен (саяси орталық)", "Ötüken (political centre)")],
    people: ["bumin-qaghan"],
    eventIds: ["formation-turkic-khaganate"],
    sourceIds: ["britannica-turkic-peoples", "unesco-silk-roads"],
    neighbours: [tr("Сасанидский Иран", "Сасанилер Ираны", "Sasanian Iran")],
    stages: tr("Создание в 552 году; расширение; разделение в начале VII века.", "552 жылы құрылуы; кеңеюі; VII ғасырдың басында бөлінуі.", "Foundation in 552, expansion, and division in the early 7th century."),
    confidenceLevel: "low",
  },
  {
    id: "kazakh-khanate",
    entityType: "state",
    startYear: 1465,
    endYear: 1847,
    names: tr("Казахское ханство", "Қазақ хандығы", "Kazakh Khanate"),
    descriptions: tr(
      "Политическое объединение, возникшее в XV веке и сыгравшее ключевую роль в формировании казахской государственности.",
      "XV ғасырда құрылған және қазақ мемлекеттілігінің қалыптасуында шешуші рөл атқарған саяси бірлестік.",
      "A polity founded in the 15th century that played a central role in the formation of Kazakh statehood."
    ),
    origins: tr(
      "Связано с уходом части племён во главе с Кереем и Жанибеком из государства Абулхаира и их закреплением в Могулистане.",
      "Керей мен Жәнібек бастаған тайпалардың Әбілқайыр мемлекетінен бөлініп, Моғолстан аумағына орнығуымен байланысты.",
      "Linked to groups led by Kerei and Janibek leaving Abu’l-Khayr’s polity and settling in Moghulistan."
    ),
    capitals: [tr("Сузак", "Созақ", "Suzak"), tr("Сыгнак", "Сығанақ", "Syganak"), tr("Туркестан", "Түркістан", "Turkistan")],
    people: ["kerei-khan", "janibek-khan", "kasym-khan"],
    eventIds: ["formation-kazakh-khanate", "kasym-khan-consolidation"],
    sourceIds: ["e-history-kazakh-khanate", "cambridge-kazakh-history", "e-history-kasym"],
    neighbours: [tr("Могулистан", "Моғолстан", "Moghulistan"), tr("Государство Шайбанидов", "Шайбанилер мемлекеті", "Shaybanid polity")],
    stages: tr("Основание; укрепление при Касым хане; дальнейшее развитие и периоды политической раздробленности.", "Құрылуы; Қасым хан тұсында нығаюы; кейінгі даму және саяси бытыраңқылық кезеңдері.", "Foundation, consolidation under Kasym Khan, later development and periods of political fragmentation."),
    confidenceLevel: "medium",
  },
  {
    id: "kazakh-ssr",
    entityType: "union_republic",
    startYear: 1936,
    endYear: 1991,
    names: tr("Казахская ССР", "Қазақ КСР", "Kazakh SSR"),
    descriptions: tr("Союзная республика в составе СССР с 1936 по 1991 год.", "1936–1991 жылдары КСРО құрамындағы одақтас республика.", "A constituent republic of the Soviet Union from 1936 to 1991."),
    origins: tr("Создана путём преобразования Казахской АССР.", "Қазақ АКСР-ін қайта құру арқылы құрылды.", "Created by transforming the Kazakh ASSR."),
    capitals: [tr("Алма-Ата", "Алма-Ата", "Alma-Ata")],
    people: [],
    eventIds: ["kazakh-ssr-status"],
    sourceIds: ["britannica-kazakhstan-history"],
    neighbours: [],
    stages: tr("Союзная республика; суверенизация; переход к независимости.", "Одақтас республика; егемендік; тәуелсіздікке өту.", "Union republic, sovereignty, and transition to independence."),
    confidenceLevel: "high",
  },
  {
    id: "republic-kazakhstan",
    entityType: "republic",
    startYear: 1991,
    endYear: null,
    names: tr("Республика Казахстан", "Қазақстан Республикасы", "Republic of Kazakhstan"),
    descriptions: tr("Независимое государство, провозгласившее государственную независимость 16 декабря 1991 года.", "1991 жылғы 16 желтоқсанда мемлекеттік тәуелсіздігін жариялаған дербес мемлекет.", "An independent state whose state independence was established on 16 December 1991."),
    origins: tr("Возникла в результате распада СССР и принятия Конституционного закона о независимости.", "КСРО ыдырауы және тәуелсіздік туралы Конституциялық заңның қабылдануы нәтижесінде құрылды.", "Emerged through the dissolution of the USSR and adoption of the Constitutional Law on Independence."),
    capitals: [tr("Алматы (до 1997)", "Алматы (1997 жылға дейін)", "Almaty (until 1997)"), tr("Астана", "Астана", "Astana")],
    people: [],
    eventIds: ["independence-kazakhstan"],
    sourceIds: ["adilet-independence-law", "un-kazakhstan"],
    neighbours: [tr("Россия", "Ресей", "Russia"), tr("Китай", "Қытай", "China"), tr("Кыргызстан", "Қырғызстан", "Kyrgyzstan"), tr("Узбекистан", "Өзбекстан", "Uzbekistan"), tr("Туркменистан", "Түрікменстан", "Turkmenistan")],
    stages: tr("Независимость; институциональное развитие; современный этап.", "Тәуелсіздік; институционалдық даму; қазіргі кезең.", "Independence, institutional development, and the contemporary period."),
    confidenceLevel: "high",
  },
];

export const entityRelations = [
  { id: "khaganate-influence", fromEntityId: "first-turkic-khaganate", toEntityId: "kazakh-khanate", relationType: "influenced", confidenceLevel: "medium", sourceIds: ["cambridge-kazakh-history"] },
  { id: "ssr-succeeded", fromEntityId: "kazakh-ssr", toEntityId: "republic-kazakhstan", relationType: "succeeded_by", confidenceLevel: "high", sourceIds: ["adilet-independence-law"] },
];

const contextEntity = (id, startYear, endYear, ru, kk, en, color, borderColor, extrusionColor) => ({
  id,
  entityType: "state",
  startYear,
  endYear,
  names: tr(ru, kk, en),
  descriptions: tr(
    "Контекстная сущность демонстрационной карты. Геометрия требует дополнительной научной проверки.",
    "Демонстрациялық картаның контекстік нысаны. Геометрия қосымша ғылыми тексеруді қажет етеді.",
    "A contextual entity for the demonstration map. Its geometry requires further scholarly review."
  ),
  origins: tr("Требует редакционной проверки.", "Редакциялық тексеруді қажет етеді.", "Requires editorial review."),
  capitals: [],
  people: [],
  eventIds: [],
  sourceIds: [],
  neighbours: [],
  stages: tr("Демонстрационный контекст.", "Демонстрациялық мәнмәтін.", "Demonstration context."),
  confidenceLevel: "low",
  verificationStatus: "needs_review",
  color,
  borderColor,
  extrusionColor,
});

export const politicalContextEntities = [
  contextEntity("western-turkic-khaganate", 603, 704, "Западно-Тюркский каганат", "Батыс Түрік қағанаты", "Western Turkic Khaganate", "#B8873F", "#F1CE8D", "#865D28"),
  contextEntity("turgesh-khaganate", 704, 756, "Тюргешский каганат", "Түргеш қағанаты", "Turgesh Khaganate", "#8E6841", "#E5BE82", "#62452A"),
  contextEntity("karluk-state", 756, 940, "Карлукское государство", "Қарлұқ мемлекеті", "Karluk state", "#3E866B", "#8FD2B8", "#275D49"),
  contextEntity("oghuz-state", 756, 1055, "Огузское государство", "Оғыз мемлекеті", "Oghuz state", "#3F6E9C", "#8DB8E1", "#294C70"),
  contextEntity("kimak-khaganate", 840, 1050, "Кимакский каганат", "Қимақ қағанаты", "Kimak Khaganate", "#66789B", "#AFC0DF", "#43516D"),
  contextEntity("karakhanid-state", 840, 1212, "Караханидское государство", "Қарахан мемлекеті", "Karakhanid state", "#76558F", "#C5A4DD", "#503863"),
  contextEntity("abulkhair-state", 1428, 1468, "Государство Абулхаира", "Әбілқайыр мемлекеті", "Abu'l-Khayr state", "#8A6A43", "#D8B77D", "#60472D"),
  contextEntity("moghulistan", 1347, 1514, "Могулистан", "Моғолстан", "Moghulistan", "#3C8062", "#8ACBAD", "#285741"),
  contextEntity("nogai-horde", 1440, 1634, "Ногайская Орда", "Ноғай Ордасы", "Nogai Horde", "#3B6795", "#8CB5DC", "#264969"),
  contextEntity("timurid-state", 1370, 1507, "Государство Тимуридов", "Темір әулеті мемлекеті", "Timurid state", "#745890", "#C1A2D9", "#4F3B63"),
  contextEntity("sibir-khanate", 1468, 1598, "Сибирское ханство", "Сібір хандығы", "Sibir Khanate", "#477B83", "#93CDD3", "#31565C"),
  contextEntity("dzungar-khanate", 1635, 1758, "Джунгарское ханство", "Жоңғар хандығы", "Dzungar Khanate", "#8E3F4C", "#E39AA4", "#642B35"),
  contextEntity("bukhara-khanate", 1500, 1785, "Бухарское ханство", "Бұхара хандығы", "Bukhara Khanate", "#76518D", "#C3A0DA", "#503660"),
  contextEntity("khiva-khanate", 1511, 1920, "Хивинское ханство", "Хиуа хандығы", "Khiva Khanate", "#A16F42", "#E2B984", "#704B2C"),
  contextEntity("russian-empire", 1721, 1917, "Российская империя", "Ресей империясы", "Russian Empire", "#304F78", "#85A9D4", "#203650"),
  contextEntity("qing-empire", 1644, 1912, "Цинская империя", "Цин империясы", "Qing Empire", "#8F3940", "#E18A90", "#64272C"),
];

const coreStyles = {
  "saka-communities": ["#A97D45", "#E5C28D", "#76552E"],
  "first-turkic-khaganate": ["#B07B38", "#F0CA84", "#7D5423"],
  "kazakh-khanate": ["#C7963E", "#F5D58E", "#A87527"],
  "kazakh-ssr": ["#3C7F75", "#8ED3C4", "#28594F"],
  "republic-kazakhstan": ["#267D73", "#8BE0CE", "#18574F"],
};

historicalEntities.forEach((entity) => {
  const [color, borderColor, extrusionColor] = coreStyles[entity.id] || ["#6C7780", "#C5CDD2", "#465058"];
  Object.assign(entity, { color, borderColor, extrusionColor, verificationStatus: entity.verificationStatus || "reviewed" });
});

export const allHistoricalEntities = [...historicalEntities, ...politicalContextEntities];
