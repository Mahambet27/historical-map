const tr = (ru, kk, en) => ({ ru, kk, en });

export const historicalEras = [
  { id: "saka", startYear: -800, endYear: -300, defaultYear: -550, title: tr("Сакская эпоха", "Сақ дәуірі", "Saka period") },
  { id: "turkic", startYear: 552, endYear: 942, defaultYear: 552, title: tr("Тюркский период", "Түркі кезеңі", "Turkic period") },
  { id: "kazakh-khanate", startYear: 1465, endYear: 1847, defaultYear: 1465, title: tr("Казахское ханство", "Қазақ хандығы", "Kazakh Khanate") },
  { id: "kazakh-ssr", startYear: 1936, endYear: 1991, defaultYear: 1936, title: tr("Казахская ССР", "Қазақ КСР", "Kazakh SSR") },
  { id: "independent-kazakhstan", startYear: 1991, endYear: 2026, defaultYear: 1991, title: tr("Независимый Казахстан", "Тәуелсіз Қазақстан", "Independent Kazakhstan") },
];

export const getEraAtYear = (year) =>
  historicalEras.find((era) => year >= era.startYear && year <= era.endYear) || null;

export const getEraById = (id) => historicalEras.find((era) => era.id === id) || null;
