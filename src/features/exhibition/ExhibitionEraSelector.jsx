export default function ExhibitionEraSelector({ eras, selectedEraId, language, text, onSelect }) {
  return (
    <section className="ex-era-selector" aria-label={text.eraSelector}>
      <span className="ex-kicker">{text.eraSelector}</span>
      <div>
        {eras.map((era) => (
          <button
            key={era.id}
            className={era.id === selectedEraId ? "is-active" : ""}
            onClick={() => onSelect(era.id)}
          >
            {era.title[language] || era.title.ru}
            <small>{era.startYear < 0 ? Math.abs(era.startYear) : era.startYear}—{era.endYear}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
