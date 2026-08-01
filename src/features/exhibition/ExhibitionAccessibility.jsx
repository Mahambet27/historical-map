import { EXHIBITION_QUALITY_MODES } from "./qualityMode.js";
import { MAP_STYLE_MODES } from "./theme/mapPalettes.js";

const local = (language, values) => values[language] || values.ru;

export default function ExhibitionAccessibility({
  language,
  text,
  settings,
  onChange,
  onClose,
  mapStyleMode,
  onMapStyleMode,
  qualityMode,
  effectiveQuality,
  onQualityMode,
}) {
  return (
    <section className="ex-panel ex-access-panel">
      <header className="ex-panel__header">
        <div><span className="ex-kicker">WCAG</span><h2>{text.accessibility}</h2></div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      <div className="ex-access-options">
        <div>
          <strong>{text.textSize}</strong>
          <span>
            <button onClick={() => onChange({ ...settings, scale: Math.max(.9, settings.scale - .1) })}>A−</button>
            <output>{Math.round(settings.scale * 100)}%</output>
            <button onClick={() => onChange({ ...settings, scale: Math.min(1.3, settings.scale + .1) })}>A+</button>
          </span>
        </div>
        <label>
          <span><strong>{text.contrast}</strong><small>{local(language, { ru: "Повышенная визуальная контрастность", kk: "Жоғары көрнекі контраст", en: "Higher visual contrast" })}</small></span>
          <input type="checkbox" checked={settings.contrast} onChange={(event) => onChange({ ...settings, contrast: event.target.checked })} />
        </label>
        <label>
          <span><strong>{text.simpleText}</strong><small>{local(language, { ru: "Сокращённые объяснения", kk: "Қысқартылған түсіндірмелер", en: "Shorter explanations" })}</small></span>
          <input type="checkbox" checked={settings.simple} onChange={(event) => onChange({ ...settings, simple: event.target.checked })} />
        </label>
        <label>
          <span><strong>{local(language, { ru: "Стиль карты", kk: "Карта стилі", en: "Map style" })}</strong><small>{local(language, { ru: "Эпоха, светлая, тёмная, атласная или контрастная", kk: "Дәуірлік, ашық, қараңғы, атлас немесе контраст", en: "Era, light, dark, atlas or high contrast" })}</small></span>
          <select value={mapStyleMode} onChange={(event) => onMapStyleMode(event.target.value)}>
            {MAP_STYLE_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </label>
        <label>
          <span><strong>{local(language, { ru: "Качество", kk: "Сапа", en: "Quality" })}</strong><small>{local(language, { ru: `Активный режим: ${effectiveQuality}`, kk: `Белсенді режим: ${effectiveQuality}`, en: `Effective mode: ${effectiveQuality}` })}</small></span>
          <select value={qualityMode} onChange={(event) => onQualityMode(event.target.value)}>
            {EXHIBITION_QUALITY_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </label>
        <a className="ex-access-diagnostics" href="/exhibition/diagnostics">
          <span><strong>Diagnostics</strong><small>{local(language, { ru: "Проверить карту, offline, данные и 3D", kk: "Карта, offline, деректер және 3D тексеру", en: "Check map, offline, data and 3D readiness" })}</small></span>
          <b>→</b>
        </a>
        <div className="ex-access-shortcuts">
          <strong>{local(language, { ru: "Клавиатура", kk: "Пернетақта", en: "Keyboard" })}</strong>
          <small>Space — play · [ ] — year · L — lesson · A — agent · C — compare · R/G/H/P/J — P1B · E — evidence · V — archive · Shift+V — archive compare · Q — review · Esc — close</small>
        </div>
        <label>
          <span><strong>{local(language, { ru: "Аудиогид", kk: "Аудиогид", en: "Audio guide" })}</strong><small>{local(language, { ru: "Архитектура готова; озвучивание на следующем этапе", kk: "Архитектура дайын; дыбыстау кейін қосылады", en: "Architecture ready; narration coming later" })}</small></span>
          <input type="checkbox" disabled />
        </label>
      </div>
    </section>
  );
}
