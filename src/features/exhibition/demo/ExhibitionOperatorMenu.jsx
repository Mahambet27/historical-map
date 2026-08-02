import { useEffect, useRef } from "react";

export default function ExhibitionOperatorMenu({
  open,
  language,
  quality,
  forceSvg,
  health,
  onClose,
  onStory,
  onPause,
  onReset,
  onLanguage,
  onQuality,
  onForceSvg,
  onThreeD,
  onHealth,
  onRecovery,
}) {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="ex-operator-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="ex-operator-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Exhibition operator menu"
        tabIndex={-1}
      >
        <header>
          <div>
            <span className="ex-kicker">Official demo operations</span>
            <h2>Operator menu</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="ex-operator-menu__actions">
          <button type="button" onClick={onStory}>
            Start official story
          </button>
          <button type="button" onClick={onPause}>
            Pause
          </button>
          <button type="button" onClick={onReset}>
            Reset to 1465
          </button>
          <button type="button" onClick={onThreeD}>
            Check 3D
          </button>
          <button type="button" onClick={onHealth}>
            Check offline/readiness
          </button>
          <button type="button" onClick={onRecovery}>
            Cache recovery
          </button>
        </div>
        <label>
          Language
          <select
            value={language}
            onChange={(event) => onLanguage(event.target.value)}
          >
            <option value="ru">RU</option>
            <option value="kk">KK</option>
            <option value="en">EN</option>
          </select>
        </label>
        <label>
          Quality
          <select
            value={quality}
            onChange={(event) => onQuality(event.target.value)}
          >
            <option value="high">High</option>
            <option value="auto">Auto</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label className="ex-operator-menu__toggle">
          <input
            type="checkbox"
            checked={forceSvg}
            onChange={(event) => onForceSvg(event.target.checked)}
          />
          Force SVG fallback
        </label>
        <p role="status">
          Health: {health?.summary?.status || "not checked"}
        </p>
      </section>
    </div>
  );
}

