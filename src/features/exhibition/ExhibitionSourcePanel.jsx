export default function ExhibitionSourcePanel({ sources, language, text, onClose }) {
  return (
    <section className="ex-panel ex-sources-panel">
      <header className="ex-panel__header"><div><span className="ex-kicker">EVIDENCE</span><h2>{text.sources}</h2></div><button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button></header>
      <p className="ex-panel__lead">{language === "en" ? "Every key claim in this demonstration is linked to an editorially reviewed source." : language === "kk" ? "Демонстрациядағы әрбір негізгі тұжырым редакциялық тексерілген дереккөзбен байланысты." : "Каждое ключевое утверждение демонстрации связано с редакционно проверенным источником."}</p>
      <div className="ex-sources-list">
        {sources.map((source, index) => (
          <article key={source.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{source.title}</strong><small>{source.organization} {source.publicationYear ? `· ${source.publicationYear}` : ""}</small><p>{source.citation}</p></div>
            <a href={source.url} target="_blank" rel="noreferrer" aria-label={source.title}>↗</a>
            <i className={`source-status source-status--${source.verificationStatus}`}>{source.verificationStatus}</i>
          </article>
        ))}
      </div>
    </section>
  );
}
