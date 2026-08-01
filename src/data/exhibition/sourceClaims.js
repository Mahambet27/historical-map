const tr = (ru, kk, en) => ({ ru, kk, en });

export const CLAIM_SUBJECT_TYPES = [
  "entity", "geometry", "event", "person", "place", "route", "environment",
  "hydrology", "story", "historical_change",
];

export const CLAIM_PREDICATES = [
  "foundation_period", "existence_period", "territorial_extent", "capital",
  "ruler", "event_date", "place_location", "historical_name",
  "route_direction", "environmental_state", "cause", "consequence",
  "relationship", "cultural_significance",
];

export const EVIDENCE_TYPES = [
  "primary_source", "archaeological_evidence", "historical_map",
  "academic_interpretation", "official_document", "museum_catalogue",
  "encyclopedia_summary", "educational_reconstruction", "oral_history",
];

export const sourceClaims = [
  {
    id: "claim-khanate-foundation-1465",
    subjectType: "entity",
    subjectId: "kazakh-khanate",
    predicate: "foundation_period",
    valueType: "year_range",
    value: { startYear: 1465, endYear: 1466 },
    labels: tr(
      "Формирование Казахского ханства традиционно датируют приблизительно 1465–1466 годами",
      "Қазақ хандығының құрылуы дәстүрлі түрде шамамен 1465–1466 жылдармен белгіленеді",
      "The formation of the Kazakh Khanate is conventionally dated to approximately 1465–1466"
    ),
    sourceIds: ["e-history-kazakh-khanate", "cambridge-kazakh-history"],
    evidenceType: "academic_interpretation",
    confidenceLevel: "high",
    verificationStatus: "reviewed",
    interpretationNotes: tr(
      "Это традиционная датировка периода формирования, а не доказательство одного точного дня.",
      "Бұл бір нақты күннің дәлелі емес, қалыптасу кезеңінің дәстүрлі мерзімдемесі.",
      "This is a conventional chronology for a formation period, not proof of one exact day."
    ),
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    id: "claim-independence-1991",
    subjectType: "event",
    subjectId: "independence-kazakhstan",
    predicate: "event_date",
    valueType: "date",
    value: { year: 1991, month: 12, day: 16 },
    labels: tr(
      "Конституционный закон о государственной независимости принят 16 декабря 1991 года",
      "Мемлекеттік тәуелсіздік туралы Конституциялық заң 1991 жылғы 16 желтоқсанда қабылданды",
      "The Constitutional Law on State Independence was adopted on 16 December 1991"
    ),
    sourceIds: ["adilet-independence-law"],
    evidenceType: "official_document",
    confidenceLevel: "high",
    verificationStatus: "verified",
    interpretationNotes: tr(
      "Утверждение относится к дате официального правового акта.",
      "Тұжырым ресми құқықтық актінің күніне қатысты.",
      "The claim concerns the date of the official legal act."
    ),
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    id: "claim-khanate-1465-territory",
    subjectType: "geometry",
    subjectId: "khanate-1465",
    predicate: "territorial_extent",
    valueType: "geometry_reference",
    value: { geometryId: "khanate-1465", represents: "interpretive_extent" },
    labels: tr(
      "Контур 1465 года показывает интерпретируемый охват, а не точную государственную границу",
      "1465 жылғы контур нақты мемлекеттік шекараны емес, түсіндірмелік қамтуды көрсетеді",
      "The 1465 outline represents an interpretive extent, not an exact state border"
    ),
    sourceIds: ["e-history-kazakh-khanate", "cambridge-kazakh-history"],
    evidenceType: "educational_reconstruction",
    confidenceLevel: "low",
    verificationStatus: "needs_review",
    interpretationNotes: tr(
      "Источники дают исторический контекст, но не подтверждают каждую вершину полигона.",
      "Дереккөздер тарихи контекст береді, бірақ полигонның әр төбесін растамайды.",
      "The sources provide historical context but do not validate every polygon vertex."
    ),
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    id: "claim-otrar-location",
    subjectType: "place",
    subjectId: "otrar",
    predicate: "place_location",
    valueType: "coordinates",
    value: { coordinates: [68.3, 42.85], precision: "approximate" },
    labels: tr(
      "Отырар показан приблизительной точкой исторического центра",
      "Отырар тарихи орталықтың шамамен алынған нүктесімен көрсетілген",
      "Otrar is shown with an approximate point for the historical centre"
    ),
    sourceIds: ["unesco-silk-roads"],
    evidenceType: "educational_reconstruction",
    confidenceLevel: "low",
    verificationStatus: "needs_review",
    interpretationNotes: tr(
      "Точка предназначена для навигации и не задаёт границы археологического комплекса.",
      "Нүкте навигацияға арналған және археологиялық кешеннің шекарасын белгілемейді.",
      "The point supports navigation and does not define the archaeological complex boundary."
    ),
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    id: "claim-silk-road-direction",
    subjectType: "route",
    subjectId: "silk-road-southern-kazakhstan",
    predicate: "route_direction",
    valueType: "route_reference",
    value: { routeId: "silk-road-southern-kazakhstan", status: "reconstructed_direction" },
    labels: tr(
      "Линия показывает реконструированное южноказахстанское направление Шёлкового пути",
      "Сызық Жібек жолының Оңтүстік Қазақстандағы реконструкцияланған бағытын көрсетеді",
      "The line shows a reconstructed Southern Kazakhstan direction of the Silk Road"
    ),
    sourceIds: ["unesco-silk-roads", "cambridge-kazakh-history"],
    evidenceType: "educational_reconstruction",
    confidenceLevel: "medium",
    verificationStatus: "needs_review",
    interpretationNotes: tr(
      "Это обобщённое направление между городами, а не записанный точный трек.",
      "Бұл қалалар арасындағы жалпыланған бағыт, нақты жазылған трек емес.",
      "This is a generalized direction between cities, not a recorded exact track."
    ),
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    id: "claim-steppe-demo-status",
    subjectType: "environment",
    subjectId: "southern-steppe-medieval-demo",
    predicate: "environmental_state",
    valueType: "status",
    value: { status: "educational_reconstruction" },
    labels: tr(
      "Природная зона является образовательной схемой и требует научной проверки",
      "Табиғи аймақ — ғылыми тексеруді қажет ететін оқу схемасы",
      "The environment zone is an educational diagram requiring scholarly review"
    ),
    sourceIds: ["qhm-p1c-educational-overlay"],
    evidenceType: "educational_reconstruction",
    confidenceLevel: "low",
    verificationStatus: "needs_review",
    interpretationNotes: tr(
      "Схема не является детальной палеоклиматической реконструкцией.",
      "Схема егжей-тегжейлі палеоклиматтық реконструкция емес.",
      "The diagram is not a detailed palaeoclimate reconstruction."
    ),
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    id: "claim-change-1511-1521",
    subjectType: "historical_change",
    subjectId: "kazakh-khanate-1511-to-1521",
    predicate: "territorial_extent",
    valueType: "comparison",
    value: { fromYear: 1511, toYear: 1521, conclusion: "displayed_outlines_differ" },
    labels: tr(
      "Отображаемые контуры 1511 и 1521 годов различаются, но разница не доказывает точную динамику границ",
      "1511 және 1521 жылдардағы контурлар өзгеше, бірақ айырмашылық шекаралардың нақты динамикасын дәлелдемейді",
      "The displayed 1511 and 1521 outlines differ, but the difference does not prove exact border dynamics"
    ),
    sourceIds: ["e-history-kasym", "cambridge-kazakh-history"],
    evidenceType: "academic_interpretation",
    confidenceLevel: "low",
    verificationStatus: "needs_review",
    interpretationNotes: tr(
      "Геометрическая разница служит объектом анализа, а не самостоятельным источником.",
      "Геометриялық айырмашылық дербес дереккөз емес, талдау нысаны.",
      "The geometric difference is an object of analysis, not independent evidence."
    ),
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    id: "claim-overlay-educational",
    subjectType: "story",
    subjectId: "historical-evidence",
    predicate: "relationship",
    valueType: "archive_map_reference",
    value: { archiveMapId: "qhm-evidence-overlay-demo" },
    labels: tr(
      "Демонстрационная карта создана проектом для обучения анализу источников и не является архивным оригиналом",
      "Демонстрациялық картаны жоба дереккөздерді талдауды үйрету үшін жасаған және ол архивтік түпнұсқа емес",
      "The demonstration map was created by the project for source-analysis education and is not an archival original"
    ),
    sourceIds: ["qhm-p1c-educational-overlay"],
    evidenceType: "educational_reconstruction",
    confidenceLevel: "high",
    verificationStatus: "reviewed",
    interpretationNotes: tr(
      "Совпадение схемы с реконструкцией не доказывает точность исторических границ.",
      "Схеманың реконструкциямен сәйкес келуі тарихи шекаралардың дәлдігін дәлелдемейді.",
      "Alignment with the reconstruction does not prove historical border accuracy."
    ),
    reviewedBy: null,
    reviewedAt: null,
  },
];

export const getClaimsForSubject = (subjectType, subjectId) =>
  sourceClaims.filter(
    (claim) => claim.subjectType === subjectType && claim.subjectId === subjectId
  );
