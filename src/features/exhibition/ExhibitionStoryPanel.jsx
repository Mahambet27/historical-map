import { formatHistoricalYear } from "../../services/historicalTimelineService.js";

export default function ExhibitionStoryPanel({ state, language, text, tour, onPrevious, onNext, onReplay, onExit, onEntity, onSources }) {
  const title = state.title[language] || state.title.ru;
  const description = state.description[language] || state.description.ru;
  return (
    <aside className="ex-story">
      <div className="ex-story__number">{String(tour.index + 1).padStart(2, "0")}</div>
      <span className="ex-kicker">{tour.active ? text.step.replace("{current}", tour.index + 1).replace("{total}", tour.total) : formatHistoricalYear(state.year, language)}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="ex-story__meta">
        <button onClick={onEntity}>◇ {text.entity}</button>
        <button onClick={onSources}>▤ {text.verified.replace("{count}", state.sourceIds.length)}</button>
      </div>
      {tour.active && (
        <div className="ex-story__controls">
          <button onClick={onPrevious} disabled={tour.index === 0}>← {text.previous}</button>
          <button className="is-primary" onClick={onNext}>{tour.index === tour.total - 1 ? text.exitTour : `${text.next} →`}</button>
          <button onClick={onReplay} aria-label={text.replay}>↻</button>
          <button onClick={onExit} aria-label={text.exitTour}>×</button>
        </div>
      )}
    </aside>
  );
}
