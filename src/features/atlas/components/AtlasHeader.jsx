import AtlasSearch from "./AtlasSearch.jsx";
export default function AtlasHeader({ language, onLanguage, onAbout, text, ...searchProps }) {
  return (
    <header className="atlas-header">
      <a className="atlas-brand" href="/atlas" aria-label="Qazaq Historical Atlas">
        <span className="atlas-monogram" aria-hidden="true">
          Q
        </span>
        <span>
          <strong>QAZAQ</strong>
          <small>HISTORICAL ATLAS</small>
        </span>
      </a>
      <AtlasSearch {...searchProps} language={language} text={text} />
      <div className="atlas-header-actions">
        <div className="atlas-languages" role="group" aria-label="Language / Тіл / Язык">
          {["kk", "ru", "en"].map((locale) => (
            <button
              key={locale}
              onClick={() => onLanguage(locale)}
              aria-pressed={locale === language}
              lang={locale}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="atlas-about-button" onClick={onAbout}>
          {text.about}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </header>
  );
}
