const localize = (ru, kk, en) => ({ ru, kk, en });

export const timelineStates = [
  {
    id: "saka-era",
    year: -550,
    periodStart: -800,
    periodEnd: -300,
    title: localize("Сакская эпоха", "Сақ дәуірі", "Saka era"),
    description: localize(
      "Кочевые и оседлые сообщества раннего железного века оставили богатое археологическое наследие.",
      "Ерте темір дәуірінің көшпелі және отырықшы қауымдары бай археологиялық мұра қалдырды.",
      "Nomadic and settled Iron Age communities left a rich archaeological record."
    ),
    simpleDescription: localize(
      "Археологи изучают курганы и находки, чтобы понять жизнь сакских сообществ.",
      "Археологтар сақ қауымдарының өмірін түсіну үшін қорғандар мен олжаларды зерттейді.",
      "Archaeologists study burial mounds and finds to understand Saka communities."
    ),
    camera: { center: [67.2, 47.6], zoom: 4.05, pitch: 28, bearing: 0 },
    entityIds: ["saka-communities"],
    placeIds: ["issyk", "shilikti"],
    eventIds: ["saka-archaeological-record"],
    personIds: [],
    sourceIds: ["britannica-kazakhstan-history", "unesco-silk-roads"],
  },
  {
    id: "turkic-khaganate-552",
    year: 552,
    periodStart: 552,
    periodEnd: 603,
    title: localize("Тюркский каганат", "Түрік қағанаты", "First Turkic Khaganate"),
    description: localize(
      "В 552 году возник Тюркский каганат, объединивший значительные пространства Центральной Евразии.",
      "552 жылы Орталық Еуразияның кең аумағын біріктірген Түрік қағанаты құрылды.",
      "In 552 the First Turkic Khaganate emerged across a large part of Central Eurasia."
    ),
    camera: { center: [68, 47.8], zoom: 3.8, pitch: 32, bearing: -4 },
    entityIds: ["first-turkic-khaganate"],
    placeIds: ["taraz", "merke"],
    eventIds: ["formation-turkic-khaganate"],
    personIds: ["bumin-qaghan"],
    sourceIds: ["britannica-turkic-peoples", "unesco-silk-roads"],
  },
  {
    id: "kazakh-khanate-1465",
    year: 1465,
    periodStart: 1465,
    periodEnd: 1466,
    title: localize("Образование Казахского ханства", "Қазақ хандығының құрылуы", "Formation of the Kazakh Khanate"),
    description: localize(
      "Керей и Жанибек возглавили новое политическое объединение в западном Жетысу; датировка 1465–1466 годов является принятой реконструкцией.",
      "Керей мен Жәнібек Батыс Жетісуда жаңа саяси бірлестікті басқарды; 1465–1466 жылдар — қабылданған ғылыми реконструкция.",
      "Kerei and Janibek led a new political formation in western Zhetysu; 1465–1466 is a commonly used scholarly reconstruction."
    ),
    camera: { center: [69.3, 45.4], zoom: 4.6, pitch: 38, bearing: -8 },
    entityIds: ["kazakh-khanate"],
    placeIds: ["chu-valley", "turkistan"],
    eventIds: ["formation-kazakh-khanate"],
    personIds: ["kerei-khan", "janibek-khan"],
    sourceIds: ["e-history-kazakh-khanate", "cambridge-kazakh-history"],
  },
  {
    id: "kasym-khan-1511",
    year: 1511,
    periodStart: 1511,
    periodEnd: 1521,
    title: localize("Ханство при Касым хане", "Қасым хан тұсындағы хандық", "The Khanate under Kasym Khan"),
    description: localize(
      "При Касым хане политическое влияние ханства укрепилось, а его территория расширилась. Контуры остаются приблизительными.",
      "Қасым хан тұсында хандықтың саяси ықпалы күшейіп, аумағы кеңейді. Шекаралар шамамен көрсетілген.",
      "Under Kasym Khan the Khanate’s political influence grew and its territory expanded. Boundaries remain approximate."
    ),
    camera: { center: [66.5, 48.3], zoom: 4.0, pitch: 34, bearing: 3 },
    entityIds: ["kazakh-khanate"],
    placeIds: ["ulytau", "saraishyk", "turkistan"],
    eventIds: ["kasym-khan-consolidation"],
    personIds: ["kasym-khan"],
    sourceIds: ["e-history-kasym", "cambridge-kazakh-history"],
  },
  {
    id: "kazakh-ssr-1936",
    year: 1936,
    periodStart: 1936,
    periodEnd: 1991,
    title: localize("Казахстан в XX веке", "XX ғасырдағы Қазақстан", "Kazakhstan in the 20th century"),
    description: localize(
      "В 1936 году Казахская АССР стала союзной республикой — Казахской ССР. Период включает масштабные и противоречивые преобразования.",
      "1936 жылы Қазақ АКСР-і одақтас республика — Қазақ КСР-і болып қайта құрылды. Бұл кезең ауқымды әрі қайшылықты өзгерістерді қамтиды.",
      "In 1936 the Kazakh ASSR became the Kazakh SSR, a union republic. The period brought vast and contested transformations."
    ),
    camera: { center: [67.3, 48.1], zoom: 4.05, pitch: 24, bearing: 0 },
    entityIds: ["kazakh-ssr"],
    placeIds: ["almaty", "baikonur"],
    eventIds: ["kazakh-ssr-status"],
    personIds: [],
    sourceIds: ["britannica-kazakhstan-history"],
  },
  {
    id: "independence-1991",
    year: 1991,
    periodStart: 1991,
    periodEnd: 1991,
    title: localize("Независимый Казахстан", "Тәуелсіз Қазақстан", "Independent Kazakhstan"),
    description: localize(
      "16 декабря 1991 года был принят Конституционный закон о государственной независимости Республики Казахстан.",
      "1991 жылғы 16 желтоқсанда Қазақстан Республикасының мемлекеттік тәуелсіздігі туралы Конституциялық заң қабылданды.",
      "On 16 December 1991 Kazakhstan adopted its Constitutional Law on State Independence."
    ),
    camera: { center: [67.2, 48.0], zoom: 4.15, pitch: 30, bearing: 0 },
    entityIds: ["republic-kazakhstan"],
    placeIds: ["almaty", "astana"],
    eventIds: ["independence-kazakhstan"],
    personIds: [],
    sourceIds: ["adilet-independence-law", "un-kazakhstan"],
  },
];

export const initialTimelineState = timelineStates[2];

export const getTimelineStateAtYear = (year) =>
  timelineStates.reduce((best, state) =>
    Math.abs(state.year - year) < Math.abs(best.year - year) ? state : best
  );

// The selected year remains independent. A snapshot supplies curated content and
// camera settings but never rewrites the user's exact year.
export const getHistoricalSnapshotAtYear = (year) => {
  const exactPeriod = timelineStates.find(
    (state) => year >= state.periodStart && year <= state.periodEnd
  );
  if (exactPeriod) return exactPeriod;
  const preceding = timelineStates.filter((state) => state.year <= year);
  return preceding.at(-1) || timelineStates[0];
};

export const KEY_HISTORICAL_YEARS = [
  -800, 552, 603, 704, 756, 942, 1219, 1465, 1511, 1521, 1643, 1723, 1731, 1847,
  1936, 1991, 2026,
];
