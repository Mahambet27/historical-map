import { getPlaceNameAtYear } from "./historicalPlaceNames.js";

const local = (value, language) => value?.[language] || value?.ru || "";
const content = {
  ru: {
    kicker: "География и история",
    sections: [
      ["Почему это место было важно?", "Городские центры связывали речные долины, степные пространства и реконструированные торговые направления."],
      ["Как природная среда влияла на развитие?", "Вода, долины и доступные переходы создавали условия для поселений и передвижения; конкретное влияние зависит от периода."],
      ["Какие маршруты проходили рядом?", "Для выбранного объекта точная линия маршрута не подтверждена локальным набором."],
      ["Какие государства контролировали регион?", "Контроль менялся со временем; карта не переносит границы одного временного среза на другой."],
      ["Какие источники это подтверждают?", "Локальные источники подтверждают общий контекст; географические связи остаются интерпретацией."],
    ],
  },
  kk: {
    kicker: "География және тарих",
    sections: [
      ["Бұл орын неліктен маңызды болды?", "Қала орталықтары өзен аңғарларын, дала кеңістігін және реконструкцияланған сауда бағыттарын байланыстырды."],
      ["Табиғи орта дамуға қалай әсер етті?", "Су, аңғарлар және қолжетімді өткелдер қоныстану мен қозғалысқа жағдай жасады; нақты әсер кезеңге байланысты."],
      ["Жақын жерде қандай бағыттар өтті?", "Таңдалған нысан үшін бағыттың дәл сызығы жергілікті жинақпен расталмаған."],
      ["Аймақты қандай мемлекеттер бақылаған?", "Бақылау уақыт өте өзгерді; карта бір уақыт кесіндісінің шекарасын екіншісіне көшірмейді."],
      ["Мұны қандай дереккөздер растайды?", "Жергілікті дереккөздер жалпы мәнмәтінді қолдайды; географиялық байланыстар интерпретация болып қалады."],
    ],
  },
  en: {
    kicker: "Geography and history",
    sections: [
      ["Why was this place important?", "Urban centres connected river valleys, steppe spaces, and reconstructed trade directions."],
      ["How did environment influence development?", "Water, valleys, and accessible passages supported settlement and movement; the exact influence varied by period."],
      ["Which routes passed nearby?", "The local pack does not confirm one exact route line for the selected object."],
      ["Which states controlled the region?", "Control changed over time; the map does not transfer borders from one temporal slice to another."],
      ["Which sources support this?", "Local sources support the broader context; geographic links remain interpretive."],
    ],
  },
};

export default function HistoricalGeographyPanel({
  subject,
  route,
  year,
  language,
  text,
  onSources,
  onEvidence,
  onClose,
}) {
  if (!subject && !route) return null;
  const sourceIds = [...new Set([...(subject?.sourceIds || []), ...(route?.sourceIds || [])])];
  const title = subject
    ? getPlaceNameAtYear(subject, year, language)
    : local(route.names, language);
  const copy = content[language] || content.ru;
  const alternativeNames = subject
    ? [...new Set(subject.names.map((entry) => entry.value))].filter(
        (name) => name !== title
      )
    : [];
  return (
    <section className="ex-panel ex-geography-panel" aria-labelledby="geography-panel-title">
      <header className="ex-panel__header">
        <div>
          <span className="ex-kicker">{copy.kicker}</span>
          <h2 id="geography-panel-title">{title}</h2>
        </div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      {alternativeNames.length > 0 && (
        <p className="ex-panel__lead">
          {language === "en"
            ? "Historical name variants"
            : language === "kk"
              ? "Тарихи атау нұсқалары"
              : "Исторические варианты названия"}
          : {alternativeNames.join(", ")}
        </p>
      )}
      {copy.sections.map(([heading, body], index) => (
        <section key={heading}>
          <h3>{heading}</h3>
          <p>{index === 2 && route ? local(route.names, language) : body}</p>
        </section>
      ))}
      <div className="ex-disclaimer">ⓘ {language === "en" ? "Source-based interpretation; scholarly review is still required." : "Интерпретация на основании указанных источников; требуется научная проверка."}</div>
      <div className="ex-evidence-actions">
        <button onClick={() => onSources?.(sourceIds)}>▤ {text.sources}</button>
        <button onClick={onEvidence}>◇ {language === "en" ? "Evidence" : language === "kk" ? "Дәлелдер" : "Доказательства"}</button>
      </div>
    </section>
  );
}
