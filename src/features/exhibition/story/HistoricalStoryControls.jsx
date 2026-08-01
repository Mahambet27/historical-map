export default function HistoricalStoryControls({
  language,
  index,
  playing,
  speed,
  onPrevious,
  onNext,
  onTogglePlay,
  onReplay,
  onSpeed,
  onExit,
  isLast,
  completed,
}) {
  const copy =
    language === "en"
      ? { previous: "Previous", next: "Next", finish: "Finish", play: "Play", pause: "Pause", replay: "Replay step", exit: "Exit story", speed: "Speed" }
      : language === "kk"
        ? { previous: "Артқа", next: "Келесі", finish: "Аяқтау", play: "Ойнату", pause: "Кідірту", replay: "Қадамды қайталау", exit: "Тарихтан шығу", speed: "Жылдамдық" }
        : { previous: "Назад", next: "Далее", finish: "Завершить", play: "Воспроизвести", pause: "Пауза", replay: "Повторить шаг", exit: "Выйти из истории", speed: "Скорость" };
  return (
    <div className="ex-historical-story__controls" aria-label={copy.exit}>
      <button onClick={onPrevious} disabled={index === 0} aria-label={copy.previous}>←</button>
      <button className="is-primary" onClick={onTogglePlay}>
        {playing ? `Ⅱ ${copy.pause}` : `▶ ${copy.play}`}
      </button>
      <button
        onClick={onNext}
        disabled={completed}
        aria-label={isLast ? copy.finish : copy.next}
      >
        {isLast ? "✓" : "→"}
      </button>
      <button onClick={onReplay} aria-label={copy.replay}>↻</button>
      <label>
        <span>{copy.speed}</span>
        <select value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
          <option value="1">1×</option>
          <option value="1.5">1.5×</option>
          <option value="2">2×</option>
        </select>
      </label>
      <button onClick={onExit} aria-label={copy.exit}>×</button>
    </div>
  );
}
