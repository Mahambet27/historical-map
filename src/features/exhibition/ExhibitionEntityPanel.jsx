import { getSourcesByIds } from "../../services/historicalSourcesService.js";
import { historicalPeople } from "../../data/exhibition/people.js";

const local = (value, language) => value?.[language] || value?.ru || "";

export default function ExhibitionEntityPanel({ entity, language, text, onClose, onCompare, onLesson, onSources, onEvidence }) {
  if (!entity) return null;
  const people = historicalPeople.filter((person) => entity.people.includes(person.id));
  const sourceCount = getSourcesByIds(entity.sourceIds).length;
  return (
    <section className="ex-panel ex-entity-panel">
      <header className="ex-panel__header">
        <div><span className="ex-kicker">{text.entity}</span><h2>{local(entity.names, language)}</h2></div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      <div className="ex-entity-panel__period"><span>{text.period}</span><strong>{Math.abs(entity.startYear)}{entity.startYear < 0 ? " BCE" : ""}—{entity.endYear || "…"}</strong><i className={`confidence confidence--${entity.confidenceLevel}`}>{entity.confidenceLevel}</i>{entity.verificationStatus === "needs_review" && <i className="confidence confidence--low">{text.needsReview}</i>}</div>
      <p className="ex-panel__lead">{local(entity.descriptions, language)}</p>
      <dl className="ex-details">
        <div><dt>{text.origins}</dt><dd>{local(entity.origins, language)}</dd></div>
        <div><dt>{text.capitals}</dt><dd>{entity.capitals.map((item) => local(item, language)).join(" · ") || "—"}</dd></div>
        <div><dt>{text.people}</dt><dd>{people.map((person) => local(person.names, language)).join(" · ") || "—"}</dd></div>
        <div><dt>{text.stages}</dt><dd>{local(entity.stages, language)}</dd></div>
        <div><dt>{text.neighbours}</dt><dd>{entity.neighbours.map((item) => local(item, language)).join(" · ") || "—"}</dd></div>
      </dl>
      <div className="ex-evidence-actions">
        <button className="ex-source-link" onClick={onSources}>▤ {text.verified.replace("{count}", sourceCount)} <span>→</span></button>
        <button className="ex-source-link" onClick={onEvidence}>◇ {language === "en" ? "Show evidence" : language === "kk" ? "Дәлелдерді көрсету" : "Показать доказательства"}</button>
      </div>
      <div className="ex-panel__actions"><button onClick={onCompare}>⇄ {text.compare}</button><button className="is-primary" onClick={onLesson}>◫ {text.startLesson}</button></div>
    </section>
  );
}
