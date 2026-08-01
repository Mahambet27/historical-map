import { useEffect, useReducer, useRef } from "react";
import { recordExhibitionMetric } from "./performanceTelemetry.js";
import {
  createRouteJourneySession,
  routeJourneyReducer,
  scheduleJourneyFrame,
  scheduleJourneyStep,
  shouldAnimateJourney,
  shouldPauseJourneyForVisibility,
} from "./routeJourneyModel.js";
import { getPlaceNameAtYear } from "./historicalPlaceNames.js";

const local = (value, language) => value?.[language] || value?.ru || "";

export default function RouteJourneyPlayer({
  route,
  stops,
  selectedYear,
  language,
  quality,
  reducedMotion,
  onStopChange,
  onOpenPlace,
  onOpenSources,
  onClose,
}) {
  const [session, dispatch] = useReducer(
    routeJourneyReducer,
    undefined,
    () => ({ ...createRouteJourneySession(), playing: true })
  );
  const startedRef = useRef(false);
  const lastIndex = Math.max(0, stops.length - 1);
  const current = stops[session.index] || null;
  const next = stops[Math.min(lastIndex, session.index + 1)] || null;

  useEffect(() => {
    if (!current) return;
    onStopChange?.(current, session.index);
  }, [current, onStopChange, session.index]);

  useEffect(() => {
    if (!session.playing || !current) return undefined;
    if (!startedRef.current) {
      startedRef.current = true;
      recordExhibitionMetric("route_journey_started", 1, { routeId: route.id });
    }
    const finishStep = () => {
      if (session.index >= lastIndex) {
        dispatch({ type: "COMPLETE" });
        recordExhibitionMetric("route_journey_completed", 1, { routeId: route.id });
      } else {
        dispatch({ type: "NEXT", lastIndex });
      }
    };
    if (
      !shouldAnimateJourney({
        quality,
        reducedMotion,
        hidden: document.hidden,
      })
    ) {
      return scheduleJourneyStep({
        callback: finishStep,
        delay: Math.round(2600 / session.speed),
      });
    }
    const started = performance.now();
    const duration = 3200 / session.speed;
    let frames = 0;
    let cancel = () => {};
    const tick = (now) => {
      frames += 1;
      const progress = Math.min(1, (now - started) / duration);
      dispatch({ type: "PROGRESS", progress });
      if (progress >= 1) {
        const elapsed = Math.max(1, now - started);
        recordExhibitionMetric("route-journey-fps", (frames * 1000) / elapsed, {
          routeId: route.id,
          unit: "fps",
        });
        finishStep();
      }
      else cancel = scheduleJourneyFrame({ callback: tick });
    };
    cancel = scheduleJourneyFrame({ callback: tick });
    return () => cancel();
  }, [
    current,
    lastIndex,
    quality,
    reducedMotion,
    route.id,
    session.index,
    session.playing,
    session.speed,
  ]);

  useEffect(() => {
    const visibility = () => {
      if (shouldPauseJourneyForVisibility(document.hidden)) {
        dispatch({ type: "PAUSE" });
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);

  useEffect(() => {
    const keyboard = (event) => {
      if (event.key.toLowerCase() !== "j") return;
      dispatch({ type: session.playing ? "PAUSE" : "RESUME" });
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [session.playing]);

  if (!route || !current) return null;
  const controls =
    language === "en"
      ? { previous: "Previous stop", play: "Start journey", pause: "Pause journey", next: "Next stop", place: "Open current city", sources: "Open route sources", stop: "Stop journey" }
      : language === "kk"
        ? { previous: "Алдыңғы аялдама", play: "Саяхатты бастау", pause: "Саяхатты кідірту", next: "Келесі аялдама", place: "Қазіргі қаланы ашу", sources: "Бағыт дереккөздерін ашу", stop: "Саяхатты тоқтату" }
        : { previous: "Предыдущая точка", play: "Начать путешествие", pause: "Поставить путешествие на паузу", next: "Следующая точка", place: "Открыть текущий город", sources: "Открыть источники маршрута", stop: "Остановить путешествие" };
  const label = (place) =>
    getPlaceNameAtYear(place, selectedYear, language);
  return (
    <aside className="ex-route-journey" aria-label={local(route.names, language)}>
      <header>
        <div>
          <span className="ex-kicker">
            {language === "en" ? "Route journey" : language === "kk" ? "Бағыт саяхаты" : "Путешествие по маршруту"}
          </span>
          <strong>{local(route.names, language)}</strong>
        </div>
        <button onClick={onClose} aria-label={language === "en" ? "Close" : "Закрыть"}>×</button>
      </header>
      <div className="ex-route-journey__status" aria-live="polite">
        <strong>{label(current)}</strong>
        <span>
          {next && next.id !== current.id
            ? `${language === "en" ? "Next" : language === "kk" ? "Келесі" : "Далее"}: ${label(next)}`
            : language === "en" ? "Final stop" : language === "kk" ? "Соңғы аялдама" : "Последняя точка"}
        </span>
      </div>
      <progress value={session.index + session.progress} max={stops.length - 1 || 1} />
      <p>{local(route.summaries, language)}</p>
      <ol className="ex-route-journey__stops">
        {stops.map((place, index) => (
          <li key={place.id} className={index === session.index ? "is-active" : ""}>
            <button onClick={() => onOpenPlace?.(place)}>{label(place)}</button>
          </li>
        ))}
      </ol>
      <div className="ex-route-journey__controls">
        <button aria-label={controls.previous} onClick={() => dispatch({ type: "PREVIOUS" })} disabled={session.index === 0}>←</button>
        <button
          className="is-primary"
          onClick={() => dispatch({ type: session.playing ? "PAUSE" : "START" })}
          aria-label={session.playing ? controls.pause : controls.play}
        >
          {session.playing ? "Ⅱ" : "▶"}
        </button>
        <button aria-label={controls.next} onClick={() => dispatch({ type: "NEXT", lastIndex })} disabled={session.index === lastIndex}>→</button>
        <select value={session.speed} onChange={(event) => dispatch({ type: "SPEED", speed: Number(event.target.value) })} aria-label="Speed">
          <option value="1">1×</option>
          <option value="1.5">1.5×</option>
          <option value="2">2×</option>
        </select>
        <button aria-label={controls.place} onClick={() => onOpenPlace?.(current)}>◇</button>
        <button aria-label={controls.sources} onClick={() => onOpenSources?.(route.sourceIds)}>▤</button>
        <button aria-label={controls.stop} onClick={() => dispatch({ type: "STOP" })}>■</button>
      </div>
    </aside>
  );
}
