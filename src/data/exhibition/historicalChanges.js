const tr = (ru, kk, en) => ({ ru, kk, en });

const item = ({
  id,
  titles,
  descriptions,
  sourceIds,
  confidenceLevel = "medium",
  verificationStatus = "reviewed",
}) => ({
  id,
  titles,
  descriptions,
  sourceIds,
  confidenceLevel,
  verificationStatus,
});

export const historicalChanges = [
  {
    id: "kazakh-khanate-1465-to-1511",
    fromYear: 1465,
    toYear: 1511,
    entityIds: ["kazakh-khanate"],
    titles: tr(
      "Образование и укрепление Казахского ханства",
      "Қазақ хандығының құрылуы мен нығаюы",
      "Formation and consolidation of the Kazakh Khanate"
    ),
    summaries: tr(
      "Между двумя курированными состояниями меняются правитель и отображаемый охват реконструированной территории. Источники связывают начало XVI века с укреплением политического влияния ханства при Касым хане.",
      "Екі іріктелген күй арасында билеуші мен реконструкцияланған аумақтың көрсетілген қамтуы өзгереді. Дереккөздер XVI ғасырдың басын Қасым хан тұсындағы хандықтың саяси ықпалының нығаюымен байланыстырады.",
      "Between the two curated states, leadership and the displayed extent of the reconstructed territory change. Sources associate the early 16th century with stronger political influence under Kasym Khan."
    ),
    changeTypes: [
      "territorial-expansion",
      "political-consolidation",
      "leadership-change",
    ],
    changes: [
      item({
        id: "displayed-territory-expanded-1511",
        titles: tr(
          "Отображаемая территория расширилась",
          "Көрсетілген аумақ кеңейді",
          "Displayed territory expanded"
        ),
        descriptions: tr(
          "Реконструкция 1511 года имеет больший визуальный охват, чем реконструкция 1465 года. Это сравнение условных контуров, а не точных государственных границ.",
          "1511 жылғы реконструкция 1465 жылғы реконструкцияға қарағанда кеңірек көрсетілген. Бұл нақты мемлекеттік шекаралар емес, шартты контурларды салыстыру.",
          "The 1511 reconstruction has a broader displayed extent than the 1465 reconstruction. This compares interpretive outlines, not exact state borders."
        ),
        sourceIds: ["e-history-kasym", "cambridge-kazakh-history"],
      }),
      item({
        id: "leadership-kasym-1511",
        titles: tr(
          "Изменилось руководство",
          "Басшылық өзгерді",
          "Leadership changed"
        ),
        descriptions: tr(
          "Состояние 1511 года относится к началу правления Касым хана.",
          "1511 жылғы күй Қасым хан билігінің басталуына жатады.",
          "The 1511 state represents the beginning of Kasym Khan’s reign."
        ),
        sourceIds: ["e-history-kasym"],
        confidenceLevel: "high",
      }),
    ].map((entry, index) => ({
      ...entry,
      type: index === 0 ? "territory" : "leadership",
      direction: index === 0 ? "expanded" : "changed",
    })),
    causes: [
      item({
        id: "kasym-reign-consolidation",
        titles: tr(
          "Начало правления Касым хана",
          "Қасым хан билігінің басталуы",
          "Beginning of Kasym Khan’s reign"
        ),
        descriptions: tr(
          "Курированный источник выделяет 1511–1521 годы как период правления Касым хана и укрепления ханства.",
          "Іріктелген дереккөз 1511–1521 жылдарды Қасым ханның билігі мен хандықтың нығаю кезеңі ретінде көрсетеді.",
          "The curated source identifies 1511–1521 as Kasym Khan’s reign and a period of consolidation."
        ),
        sourceIds: ["e-history-kasym", "cambridge-kazakh-history"],
      }),
    ],
    consequences: [
      item({
        id: "stronger-political-influence",
        titles: tr(
          "Усиление политического влияния",
          "Саяси ықпалдың күшеюі",
          "Stronger political influence"
        ),
        descriptions: tr(
          "Источники характеризуют период Касым хана как этап укрепления политического влияния и расширения связей ханства.",
          "Дереккөздер Қасым хан кезеңін хандықтың саяси ықпалы мен байланыстары күшейген кезең ретінде сипаттайды.",
          "Sources describe Kasym Khan’s period as one of stronger political influence and wider relations."
        ),
        sourceIds: ["e-history-kasym", "cambridge-kazakh-history"],
      }),
    ],
    relatedEventIds: ["formation-kazakh-khanate", "kasym-khan-consolidation"],
    relatedPersonIds: ["kerei-khan", "janibek-khan", "kasym-khan"],
    relatedPlaceIds: ["chu-valley", "saraishyk", "turkistan"],
    sourceIds: [
      "e-history-kazakh-khanate",
      "e-history-kasym",
      "cambridge-kazakh-history",
    ],
    geometryComparison: {
      enabled: true,
      interpretationStatus: "curated",
      screenReaderDescription: tr(
        "Между 1465 и 1511 годами отображаемый охват реконструированной территории Казахского ханства увеличивается; направление изменения не утверждается.",
        "1465 және 1511 жылдар арасында Қазақ хандығының реконструкцияланған аумағының көрсетілген қамтуы ұлғаяды; өзгеріс бағыты туралы тұжырым жасалмайды.",
        "Between 1465 and 1511 the displayed extent of the reconstructed Kazakh Khanate territory increases; no directional claim is made."
      ),
    },
    verificationStatus: "reviewed",
    confidenceLevel: "medium",
  },
  {
    id: "kazakh-khanate-1511-to-1521",
    fromYear: 1511,
    toYear: 1521,
    entityIds: ["kazakh-khanate"],
    titles: tr(
      "Казахское ханство в период правления Касым хана",
      "Қасым хан билігі кезеңіндегі Қазақ хандығы",
      "The Kazakh Khanate during Kasym Khan’s reign"
    ),
    summaries: tr(
      "Сравнение показывает начало и поздний этап одного курированного периода 1511–1521 годов. Геометрии различаются, но не доказывают точную динамику границ.",
      "Салыстыру 1511–1521 жылдардағы бір іріктелген кезеңнің басы мен соңғы бөлігін көрсетеді. Геометриялар өзгеше, бірақ шекаралардың дәл өзгерісін дәлелдемейді.",
      "The comparison shows the beginning and later part of the same curated 1511–1521 period. The geometries differ but do not prove exact border dynamics."
    ),
    changeTypes: ["territorial-expansion", "political-consolidation"],
    changes: [
      {
        ...item({
          id: "displayed-territory-1511-1521",
          titles: tr(
            "Изменился отображаемый контур",
            "Көрсетілген контур өзгерді",
            "Displayed outline changed"
          ),
          descriptions: tr(
            "Две демонстрационные реконструкции имеют разный охват. Исторический смысл геометрической разницы требует научной проверки.",
            "Екі демонстрациялық реконструкцияның қамтуы әртүрлі. Геометриялық айырманың тарихи мағынасы ғылыми тексеруді қажет етеді.",
            "The two demonstration reconstructions have different extents. The historical meaning of the geometric difference requires scholarly review."
          ),
          sourceIds: ["e-history-kasym", "cambridge-kazakh-history"],
          confidenceLevel: "low",
          verificationStatus: "needs_review",
        }),
        type: "territory",
        direction: "expanded",
      },
    ],
    causes: [
      item({
        id: "continued-kasym-reign",
        titles: tr(
          "Продолжение правления Касым хана",
          "Қасым хан билігінің жалғасуы",
          "Continuation of Kasym Khan’s reign"
        ),
        descriptions: tr(
          "Оба года относятся к курированному периоду правления Касым хана.",
          "Екі жыл да Қасым хан билігінің іріктелген кезеңіне жатады.",
          "Both years belong to the curated period of Kasym Khan’s reign."
        ),
        sourceIds: ["e-history-kasym"],
        confidenceLevel: "high",
      }),
    ],
    consequences: [
      item({
        id: "consolidation-interpretation",
        titles: tr(
          "Интерпретация укрепления ханства",
          "Хандықтың нығаюын түсіндіру",
          "Interpretation of continued consolidation"
        ),
        descriptions: tr(
          "Связь между изменением контура и конкретными политическими последствиями не выводится автоматически.",
          "Контур өзгерісі мен нақты саяси салдар арасындағы байланыс автоматты түрде жасалмайды.",
          "No automatic claim is made linking the outline change to a specific political consequence."
        ),
        sourceIds: [],
        confidenceLevel: "low",
        verificationStatus: "needs_review",
      }),
    ],
    relatedEventIds: ["kasym-khan-consolidation"],
    relatedPersonIds: ["kasym-khan"],
    relatedPlaceIds: ["saraishyk", "turkistan"],
    sourceIds: ["e-history-kasym", "cambridge-kazakh-history"],
    geometryComparison: {
      enabled: true,
      interpretationStatus: "needs_review",
      screenReaderDescription: tr(
        "Реконструированные контуры 1511 и 1521 годов различаются; направление и историческая причина различия не утверждаются.",
        "1511 және 1521 жылдардағы реконструкцияланған контурлар әртүрлі; айырмашылықтың бағыты мен тарихи себебі туралы тұжырым жасалмайды.",
        "The reconstructed outlines for 1511 and 1521 differ; no directional or causal claim is asserted."
      ),
    },
    verificationStatus: "needs_review",
    confidenceLevel: "low",
  },
  {
    id: "kazakh-ssr-1936-to-independence-1991",
    fromYear: 1936,
    toYear: 1991,
    entityIds: ["kazakh-ssr", "republic-kazakhstan"],
    titles: tr(
      "От Казахской ССР к независимому Казахстану",
      "Қазақ КСР-інен тәуелсіз Қазақстанға",
      "From the Kazakh SSR to independent Kazakhstan"
    ),
    summaries: tr(
      "Между состояниями меняется государственно-правовой статус: союзная республика сменяется независимой Республикой Казахстан. Контур на демонстрационной карте почти не меняется, поэтому главное изменение — политико-правовое.",
      "Күйлер арасында мемлекеттік-құқықтық мәртебе өзгереді: одақтас республиканың орнына тәуелсіз Қазақстан Республикасы келеді. Демонстрациялық картадағы контур іс жүзінде өзгермейді, сондықтан негізгі өзгеріс саяси-құқықтық.",
      "The constitutional status changes from a Soviet union republic to the independent Republic of Kazakhstan. The demonstration outline is nearly unchanged, so the principal change is political and legal."
    ),
    changeTypes: ["legal-status-change", "sovereignty-change"],
    changes: [
      {
        ...item({
          id: "independent-state-status",
          titles: tr(
            "Изменился государственно-правовой статус",
            "Мемлекеттік-құқықтық мәртебе өзгерді",
            "Constitutional status changed"
          ),
          descriptions: tr(
            "16 декабря 1991 года Конституционный закон установил государственную независимость Республики Казахстан.",
            "1991 жылғы 16 желтоқсанда Конституциялық заң Қазақстан Республикасының мемлекеттік тәуелсіздігін белгіледі.",
            "On 16 December 1991 the Constitutional Law established the state independence of the Republic of Kazakhstan."
          ),
          sourceIds: ["adilet-independence-law"],
          confidenceLevel: "high",
          verificationStatus: "verified",
        }),
        type: "political-status",
        direction: "changed",
      },
    ],
    causes: [
      item({
        id: "constitutional-independence-law",
        titles: tr(
          "Принятие Конституционного закона",
          "Конституциялық заңның қабылдануы",
          "Adoption of the Constitutional Law"
        ),
        descriptions: tr(
          "Курированный официальный источник фиксирует юридическое оформление государственной независимости.",
          "Іріктелген ресми дереккөз мемлекеттік тәуелсіздіктің құқықтық рәсімделуін бекітеді.",
          "The curated official source records the legal establishment of state independence."
        ),
        sourceIds: ["adilet-independence-law"],
        confidenceLevel: "high",
        verificationStatus: "verified",
      }),
    ],
    consequences: [
      item({
        id: "independent-republic-and-un-membership",
        titles: tr(
          "Независимая республика и международное признание",
          "Тәуелсіз республика және халықаралық танылу",
          "Independent republic and international recognition"
        ),
        descriptions: tr(
          "Республика Казахстан стала независимым государством; 2 марта 1992 года она была принята в ООН.",
          "Қазақстан Республикасы тәуелсіз мемлекет болды; 1992 жылғы 2 наурызда БҰҰ-ға қабылданды.",
          "The Republic of Kazakhstan became an independent state and was admitted to the United Nations on 2 March 1992."
        ),
        sourceIds: ["adilet-independence-law", "un-kazakhstan"],
        confidenceLevel: "high",
        verificationStatus: "verified",
      }),
    ],
    relatedEventIds: ["kazakh-ssr-status", "independence-kazakhstan"],
    relatedPersonIds: [],
    relatedPlaceIds: ["almaty", "astana"],
    sourceIds: [
      "britannica-kazakhstan-history",
      "adilet-independence-law",
      "un-kazakhstan",
    ],
    geometryComparison: {
      enabled: true,
      interpretationStatus: "curated",
      screenReaderDescription: tr(
        "Реконструированный контур между 1936 и 1991 годами почти не меняется; основное показанное изменение относится к государственно-правовому статусу.",
        "1936 және 1991 жылдар арасында реконструкцияланған контур іс жүзінде өзгермейді; көрсетілген негізгі өзгеріс мемлекеттік-құқықтық мәртебеге қатысты.",
        "The reconstructed outline changes little between 1936 and 1991; the primary displayed change concerns constitutional status."
      ),
    },
    verificationStatus: "verified",
    confidenceLevel: "high",
  },
];

export const historicalChangeById = new Map(
  historicalChanges.map((change) => [change.id, change])
);

