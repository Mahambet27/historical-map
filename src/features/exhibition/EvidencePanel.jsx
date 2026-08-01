import { useMemo, useState } from "react";
import EvidenceCard from "./EvidenceCard.jsx";
import { recordExhibitionMetric } from "./performanceTelemetry.js";

const local = (value, language) => value?.[language] || value?.ru || "";

export default function EvidencePanel({
  subjectType,
  subjectId,
  claims,
  sources,
  archiveMaps,
  disputes,
  language,
  text,
  onSource,
  onArchive,
  onCitation,
  onReview,
  onClose,
}) {
  const [openClaimId, setOpenClaimId] = useState(claims[0]?.id || null);
  const sourceById = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const relatedClaims = claims.filter((claim) => claim.subjectType === subjectType && claim.subjectId === subjectId);
  const relatedDisputes = disputes.filter((item) => item.subjectType === subjectType && item.subjectId === subjectId);
  const labels = language === "en"
    ? { title: "Evidence", asserted: "What is asserted", alternatives: "Alternative interpretations", unknown: "What remains unknown", reviewed: "Who and when reviewed", review: "Check status", empty: "No claim-level evidence has been curated for this item yet." }
    : language === "kk"
      ? { title: "Дәлелдер", asserted: "Не тұжырымдалады", alternatives: "Балама түсіндірулер", unknown: "Не белгісіз қалады", reviewed: "Кім және қашан тексерді", review: "Мәртебені тексеру", empty: "Бұл нысан үшін claim-деңгейіндегі дәлелдер әлі іріктелмеген." }
      : { title: "Доказательства", asserted: "Что утверждается", alternatives: "Альтернативные версии", unknown: "Что остаётся неизвестным", reviewed: "Кто и когда проверил", review: "Проверить статус", empty: "Для этого объекта пока не подготовлены доказательства на уровне отдельных утверждений." };
  return (
    <section className="ex-panel ex-evidence-panel" aria-labelledby="evidence-panel-title">
      <header className="ex-panel__header">
        <div><span className="ex-kicker">P1C · {subjectType}:{subjectId}</span><h2 id="evidence-panel-title">{labels.title}</h2></div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      <h3>{labels.asserted}</h3>
      {relatedClaims.length ? relatedClaims.map((claim) => {
        const linkedSources = claim.sourceIds.map((id) => sourceById.get(id)).filter(Boolean);
        const archiveMap = archiveMaps.find((map) => map.sourceIds.some((id) => claim.sourceIds.includes(id)));
        return (
          <EvidenceCard
            key={claim.id}
            claim={claim}
            sources={linkedSources}
            archiveMap={archiveMap}
            language={language}
            expanded={openClaimId === claim.id}
            onToggle={() => {
              const opening = openClaimId !== claim.id;
              setOpenClaimId(opening ? claim.id : null);
              if (opening) {
                recordExhibitionMetric("evidence_claim_opened", 1, {
                  claimId: claim.id,
                  subjectType,
                });
              }
            }}
            onSource={onSource}
            onArchive={onArchive}
            onCitation={onCitation}
          />
        );
      }) : <p className="ex-panel__lead">{labels.empty}</p>}
      <section><h3>{labels.alternatives}</h3>{relatedDisputes.length ? relatedDisputes.map((item) => <article key={item.id}><strong>{local(item.titles, language)}</strong><p>{local(item.descriptions, language)}</p></article>) : <p>—</p>}</section>
      <section><h3>{labels.unknown}</h3><p>{language === "en" ? "Exact geometry, source completeness and alternative versions may remain uncertain." : language === "kk" ? "Нақты геометрия, дереккөздердің толықтығы және балама нұсқалар белгісіз болуы мүмкін." : "Точная геометрия, полнота источников и альтернативные версии могут оставаться неизвестными."}</p></section>
      <section><h3>{labels.reviewed}</h3><p>{relatedClaims.some((claim) => claim.reviewedAt) ? relatedClaims.map((claim) => claim.reviewedAt).filter(Boolean).join(", ") : "—"}</p></section>
      <button className="ex-source-link" onClick={onReview}>! {labels.review}</button>
    </section>
  );
}
