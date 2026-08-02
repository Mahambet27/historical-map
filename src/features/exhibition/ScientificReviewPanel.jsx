import {
  getScientificReadiness,
  getScientificReadinessReason,
  getScientificWarnings,
} from "./scientificReadiness.js";
import {
  getSpatialPrecision,
  getSpatialPrecisionWarning,
} from "./spatialPrecision.js";

const downloadRecord = (record) => {
  const blob = new Blob([JSON.stringify(record, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${record.id}-scientific-review.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function ScientificReviewPanel({
  year,
  records,
  claims,
  language,
  onEvidence,
  onClose,
}) {
  const copy =
    language === "en"
      ? {
          title: "Scientific review",
          year: "Active year",
          sources: "Sources",
          claims: "Claims",
          evidence: "Open evidence",
          export: "Export record",
          copy: "Copy ID",
          close: "Close",
        }
      : {
          title: "Научная проверка",
          year: "Активный год",
          sources: "Источники",
          claims: "Утверждения",
          evidence: "Открыть доказательства",
          export: "Экспортировать запись",
          copy: "Скопировать ID",
          close: "Закрыть",
        };
  return (
    <section className="ex-panel ex-scientific-review" aria-labelledby="scientific-review-title">
      <header className="ex-panel__header">
        <div>
          <span className="ex-kicker">P2A.7 · read-only</span>
          <h2 id="scientific-review-title">{copy.title}</h2>
          <p>{copy.year}: {year}</p>
        </div>
        <button onClick={onClose} aria-label={copy.close}>×</button>
      </header>
      <div className="ex-scientific-review__records">
        {records.map((record) => {
          const recordClaims = claims.filter(
            (claim) =>
              claim.subjectId === record.id ||
              claim.subjectId === record.entityId
          );
          return (
            <article key={record.id} data-readiness={getScientificReadiness(record)}>
              <code>{record.id}</code>
              <h3>{getScientificReadiness(record)}</h3>
              <p>{getScientificReadinessReason(record, language)}</p>
              <dl>
                <div><dt>Spatial precision</dt><dd>{getSpatialPrecision(record)}</dd></div>
                <div><dt>{copy.sources}</dt><dd>{record.sourceIds?.length || 0}</dd></div>
                <div><dt>{copy.claims}</dt><dd>{recordClaims.length}</dd></div>
              </dl>
              {getSpatialPrecisionWarning(record, language) && (
                <p className="ex-scientific-warning">{getSpatialPrecisionWarning(record, language)}</p>
              )}
              {getScientificWarnings(record, language).map((warning) => (
                <p className="ex-scientific-warning" key={warning}>{warning}</p>
              ))}
              <div className="ex-scientific-review__actions">
                <button onClick={() => onEvidence?.("geometry", record.id)}>{copy.evidence}</button>
                <button onClick={() => downloadRecord(record)}>{copy.export}</button>
                <button onClick={() => navigator.clipboard?.writeText(record.id)}>{copy.copy}</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

