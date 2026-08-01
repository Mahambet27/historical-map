const tr = (ru, kk, en) => ({ ru, kk, en });

export const sourceDisputes = [
  {
    id: "demo-geometry-interpretation-structure",
    subjectType: "geometry",
    subjectId: "demo-only",
    titles: tr(
      "Демонстрация структуры альтернативных версий",
      "Балама нұсқалар құрылымының демонстрациясы",
      "Alternative-interpretation structure demonstration"
    ),
    descriptions: tr(
      "Это demo-only структура без утверждения о реально существующем научном споре.",
      "Бұл нақты ғылыми дау туралы мәлімдемесіз demo-only құрылым.",
      "This is a demo-only structure and does not assert a real scholarly dispute."
    ),
    positions: [
      {
        id: "demo-position-a",
        labels: tr("Версия A", "A нұсқасы", "Position A"),
        descriptions: tr("Только пример структуры.", "Тек құрылым үлгісі.", "Structure example only."),
        sourceIds: [],
        confidenceLevel: "low",
      },
      {
        id: "demo-position-b",
        labels: tr("Версия B", "B нұсқасы", "Position B"),
        descriptions: tr("Только пример структуры.", "Тек құрылым үлгісі.", "Structure example only."),
        sourceIds: [],
        confidenceLevel: "low",
      },
    ],
    verificationStatus: "demo_only",
  },
];
