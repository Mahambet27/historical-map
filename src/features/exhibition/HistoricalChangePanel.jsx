import { useEffect, useRef } from "react";
import { historicalEvents } from "../../data/exhibition/events.js";
import { historicalPeople } from "../../data/exhibition/people.js";
import { getSourcesByIds } from "../../services/historicalSourcesService.js";
import { recordExhibitionMetric } from "./performanceTelemetry.js";

const local = (value, language) => value?.[language] || value?.ru || "";
const byId = (items) => new Map(items.map((entry) => [entry.id, entry]));
const peopleById = byId(historicalPeople);
const eventsById = byId(historicalEvents);

const statusLabel = {
  reviewed: { ru: "Проверено редакционно", kk: "Редакциялық тексерілген", en: "Editorially reviewed" },
  verified: { ru: "Подтверждено первичным источником", kk: "Бастапқы дереккөзбен расталған", en: "Verified by a primary source" },
  needs_review: { ru: "Требуется научная проверка", kk: "Ғылыми тексеру қажет", en: "Scholarly review required" },
};

const directionLabel = {
  expanded: { ru: "Территория расширилась", kk: "Аумақ кеңейді", en: "Territory expanded" },
  contracted: { ru: "Территория сократилась", kk: "Аумақ қысқарды", en: "Territory contracted" },
  changed: { ru: "Состояние изменилось", kk: "Күй өзгерді", en: "State changed" },
};

export default function HistoricalChangePanel({
  change,
  language,
  mode = "expanded",
  text,
  onClose,
  onSources,
  onComparison,
  onEvent,
  onPerson,
  onEvidence,
  focusSection,
}) {
  const causesRef = useRef(null);
  const consequencesRef = useRef(null);
  useEffect(() => {
    const target =
      focusSection === "causes"
        ? causesRef.current
        : focusSection === "consequences"
          ? consequencesRef.current
          : null;
    if (!target) return undefined;
    const frame = requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start", behavior: "auto" });
      target.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusSection]);
  if (!change) return null;
  const sources = getSourcesByIds(change.sourceIds);
  const status = statusLabel[change.verificationStatus] || statusLabel.needs_review;
  const openSources = () => {
    recordExhibitionMetric("historical_change_source_opened", 1, {
      changeId: change.id,
      sourceCount: sources.length,
    });
    onSources?.(change.sourceIds);
  };
  return (
    <section
      className={`ex-panel ex-change-panel ex-change-panel--${mode}`}
      aria-labelledby="historical-change-title"
    >
      <header className="ex-panel__header">
        <div>
          <span className="ex-kicker">
            {change.displayFromYear} → {change.displayToYear}
          </span>
          <h2 id="historical-change-title">
            {language === "en"
              ? "Why did the map change?"
              : language === "kk"
                ? "Карта неге өзгерді?"
                : "Почему изменилась карта"}
          </h2>
        </div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>
          ×
        </button>
      </header>

      <h3>{local(change.titles, language)}</h3>
      <p className="ex-panel__lead">{local(change.summaries, language)}</p>
      {change.geometryComparison?.screenReaderDescription && (
        <p className="sr-only">
          {local(change.geometryComparison.screenReaderDescription, language)}
        </p>
      )}
      <div className="ex-change-status">
        <span data-status={change.verificationStatus}>{local(status, language)}</span>
        <span>{change.confidenceLevel}</span>
        <span>{sources.length} {language === "en" ? "sources" : language === "kk" ? "дереккөз" : "источника"}</span>
      </div>

      <section>
        <h3>{language === "en" ? "What changed" : language === "kk" ? "Не өзгерді" : "Что изменилось"}</h3>
        <div className="ex-change-cards">
          {change.changes.map((entry) => (
            <article key={entry.id} data-status={entry.verificationStatus}>
              <span>{local(directionLabel[entry.displayDirection] || directionLabel.changed, language)}</span>
              <strong>{local(entry.titles, language)}</strong>
              <p>{local(entry.descriptions, language)}</p>
              <small>{entry.confidenceLevel} · {local(statusLabel[entry.verificationStatus], language)}</small>
            </article>
          ))}
        </div>
      </section>

      <section
        ref={causesRef}
        tabIndex="-1"
        data-change-section="causes"
      >
        <h3>{language === "en" ? "Why it happened" : language === "kk" ? "Неге болды" : "Почему произошло"}</h3>
        {change.causes.map((cause) => (
          <article className="ex-change-explanation" key={cause.id}>
            <strong>{local(cause.titles, language)}</strong>
            <p>{local(cause.descriptions, language)}</p>
            <small>{local(statusLabel[cause.verificationStatus], language)} · {cause.sourceIds.length}</small>
          </article>
        ))}
      </section>

      {change.relatedPersonIds.length > 0 && (
        <section>
          <h3>{language === "en" ? "Key people" : language === "kk" ? "Негізгі тұлғалар" : "Ключевые личности"}</h3>
          <div className="ex-change-links">
            {change.relatedPersonIds.map((id) => {
              const person = peopleById.get(id);
              return person ? (
                <button key={id} onClick={() => onPerson?.(person)}>
                  ◇ {local(person.names, language)}
                </button>
              ) : null;
            })}
          </div>
        </section>
      )}

      <section>
        <h3>{language === "en" ? "Related events" : language === "kk" ? "Байланысты оқиғалар" : "Связанные события"}</h3>
        <div className="ex-change-links">
          {change.relatedEventIds.map((id) => {
            const event = eventsById.get(id);
            return event ? (
              <button key={id} onClick={() => onEvent?.(event)}>
                ◷ {local(event.titles, language)}
              </button>
            ) : null;
          })}
        </div>
      </section>

      <section
        ref={consequencesRef}
        tabIndex="-1"
        data-change-section="consequences"
      >
        <h3>{language === "en" ? "Consequences" : language === "kk" ? "Салдары" : "Последствия"}</h3>
        {change.consequences.map((consequence) => (
          <article className="ex-change-explanation" key={consequence.id}>
            <strong>{local(consequence.titles, language)}</strong>
            <p>{local(consequence.descriptions, language)}</p>
            <small>{local(statusLabel[consequence.verificationStatus], language)} · {consequence.sourceIds.length}</small>
          </article>
        ))}
      </section>

      <div className="ex-disclaimer">
        ⓘ {language === "en"
          ? "Historical reconstruction and source-based interpretation; geometric difference is not independent evidence."
          : language === "kk"
            ? "Тарихи реконструкция және дереккөздерге негізделген түсіндіру; геометриялық айырма жеке дәлел емес."
            : "Историческая реконструкция и интерпретация на основании источников; геометрическая разница не является самостоятельным доказательством."}
      </div>
      <div className="ex-panel__actions">
        <button onClick={openSources}>▤ {language === "en" ? "Sources" : language === "kk" ? "Дереккөздер" : "Источники"}</button>
        <button onClick={onEvidence}>◇ {language === "en" ? "Evidence" : language === "kk" ? "Дәлелдер" : "Доказательства"}</button>
        <button className="is-primary" onClick={() => onComparison?.(change)}>
          ⇄ {language === "en" ? "Start comparison" : language === "kk" ? "Салыстыруды бастау" : "Запустить сравнение"}
        </button>
      </div>
    </section>
  );
}
