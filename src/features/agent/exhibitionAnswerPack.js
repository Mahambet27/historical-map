import {
  compareYears,
  getMapAtYear,
  selectHistoricalEntity,
  showHistoricalEvent,
  showHistoricalPerson,
  showSources,
  showHistoricalChange,
  startHistoricalStory,
  openHistoricalComparison,
  toggleExhibitionLayer,
  selectHistoricalRoute,
  startRouteJourney,
  selectHistoricalPlace,
  showHistoricalGeography,
  startGeographyStory,
  showEvidence,
  showArchiveMaps,
  selectArchiveMap,
  startArchiveComparison,
  showReviewQueue,
  showDispute,
  startEvidenceStory,
  exportCitation,
  startLesson,
} from "./historicalAgentTools.js";

const tr = (ru, kk, en) => ({ ru, kk, en });

export const exhibitionAnswerPack = [
  {
    id: "formation",
    label: tr("Показать образование Казахского ханства", "Қазақ хандығының құрылуын көрсету", "Show the formation of the Kazakh Khanate"),
    answer: tr("Перехожу к принятой датировке 1465–1466 годов. Контур — научная реконструкция, а не точная официальная граница.", "1465–1466 жылдарға өтіп жатырмын. Шекара — ғылыми реконструкция, ресми дәл шекара емес.", "Moving to the conventional 1465–1466 chronology. The outline is a scholarly reconstruction, not an exact official border."),
    actions: [getMapAtYear(1465), selectHistoricalEntity("kazakh-khanate"), showHistoricalEvent("formation-kazakh-khanate")],
  },
  {
    id: "kasym",
    label: tr("Показать территорию при Касым хане", "Қасым хан тұсындағы аумақты көрсету", "Show the territory under Kasym Khan"),
    answer: tr("Показываю период 1511–1521 годов. Расширенный контур имеет низкий уровень точности и обозначен как приблизительный.", "1511–1521 жылдар көрсетілді. Кеңейтілген аумақтың дәлдігі төмен және шамамен берілген.", "Showing 1511–1521. The expanded outline has low confidence and is explicitly approximate."),
    actions: [getMapAtYear(1511), selectHistoricalEntity("kazakh-khanate"), showHistoricalPerson("kasym-khan")],
  },
  {
    id: "compare",
    label: tr("Сравнить 1465 и 1511 годы", "1465 және 1511 жылдарды салыстыру", "Compare 1465 and 1511"),
    answer: tr("Открываю сохранённое сравнение двух реконструкций. Оно показывает различие охвата, но не делает новых исторических выводов.", "Екі реконструкцияның дайын салыстыруын ашамын. Ол аумақ айырмасын көрсетеді, бірақ жаңа тарихи қорытынды жасамайды.", "Opening the curated comparison of two reconstructions. It shows differences in extent without generating new historical conclusions."),
    actions: [compareYears(1465, 1511)],
  },
  {
    id: "grade-seven",
    label: tr("Объяснить ученику 7 класса", "7-сынып оқушысына түсіндіру", "Explain for a Grade 7 student"),
    answer: tr("Ханство возникло, когда Керей и Жанибек с группами населения создали новое политическое объединение в Жетысу. Историки сопоставляют хроники и археологические данные, поэтому границы показываются приблизительно.", "Керей мен Жәнібек бастаған топтар Жетісуда жаңа саяси бірлестік құрды. Тарихшылар жазбалар мен археологиялық деректерді салыстырады, сондықтан шекаралар шамамен көрсетіледі.", "The Khanate emerged when groups led by Kerei and Janibek formed a new polity in Zhetysu. Historians compare chronicles and archaeology, so boundaries are approximate."),
    actions: [getMapAtYear(1465), selectHistoricalEntity("kazakh-khanate")],
  },
  {
    id: "people",
    label: tr("Показать связанных личностей", "Байланысты тұлғаларды көрсету", "Show related people"),
    answer: tr("Для первого этапа важны Керей и Жанибек; для периода укрепления — Касым хан.", "Алғашқы кезеңде Керей мен Жәнібек, ал нығаю кезеңінде Қасым хан маңызды.", "Kerei and Janibek are central to the foundation; Kasym Khan to the consolidation period."),
    actions: [selectHistoricalEntity("kazakh-khanate"), showHistoricalPerson("kasym-khan")],
  },
  {
    id: "events",
    label: tr("Показать связанные события", "Байланысты оқиғаларды көрсету", "Show related events"),
    answer: tr("На шкале отмечены образование ханства и его укрепление при Касым хане.", "Шкалада хандықтың құрылуы мен Қасым хан тұсындағы нығаюы белгіленген.", "The timeline marks the Khanate’s formation and consolidation under Kasym Khan."),
    actions: [showHistoricalEvent("formation-kazakh-khanate")],
  },
  {
    id: "sources",
    label: tr("Показать научные источники", "Ғылыми дереккөздерді көрсету", "Show academic sources"),
    answer: tr("Открываю список источников и их редакционные статусы.", "Дереккөздер мен олардың редакциялық мәртебелерін ашамын.", "Opening the sources and their editorial status."),
    actions: [showSources("entity", "kazakh-khanate")],
  },
  {
    id: "quiz",
    label: tr("Создать мини-викторину", "Шағын викторина жасау", "Start a mini-quiz"),
    answer: tr("Открываю мини-урок с тремя вопросами для размышления.", "Үш ойлану сұрағы бар шағын сабақты ашамын.", "Opening the mini-lesson with three reasoning questions."),
    actions: [startLesson("formation-kazakh-khanate")],
  },
  {
    id: "independence",
    label: tr("Перейти к независимому Казахстану", "Тәуелсіз Қазақстанға өту", "Go to independent Kazakhstan"),
    answer: tr("Перехожу к 1991 году и Конституционному закону о государственной независимости.", "1991 жылға және мемлекеттік тәуелсіздік туралы Конституциялық заңға өтемін.", "Moving to 1991 and the Constitutional Law on State Independence."),
    actions: [getMapAtYear(1991), selectHistoricalEntity("republic-kazakhstan")],
  },
  {
    id: "why-map-changed",
    label: tr("Почему карта изменилась?", "Карта неге өзгерді?", "Why did the map change?"),
    answer: tr(
      "Открываю курированное объяснение перехода 1465 → 1511. Причины и последствия взяты только из локального набора источников.",
      "1465 → 1511 ауысуының іріктелген түсіндірмесін ашамын. Себептер мен салдар тек жергілікті дереккөздер жинағынан алынған.",
      "Opening the curated explanation for 1465 → 1511. Causes and consequences come only from the local source pack."
    ),
    actions: [showHistoricalChange("kazakh-khanate-1465-to-1511")],
  },
  {
    id: "compare-p1a",
    label: tr("Сравни 1465 и 1511 годы", "1465 және 1511 жылдарды салыстыр", "Compare 1465 and 1511"),
    answer: tr(
      "Открываю наложение двух реконструкций. Режим «Изменения» вычисляется локально и не считается историческим доказательством.",
      "Екі реконструкцияның қабаттасуын ашамын. «Өзгерістер» режимі жергілікті есептеледі және тарихи дәлел болып саналмайды.",
      "Opening the overlay of two reconstructions. Changes mode is computed locally and is not treated as historical evidence."
    ),
    actions: [openHistoricalComparison(1465, 1511)],
  },
  {
    id: "start-khanate-story",
    label: tr("Запусти историю Казахского ханства", "Қазақ хандығы тарихын баста", "Start the Kazakh Khanate story"),
    answer: tr(
      "Запускаю локальную образовательную историю для 7 класса. Она работает без AI и Supabase.",
      "7-сыныпқа арналған жергілікті білім беру тарихын бастаймын. Ол AI және Supabase-сыз жұмыс істейді.",
      "Starting the local Grade 7 educational story. It works without AI or Supabase."
    ),
    actions: [startHistoricalStory("formation-and-consolidation-kazakh-khanate")],
  },
  {
    id: "show-expansion-causes",
    label: tr("Покажи причины расширения", "Кеңею себептерін көрсет", "Show causes of expansion"),
    answer: tr(
      "Показываю курированную секцию причин. Она связывает переход с периодом правления Касым хана, не выводя причины из геометрии.",
      "Іріктелген себептер бөлімін көрсетемін. Ол ауысуды Қасым хан билігі кезеңімен байланыстырады, бірақ себептерді геометриядан шығармайды.",
      "Showing the curated causes section. It links the transition to Kasym Khan’s reign without deriving causes from geometry."
    ),
    actions: [showHistoricalChange("kazakh-khanate-1465-to-1511", "causes")],
  },
  {
    id: "show-change-consequences",
    label: tr("Покажи последствия", "Салдарын көрсет", "Show consequences"),
    answer: tr(
      "Открываю курированные последствия, связанные с усилением политического влияния и расширением связей.",
      "Саяси ықпал мен байланыстардың күшеюіне қатысты іріктелген салдарды ашамын.",
      "Opening the curated consequences associated with stronger political influence and wider relations."
    ),
    actions: [showHistoricalChange("kazakh-khanate-1465-to-1511", "consequences")],
  },
  {
    id: "show-change-sources",
    label: tr("Покажи источники этого изменения", "Осы өзгерістің дереккөздерін көрсет", "Show sources for this change"),
    answer: tr(
      "Открываю объяснение и его список проверенных локальных источников.",
      "Түсіндірме мен оның тексерілген жергілікті дереккөздер тізімін ашамын.",
      "Opening the explanation and its reviewed local source list."
    ),
    actions: [showHistoricalChange("kazakh-khanate-1465-to-1511", "sources")],
  },
  {
    id: "show-silk-road",
    label: tr("Покажи Великий Шёлковый путь", "Ұлы Жібек жолын көрсет", "Show the Silk Road"),
    answer: tr("Открываю реконструированное направление и исторические города.", "Реконструкцияланған бағыт пен тарихи қалаларды ашамын.", "Opening the reconstructed direction and historical cities."),
    actions: [toggleExhibitionLayer("tradeRoutes", true), toggleExhibitionLayer("historicalPlaces", true), selectHistoricalRoute("silk-road-southern-kazakhstan")],
  },
  {
    id: "show-historical-cities",
    label: tr("Покажи исторические города", "Тарихи қалаларды көрсет", "Show historical cities"),
    answer: tr("Включаю локальный слой исторических городов.", "Тарихи қалалардың жергілікті қабатын қосамын.", "Enabling the local historical cities layer."),
    actions: [toggleExhibitionLayer("historicalPlaces", true)],
  },
  {
    id: "why-otrar-important",
    label: tr("Почему Отырар был важен?", "Отырар неге маңызды болды?", "Why was Otrar important?"),
    answer: tr("Открываю курированную панель географии Отырара без автоматических выводов.", "Автоматты қорытындысыз Отырар географиясының іріктелген панелін ашамын.", "Opening the curated Otrar geography panel without generated claims."),
    actions: [selectHistoricalPlace("otrar"), showHistoricalGeography("place", "otrar")],
  },
  {
    id: "cities-on-routes",
    label: tr("Какие города находились на торговых маршрутах?", "Сауда бағыттарында қандай қалалар болды?", "Which cities were on trade routes?"),
    answer: tr("Показываю города, связанные с локальной реконструкцией маршрута.", "Жергілікті бағыт реконструкциясымен байланысты қалаларды көрсетемін.", "Showing cities linked to the local route reconstruction."),
    actions: [toggleExhibitionLayer("historicalPlaces", true), selectHistoricalRoute("silk-road-southern-kazakhstan")],
  },
  {
    id: "show-period-water",
    label: tr("Покажи водоёмы выбранного периода", "Таңдалған кезеңнің су айдындарын көрсет", "Show water bodies for this period"),
    answer: tr("Включаю временной слой гидрологии; демонстрационные контуры помечены для проверки.", "Гидрологияның уақыттық қабатын қосамын; демонстрациялық контурлар тексеруге белгіленген.", "Enabling temporal hydrology; demonstration outlines are marked for review."),
    actions: [toggleExhibitionLayer("hydrology", true)],
  },
  {
    id: "show-environment",
    label: tr("Покажи природную среду", "Табиғи ортаны көрсет", "Show the environment"),
    answer: tr("Включаю небольшие учебные природные зоны.", "Шағын оқу табиғи аймақтарын қосамын.", "Enabling the small educational environment zones."),
    actions: [toggleExhibitionLayer("environment", true)],
  },
  {
    id: "start-silk-journey",
    label: tr("Запусти путешествие по Шёлковому пути", "Жібек жолы саяхатын баста", "Start the Silk Road journey"),
    answer: tr("Запускаю пошаговое локальное путешествие.", "Жергілікті қадамдық саяхатты бастаймын.", "Starting the local step-by-step journey."),
    actions: [startRouteJourney("silk-road-southern-kazakhstan")],
  },
  {
    id: "start-geography-lesson",
    label: tr("Запусти урок о географии и городах", "География мен қалалар туралы сабақты баста", "Start the geography and cities lesson"),
    answer: tr("Запускаю локальную историю для 7–8 класса.", "7–8 сыныпқа арналған жергілікті тарихты бастаймын.", "Starting the local Grade 7–8 story."),
    actions: [startGeographyStory()],
  },
  {
    id: "hide-routes",
    label: tr("Скрыть маршруты", "Бағыттарды жасыру", "Hide routes"),
    answer: tr("Скрываю маршрутные слои.", "Бағыт қабаттарын жасырамын.", "Hiding route layers."),
    actions: [toggleExhibitionLayer("tradeRoutes", false), toggleExhibitionLayer("nomadicRoutes", false), toggleExhibitionLayer("militaryRoutes", false)],
  },
  {
    id: "reset-layers",
    label: tr("Сбросить слои", "Қабаттарды қалпына келтіру", "Reset layers"),
    answer: tr("Возвращаю стандартный набор слоёв.", "Қабаттардың әдепкі жинағын қайтарамын.", "Restoring the default layer set."),
    actions: [toggleExhibitionLayer("__reset__", true)],
  },
  {
    id: "why-reconstructed-border",
    label: tr("Почему эта граница считается реконструкцией?", "Неліктен бұл шекара реконструкция болып саналады?", "Why is this boundary a reconstruction?"),
    answer: tr("Открываю claim о контуре 1465 года. Источники дают исторический контекст, но не подтверждают каждую вершину полигона.", "1465 жылғы контур туралы claim-ді ашамын. Дереккөздер тарихи мәнмәтін береді, бірақ полигонның әр төбесін растамайды.", "Opening the 1465 geometry claim. Sources provide context but do not validate every polygon vertex."),
    actions: [showEvidence("geometry", "khanate-1465")],
  },
  {
    id: "entity-evidence-sources",
    label: tr("Какие источники подтверждают выбранное государство?", "Таңдалған мемлекетті қандай дереккөздер растайды?", "Which sources support the selected state?"),
    answer: tr("Показываю только claims, связанные с Казахским ханством, и ограничения их источников.", "Қазақ хандығына қатысты claims пен олардың дереккөз шектеулерін көрсетемін.", "Showing only claims linked to the Kazakh Khanate and their source limitations."),
    actions: [showEvidence("entity", "kazakh-khanate")],
  },
  {
    id: "show-evidence",
    label: tr("Покажи доказательства", "Дәлелдерді көрсет", "Show evidence"),
    answer: tr("Открываю локальную панель доказательств без автоматического научного вывода.", "Автоматты ғылыми қорытындысыз жергілікті дәлелдер панелін ашамын.", "Opening the local evidence panel without an automated scholarly conclusion."),
    actions: [showEvidence("entity", "kazakh-khanate")],
  },
  {
    id: "show-archive-maps",
    label: tr("Покажи архивные карты", "Архив карталарын көрсет", "Show archive maps"),
    answer: tr("Открываю каталог. Полноразмерно доступна только собственная учебная реконструкция.", "Каталогты ашамын. Толық өлшемде тек жобаның оқу реконструкциясы қолжетімді.", "Opening the catalogue. Only the project-owned educational reconstruction is available full-size."),
    actions: [showArchiveMaps()],
  },
  {
    id: "compare-archive",
    label: tr("Сравни архивную карту и реконструкцию", "Архив картасы мен реконструкцияны салыстыр", "Compare an archive map and reconstruction"),
    answer: tr("Запускаю учебное swipe-сравнение. Совмещение не доказывает точность границ.", "Оқу swipe-салыстыруын бастаймын. Беттестіру шекара дәлдігін дәлелдемейді.", "Starting the educational swipe comparison. Alignment does not prove boundary accuracy."),
    actions: [selectArchiveMap("qhm-evidence-overlay-demo"), startArchiveComparison("qhm-evidence-overlay-demo")],
  },
  {
    id: "show-review-materials",
    label: tr("Какие материалы требуют проверки?", "Қандай материалдар тексеруді қажет етеді?", "Which materials require review?"),
    answer: tr("Открываю локальную очередь. Её действия не меняют исходные datasets.", "Жергілікті кезекті ашамын. Оның әрекеттері бастапқы datasets-ті өзгертпейді.", "Opening the local queue. Its actions do not mutate source datasets."),
    actions: [showReviewQueue()],
  },
  {
    id: "show-disputes",
    label: tr("Покажи спорные версии", "Даулы нұсқаларды көрсет", "Show disputed interpretations"),
    answer: tr("В локальных источниках нет подтверждённой пары реальных позиций, поэтому показывается только demo-only структура.", "Жергілікті дереккөздерде расталған нақты екі позиция жоқ, сондықтан тек demo-only құрылым көрсетіледі.", "The local pack has no verified pair of real positions, so only a demo-only structure is shown."),
    actions: [showDispute("demo-geometry-interpretation-structure")],
  },
  {
    id: "start-evidence-lesson",
    label: tr("Запусти урок об исторических источниках", "Тарихи дереккөздер туралы сабақты баста", "Start the historical evidence lesson"),
    answer: tr("Запускаю локальный девятишаговый урок для 8–11 классов.", "8–11 сыныптарға арналған жергілікті тоғыз қадамдық сабақты бастаймын.", "Starting the local nine-step lesson for Grades 8–11."),
    actions: [startEvidenceStory()],
  },
  {
    id: "copy-source-citation",
    label: tr("Скопируй ссылку на источник", "Дереккөз сілтемесін көшір", "Copy a source citation"),
    answer: tr("Открываю безопасный локальный экспорт цитирования. Оформление нужно проверить перед научной публикацией.", "Қауіпсіз жергілікті дәйексөз экспортын ашамын. Ғылыми жарияланым алдында рәсімдеуді тексеру қажет.", "Opening local citation export. Formatting should be checked before scholarly publication."),
    actions: [exportCitation("e-history-kazakh-khanate")],
  },
  {
    id: "open-review-queue",
    label: tr("Открой очередь проверки", "Тексеру кезегін аш", "Open the review queue"),
    answer: tr("Открываю локальную очередь без авторизации и автоматической публикации.", "Авторизациясыз және автоматты жариялаусыз жергілікті кезекті ашамын.", "Opening the local queue without authentication or automatic publication."),
    actions: [showReviewQueue()],
  },
];
