export default function ExhibitionTimeline({ text, playing, onTogglePlay, speed, onSpeed }) {
  return (
    <section className="ex-tour-transport" aria-label={text.tourControls}>
      <span className="ex-kicker">{text.tourTitle}</span>
      <div>
        <button onClick={onTogglePlay} aria-label={playing ? text.pause : text.play}>
          {playing ? "Ⅱ" : "▶"} {playing ? text.pause : text.play}
        </button>
        <label>
          {text.speed}
          <select value={speed} onChange={(event) => onSpeed(Number(event.target.value))}>
            <option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option>
          </select>
        </label>
      </div>
    </section>
  );
}
