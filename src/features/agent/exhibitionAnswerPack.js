import {
  compareYears,
  getMapAtYear,
  selectHistoricalEntity,
  showHistoricalEvent,
  showHistoricalPerson,
  showSources,
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
];
