import { atlasKeyDates, atlasLocal, atlasYear } from "../data/atlasDemoData.js";
export default function AtlasTimeline({ year, onYear, era, language, text, playing, onPlay }) {
  const previous = [...atlasKeyDates].reverse().find((date) => date < year) ?? -3000;
  const next = atlasKeyDates.find((date) => date > year) ?? 2026;
  return (
    <section className="atlas-timeline" aria-label={text.timeline}>
      <div className="atlas-timeline-current">
        <span className="atlas-eyebrow">{text.century}</span>
        <output aria-label={text.year} className="atlas-current-year">
          {Math.abs(year)}
          {year < 0 && (
            <small>{language === "en" ? "BCE" : language === "kk" ? "б.з.д." : "до н. э."}</small>
          )}
        </output>
        <span>{atlasLocal(era.name, language)}</span>
      </div>
      <div className="atlas-timeline-track">
        <div className="atlas-timeline-toolbar">
          <span>{text.timelineNote}</span>
          <div className="atlas-play-controls">
            <button
              onClick={() => onYear(previous)}
              aria-label={text.previous}
              disabled={year <= -3000}
            >
              ←
            </button>
            <button
              onClick={onPlay}
              aria-label={playing ? text.pause : text.play}
              aria-pressed={playing}
            >
              {playing ? "Ⅱ" : "▶"}
            </button>
            <button onClick={() => onYear(next)} aria-label={text.next} disabled={year >= 2026}>
              →
            </button>
          </div>
        </div>
        <div className="atlas-range-wrap">
          <input
            type="range"
            aria-label={text.timeline}
            aria-valuetext={atlasYear(year, language)}
            min="-3000"
            max="2026"
            step="1"
            value={year}
            onChange={(event) => onYear(Number(event.target.value))}
            style={{ "--atlas-progress": `${((year + 3000) / 5026) * 100}%` }}
          />
          <span className="atlas-range-start">3000 BCE</span>
          <span className="atlas-range-end">2026</span>
        </div>
        <div className="atlas-key-dates" aria-label={text.timeline}>
          {atlasKeyDates.map((date) => (
            <button
              key={date}
              onClick={() => onYear(date)}
              aria-label={atlasYear(date, language)}
              aria-pressed={year === date}
            >
              {date < 0 ? `−${Math.abs(date)}` : date}
              {year === date && <i aria-hidden="true" />}
            </button>
          ))}
        </div>
        <p className="atlas-timeline-note">{text.timelineDemo}</p>
      </div>
    </section>
  );
}
