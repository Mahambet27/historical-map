export default function ExhibitionControls({ text, onHome, onAgent, onSources, onCompare, onLesson, onStory, onLayers, onThreeD, onAccess, language, setLanguage }) {
  return (
    <>
      <header className="ex-appbar">
        <button className="ex-wordmark" onClick={onHome} aria-label="Qazaq Heritage Map"><span>Q</span><strong>Qazaq Heritage Map</strong></button>
        <nav>
          <button onClick={onSources} aria-label={text.sources}>▤ <span>{text.sources}</span></button>
          <button onClick={onCompare} aria-label={text.compare}>⇄ <span>{text.compare}</span></button>
          <button onClick={onLesson} aria-label={text.lesson}>◫ <span>{text.lesson}</span></button>
          <button onClick={onLayers} aria-label={language === "en" ? "Layers" : language === "kk" ? "Қабаттар" : "Слои"}>◩ <span>{language === "en" ? "Layers" : language === "kk" ? "Қабаттар" : "Слои"}</span></button>
          <button onClick={onStory} aria-label={language === "en" ? "Story" : language === "kk" ? "Тарих" : "История"}>▶ <span>{language === "en" ? "Story" : language === "kk" ? "Тарих" : "История"}</span></button>
          <button onClick={onThreeD} aria-label="3D">◇ <span>3D</span></button>
          <button onClick={onAgent} aria-label={text.agent}>Q <span>{text.agent}</span></button>
          <button onClick={onAccess} aria-label={text.accessibility}>◐ <span>{text.accessibility}</span></button>
        </nav>
        <div className="ex-language">
          {["kk", "ru", "en"].map((code) => <button key={code} className={language === code ? "is-active" : ""} onClick={() => setLanguage(code)}>{code.toUpperCase()}</button>)}
        </div>
      </header>
    </>
  );
}
