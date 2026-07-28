import { Link } from "../../app/router.jsx";

export default function ExhibitionHero({ language, setLanguage, text, onStart, onExplore }) {
  return (
    <section className="ex-hero">
      <div className="ex-hero__map" aria-hidden="true">
        <svg viewBox="0 0 1000 500"><path d="M96 259L147 115 294 80 437 102 558 83 726 131 899 226 845 311 727 342 610 413 455 383 354 430 209 369 112 321Z" /><path className="ex-hero__route" d="M155 287C315 165 500 363 816 193" /></svg>
      </div>
      <header className="ex-hero__top">
        <Link to="/" className="ex-wordmark"><span>Q</span><strong>Qazaq Heritage Map</strong></Link>
        <div className="ex-language" aria-label="Language">
          {["kk", "ru", "en"].map((code) => <button key={code} className={language === code ? "is-active" : ""} onClick={() => setLanguage(code)}>{code.toUpperCase()}</button>)}
        </div>
      </header>
      <div className="ex-hero__content">
        <span className="ex-kicker">NATIONAL EDUCATIONAL PLATFORM · 2026</span>
        <h1>Qazaq<br /><em>Heritage Map</em></h1>
        <p className="ex-hero__subtitle">{text.subtitle}</p>
        <p className="ex-hero__tagline">{text.tagline}</p>
        <div className="ex-hero__actions">
          <button className="ex-primary" onClick={onStart}><span>▶</span>{text.start}</button>
          <button className="ex-secondary" onClick={onExplore}>{text.explore}<span>→</span></button>
        </div>
      </div>
      <footer className="ex-hero__footer">
        <span>08 · 08 · 2026</span><i /><span>ARKALYK · 70</span><i /><span>QAZAQSTAN</span>
      </footer>
    </section>
  );
}
