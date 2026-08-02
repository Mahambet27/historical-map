export default function ExhibitionControls({
  text,
  onHome,
  onAgent,
  onSources,
  onCompare,
  onLesson,
  onStory,
  onLayers,
  onThreeD,
  onAccess,
  language,
  setLanguage,
  officialDemo = false,
}) {
  const labels = {
    layers:
      language === "en"
        ? "Layers"
        : language === "kk"
          ? "Қабаттар"
          : "Слои",
    story:
      language === "en"
        ? "Story"
        : language === "kk"
          ? "Тарих"
          : "История",
  };
  return (
    <header className="ex-appbar">
      <button
        className="ex-wordmark"
        onClick={onHome}
        aria-label="Qazaq Heritage Map"
      >
        <span>Q</span>
        <strong>Qazaq Heritage Map</strong>
      </button>
      <nav>
        <button onClick={onSources} aria-label={text.sources}>
          ◤ <span>{text.sources}</span>
        </button>
        <button onClick={onCompare} aria-label={text.compare}>
          ⇄ <span>{text.compare}</span>
        </button>
        {!officialDemo && (
          <button onClick={onLesson} aria-label={text.lesson}>
            ◫ <span>{text.lesson}</span>
          </button>
        )}
        <button onClick={onLayers} aria-label={labels.layers}>
          ◩ <span>{labels.layers}</span>
        </button>
        <button onClick={onStory} aria-label={labels.story}>
          ▶ <span>{labels.story}</span>
        </button>
        <button onClick={onThreeD} aria-label="3D">
          ◇ <span>3D</span>
        </button>
        {!officialDemo && (
          <button onClick={onAgent} aria-label={text.agent}>
            Q <span>{text.agent}</span>
          </button>
        )}
        <button onClick={onAccess} aria-label={text.accessibility}>
          ◐ <span>{text.accessibility}</span>
        </button>
      </nav>
      <div className="ex-language">
        {["kk", "ru", "en"].map((code) => (
          <button
            key={code}
            className={language === code ? "is-active" : ""}
            onClick={() => setLanguage(code)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
