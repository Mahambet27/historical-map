import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatHistoricalYear,
  getNextHistoricalYear,
  getPreviousHistoricalYear,
} from "./timeline/historicalYear.js";
import {
  getKeyYearsForEra,
  getYearDataSummary,
} from "./timeline/timelineAvailability.js";

const copy = {
  ru: {
    previousKey: "Предыдущая ключевая дата",
    nextKey: "Следующая ключевая дата",
    play: "Воспроизвести",
    pause: "Пауза",
    exact: "Точный документированный snapshot",
    interval: "Реконструкция применима к временному интервалу",
    approximate: "Приблизительная реконструкция — требуется научная проверка",
    unavailable: "Данные для выбранного года отсутствуют",
    speed: "Шаг воспроизведения",
  },
  kk: {
    previousKey: "Алдыңғы негізгі жыл",
    nextKey: "Келесі негізгі жыл",
    play: "Ойнату",
    pause: "Кідірту",
    exact: "Нақты құжатталған snapshot",
    interval: "Реконструкция уақыт аралығына қолданылады",
    approximate: "Шамамен реконструкция — ғылыми тексеру қажет",
    unavailable: "Таңдалған жылға дерек жоқ",
    speed: "Ойнату қадамы",
  },
  en: {
    previousKey: "Previous key year",
    nextKey: "Next key year",
    play: "Play",
    pause: "Pause",
    exact: "Exact documented snapshot",
    interval: "Reconstruction applies to a documented interval",
    approximate: "Approximate reconstruction — scholarly review required",
    unavailable: "No data for the selected year",
    speed: "Playback step",
  },
};

export default function ExhibitionYearSlider({
  selectedYear,
  activeEra,
  language,
  text,
  onChange,
  playing = false,
  onTogglePlay,
  playbackStep = 1,
  onPlaybackStepChange,
}) {
  const locale = copy[language] ? language : "ru";
  const labels = copy[locale];
  const era = activeEra;
  const [draftYear, setDraftYear] = useState(selectedYear);
  const frameRef = useRef(null);
  const syncFrameRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    syncFrameRef.current = requestAnimationFrame(() => setDraftYear(selectedYear));
    return () => cancelAnimationFrame(syncFrameRef.current);
  }, [selectedYear]);
  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (syncFrameRef.current) cancelAnimationFrame(syncFrameRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const keyYears = useMemo(
    () => getKeyYearsForEra(era?.id),
    [era?.id]
  );
  const availability = useMemo(
    () => getYearDataSummary(selectedYear),
    [selectedYear]
  );
  const scheduleChange = (year) => {
    setDraftYear(year);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      onChange(year);
      frameRef.current = null;
    });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
    }, 125);
  };

  const previousKey = () =>
    [...keyYears].reverse().find((year) => year < selectedYear) ?? era.fromYear;
  const nextKey = () =>
    keyYears.find((year) => year > selectedYear) ?? era.toYear;

  const handleKeyboard = (event) => {
    let target = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      target = getPreviousHistoricalYear(selectedYear);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      target = getNextHistoricalYear(selectedYear);
    } else if (event.key === "PageUp") target = nextKey();
    else if (event.key === "PageDown") target = previousKey();
    else if (event.key === "Home") target = era.fromYear;
    else if (event.key === "End") target = era.toYear;
    if (target == null) return;
    event.preventDefault();
    scheduleChange(target);
  };

  if (!era) return null;

  return (
    <section className="ex-year-slider" aria-label={text.yearSlider}>
      <div className="ex-year-slider__header">
        <div>
          <span className="ex-kicker">{text.yearSlider}</span>
          <strong aria-live="polite">
            {formatHistoricalYear(draftYear, language).toUpperCase()}
          </strong>
        </div>
        <div className="ex-year-slider__steps">
          <button type="button" onClick={() => scheduleChange(previousKey())} aria-label={labels.previousKey}>
            ◀◆
          </button>
          <button type="button" onClick={() => scheduleChange(getPreviousHistoricalYear(selectedYear))} aria-label={text.minusOne}>
            −1
          </button>
          <button type="button" onClick={onTogglePlay} aria-label={playing ? labels.pause : labels.play} aria-pressed={playing}>
            {playing ? "Ⅱ" : "▶"}
          </button>
          <button type="button" onClick={() => scheduleChange(getNextHistoricalYear(selectedYear))} aria-label={text.plusOne}>
            +1
          </button>
          <button type="button" onClick={() => scheduleChange(nextKey())} aria-label={labels.nextKey}>
            ◆▶
          </button>
        </div>
      </div>
      <input
        type="range"
        min={era.fromYear}
        max={era.toYear}
        step="1"
        value={draftYear}
        onChange={(event) => scheduleChange(Number(event.target.value))}
        onKeyDown={handleKeyboard}
        aria-label={text.yearSlider}
        aria-valuemin={era.fromYear}
        aria-valuemax={era.toYear}
        aria-valuenow={draftYear}
        aria-valuetext={formatHistoricalYear(draftYear, language)}
      />
      <div className="ex-year-slider__marks">
        {keyYears.map((year) => (
          <button
            type="button"
            key={year}
            onClick={() => scheduleChange(year)}
            title={formatHistoricalYear(year, language)}
          >
            {formatHistoricalYear(year, language)}
          </button>
        ))}
      </div>
      <div className="ex-year-slider__footer">
        <span className={`ex-year-availability is-${availability.status}`}>
          {labels[availability.status]}
          {availability.needsReview && availability.status !== "approximate"
            ? ` · ${labels.approximate}`
            : ""}
        </span>
        <label>
          <span>{labels.speed}</span>
          <select
            value={playbackStep}
            onChange={(event) => onPlaybackStepChange?.(Number(event.target.value))}
          >
            {[1, 5, 10, 25].map((step) => (
              <option key={step} value={step}>
                {step}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
