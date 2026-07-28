const tr = (ru, kk, en) => ({ ru, kk, en });
export const lessons = [
  {
    id: "formation-kazakh-khanate",
    grade: 7,
    durationMinutes: 12,
    title: tr("Образование и развитие Казахского ханства", "Қазақ хандығының құрылуы мен дамуы", "Formation and development of the Kazakh Khanate"),
    objective: tr("Сопоставить географию, события и источники 1465 и 1511 годов.", "1465 және 1511 жылдардағы географияны, оқиғалар мен дереккөздерді салыстыру.", "Compare geography, events and evidence in 1465 and 1511."),
    stateIds: ["kazakh-khanate-1465", "kasym-khan-1511", "independence-1991"],
    objectIds: ["chu-valley", "saraishyk"],
    personIds: ["kerei-khan", "kasym-khan"],
    questions: [
      tr("Какие географические факторы могли влиять на расположение политических центров?", "Саяси орталықтардың орналасуына қандай географиялық факторлар әсер етуі мүмкін?", "Which geographic factors may have influenced political centres?"),
      tr("Чем реконструкция территории 1465 года отличается от периода Касым хана?", "1465 жылғы аумақ реконструкциясы Қасым хан кезеңінен несімен ерекшеленеді?", "How does the 1465 reconstruction differ from the period of Kasym Khan?"),
      tr("Почему исторические границы показываются приблизительно?", "Неліктен тарихи шекаралар шамамен көрсетіледі?", "Why are historical borders shown approximately?"),
    ],
    assignment: tr("Назовите два вида источников, которые помогли бы уточнить историческую карту.", "Тарихи картаны нақтылауға көмектесетін екі дереккөз түрін атаңыз.", "Name two types of evidence that could refine a historical map."),
  },
];
