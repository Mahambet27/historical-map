export default function ExhibitionControls({ text, onHome, onAgent, onSources, onCompare, onLesson, onThreeD, onAccess, language, setLanguage }) {
  return (
    <>
      <header className="ex-appbar">
        <button className="ex-wordmark" onClick={onHome}><span>Q</span><strong>Qazaq Heritage Map</strong></button>
        <nav>
          <button onClick={onSources}>▤ <span>{text.sources}</span></button>
          <button onClick={onCompare}>⇄ <span>{text.compare}</span></button>
          <button onClick={onLesson}>◫ <span>{text.lesson}</span></button>
          <button onClick={onThreeD}>◇ <span>3D</span></button>
          <button onClick={onAgent}>Q <span>{text.agent}</span></button>
          <button onClick={onAccess}>◐ <span>{text.accessibility}</span></button>
        </nav>
        <div className="ex-language">
          {["kk", "ru", "en"].map((code) => <button key={code} className={language === code ? "is-active" : ""} onClick={() => setLanguage(code)}>{code.toUpperCase()}</button>)}
        </div>
      </header>
    </>
  );
}
