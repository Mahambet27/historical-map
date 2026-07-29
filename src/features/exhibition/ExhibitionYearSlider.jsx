import { KEY_HISTORICAL_YEARS } from "../../data/exhibition/timeline.js";
import { formatHistoricalYear } from "../../services/historicalTimelineService.js";

const clampYear = (year) => Math.min(2026, Math.max(-3000, Number(year)));

export default function ExhibitionYearSlider({ selectedYear, language, text, onChange }) {
  const changeBy = (amount) => onChange(clampYear(selectedYear + amount));
  const visibleMarks = KEY_HISTORICAL_YEARS.filter((_, index) =>
    index === 0 || index === KEY_HISTORICAL_YEARS.length - 1 || index % 2 === 1
  );

  return (
    <section className="ex-year-slider" aria-label={text.yearSlider}>
      <div className="ex-year-slider__header">
        <div>
          <span className="ex-kicker">{text.yearSlider}</span>
          <strong aria-live="polite">{formatHistoricalYear(selectedYear, language).toUpperCase()}</strong>
        </div>
        <div className="ex-year-slider__steps">
          <button onClick={() => changeBy(-10)} aria-label={text.minusTen}>−10</button>
          <button onClick={() => changeBy(-1)} aria-label={text.minusOne}>−1</button>
          <button onClick={() => changeBy(1)} aria-label={text.plusOne}>+1</button>
          <button onClick={() => changeBy(10)} aria-label={text.plusTen}>+10</button>
        </div>
      </div>
      <input
        type="range"
        min="-3000"
        max="2026"
        step="1"
        value={selectedYear}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={text.yearSlider}
      />
      <div className="ex-year-slider__marks">
        {visibleMarks.map((year) => (
          <button key={year} onClick={() => onChange(year)} title={formatHistoricalYear(year, language)}>
            {year < 0 ? `${Math.abs(year)} ${language === "en" ? "BCE" : language === "kk" ? "б.з.д." : "до н.э."}` : year}
          </button>
        ))}
      </div>
    </section>
  );
}
