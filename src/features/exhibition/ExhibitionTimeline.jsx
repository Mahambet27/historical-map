import { formatHistoricalYear } from "../../services/historicalTimelineService.js";

export default function ExhibitionTimeline({ states, current, language, text, onSelect, playing, onTogglePlay, speed, onSpeed }) {
  return (
    <section className="ex-timeline" aria-label={text.timeline}>
      <div className="ex-timeline__heading">
        <div><span className="ex-kicker">{text.timeline}</span><strong aria-live="polite">{formatHistoricalYear(current.year, language)} · {current.title[language] || current.title.ru}</strong></div>
        <div className="ex-timeline__play">
          <button onClick={onTogglePlay} aria-label={playing ? text.pause : text.play}>{playing ? "Ⅱ" : "▶"}</button>
          <label>{text.speed}<select value={speed} onChange={(event) => onSpeed(Number(event.target.value))}><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
        </div>
      </div>
      <input
        className="ex-timeline__range"
        type="range"
        min="-800"
        max="1991"
        step="1"
        value={current.year}
        onChange={(event) => onSelect(Number(event.target.value))}
        aria-label={text.timeline}
      />
      <div className="ex-timeline__states">
        {states.map((state) => (
          <button key={state.id} className={state.id === current.id ? "is-active" : ""} onClick={() => onSelect(state.year)}>
            <span>{formatHistoricalYear(state.year, language)}</span><strong>{state.title[language] || state.title.ru}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
