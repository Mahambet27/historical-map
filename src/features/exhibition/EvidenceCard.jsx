import { getEvidenceStatus } from "./evidenceStatusRegistry.js";

const local = (value, language) => value?.[language] || value?.ru || "";

const formatValue = (claim) => {
  if (claim.valueType === "year_range") return `${claim.value.startYear}–${claim.value.endYear}`;
  if (claim.valueType === "date") return `${claim.value.day}.${claim.value.month}.${claim.value.year}`;
  if (claim.value?.precision) return claim.value.precision;
  return claim.valueType;
};

export default function EvidenceCard({
  claim,
  sources,
  archiveMap,
  language,
  expanded,
  onToggle,
  onSource,
  onArchive,
  onCitation,
}) {
  const status = getEvidenceStatus(claim);
  return (
    <article className="ex-evidence-card" data-pattern={status.pattern}>
      <button className="ex-evidence-card__summary" onClick={onToggle} aria-expanded={expanded}>
        <span aria-hidden="true">{status.icon}</span>
        <span><strong>{local(claim.labels, language)}</strong><small>{local(status.label, language)} · {claim.confidenceLevel}</small></span>
        <span>{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <div className="ex-evidence-card__body">
          <dl>
            <div><dt>Value</dt><dd>{formatValue(claim)}</dd></div>
            <div><dt>Evidence</dt><dd>{claim.evidenceType}</dd></div>
            <div><dt>Verification</dt><dd>{claim.verificationStatus}</dd></div>
            <div><dt>Reviewed</dt><dd>{claim.reviewedAt || "—"}</dd></div>
          </dl>
          <p>{local(claim.interpretationNotes, language)}</p>
          <ul>{sources.map((source) => <li key={source.id}>{source.title}</li>)}</ul>
          <div className="ex-card-actions">
            <button onClick={() => onSource(claim.sourceIds)}>▤ Sources</button>
            <button onClick={() => onCitation(sources[0])}>⌁ Citation</button>
            {archiveMap && <button onClick={() => onArchive(archiveMap)}>▧ Archive map</button>}
          </div>
        </div>
      )}
    </article>
  );
}
