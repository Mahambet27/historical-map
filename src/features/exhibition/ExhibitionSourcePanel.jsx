export default function ExhibitionSourcePanel({ sources, language, text, onClose, onCitation }) {
  return (
    <section className="ex-panel ex-sources-panel">
      <header className="ex-panel__header"><div><span className="ex-kicker">EVIDENCE</span><h2>{text.sources}</h2></div><button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button></header>
      <p className="ex-panel__lead">{language === "en" ? "These are curated sources for the current context. Open Evidence to see exactly which claims each source supports; some records still require review." : language === "kk" ? "Бұл — ағымдағы мәнмәтінге арналған іріктелген дереккөздер. Әр дереккөз нақты қандай claim-ді қолдайтынын «Дәлелдер» бөлімінен көріңіз; кейбір жазбалар әлі тексеруді қажет етеді." : "Это курированные источники для текущего контекста. В панели «Доказательства» указано, какие именно claims они поддерживают; часть записей всё ещё требует проверки."}</p>
      <div className="ex-sources-list">
        {sources.map((source, index) => (
          <article key={source.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{source.title}</strong><small>{source.organization} {source.publicationYear ? `· ${source.publicationYear}` : ""}</small><p>{source.citation}</p></div>
            <a href={source.url} target="_blank" rel="noreferrer" aria-label={source.title}>↗</a>
            <button onClick={() => onCitation?.(source)} aria-label={`Citation: ${source.title}`}>⌁</button>
            <i className={`source-status source-status--${source.verificationStatus}`}>{source.verificationStatus}</i>
          </article>
        ))}
      </div>
    </section>
  );
}
