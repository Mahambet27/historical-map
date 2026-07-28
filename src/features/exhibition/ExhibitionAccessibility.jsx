export default function ExhibitionAccessibility({ language, text, settings, onChange, onClose }) {
  return (
    <section className="ex-panel ex-access-panel">
      <header className="ex-panel__header"><div><span className="ex-kicker">WCAG</span><h2>{text.accessibility}</h2></div><button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button></header>
      <div className="ex-access-options">
        <div><strong>{text.textSize}</strong><span><button onClick={() => onChange({ ...settings, scale: Math.max(.9, settings.scale - .1) })}>A−</button><output>{Math.round(settings.scale * 100)}%</output><button onClick={() => onChange({ ...settings, scale: Math.min(1.3, settings.scale + .1) })}>A+</button></span></div>
        <label><span><strong>{text.contrast}</strong><small>{language === "en" ? "Higher visual contrast" : language === "kk" ? "Жоғары көрнекі контраст" : "Повышенная визуальная контрастность"}</small></span><input type="checkbox" checked={settings.contrast} onChange={(event) => onChange({ ...settings, contrast: event.target.checked })} /></label>
        <label><span><strong>{text.simpleText}</strong><small>{language === "en" ? "Shorter explanations" : language === "kk" ? "Қысқартылған түсіндірмелер" : "Сокращённые объяснения"}</small></span><input type="checkbox" checked={settings.simple} onChange={(event) => onChange({ ...settings, simple: event.target.checked })} /></label>
        <label><span><strong>{language === "en" ? "Audio guide" : language === "kk" ? "Аудиогид" : "Аудиогид"}</strong><small>{language === "en" ? "Architecture ready; narration coming later" : language === "kk" ? "Архитектура дайын; дыбыстау кейін қосылады" : "Архитектура готова; озвучивание на следующем этапе"}</small></span><input type="checkbox" disabled /></label>
      </div>
    </section>
  );
}
