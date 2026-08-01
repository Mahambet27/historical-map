import { useEffect, useMemo, useRef, useState } from "react";
import {
  getEntityGeometryAtYear,
  getGeometriesAtYear,
} from "../../data/exhibition/entityGeometries.js";
import {
  getHistoricalSnapshotAtYear,
  timelineStates,
} from "../../data/exhibition/timeline.js";
import { formatHistoricalYear } from "../../services/historicalTimelineService.js";
import { GeometryDifferenceController } from "./geometryDifferenceClient.js";
import HistoricalChangeLegend from "./HistoricalChangeLegend.jsx";
import { recordExhibitionMetric } from "./performanceTelemetry.js";

const local = (value, language) => value?.[language] || value?.ru || "";
const comparisonYears = [...new Set([
  ...timelineStates.map((item) => item.year),
  1521,
])].sort((a, b) => a - b);
const comparisonOptions = comparisonYears.map((year) => ({
  ...getHistoricalSnapshotAtYear(year),
  year,
}));

const resolveGeometryPair = (comparison, change) => {
  if (change) {
    const first = change.entityIds
      .map((entityId) => getEntityGeometryAtYear(entityId, comparison.firstYear))
      .find(Boolean);
    const second = [...change.entityIds]
      .reverse()
      .map((entityId) => getEntityGeometryAtYear(entityId, comparison.secondYear))
      .find(Boolean);
    if (first && second) return { first, second, entityId: change.entityIds.join("+") };
  }
  const firstGeometries = getGeometriesAtYear(comparison.firstYear);
  const secondGeometries = getGeometriesAtYear(comparison.secondYear);
  const common = firstGeometries.find((first) =>
    secondGeometries.some((second) => second.entityId === first.entityId)
  );
  const first = common || firstGeometries[0];
  const second =
    secondGeometries.find((entry) => entry.entityId === first?.entityId) ||
    secondGeometries[0];
  return first && second
    ? { first, second, entityId: first.entityId }
    : null;
};

export default function ExhibitionComparePanel({
  comparison,
  change,
  language,
  text,
  onChange,
  onGeometryResult,
  onClose,
}) {
  const first =
    comparisonOptions.find((item) => item.year === comparison.firstYear) ||
    comparisonOptions[2];
  const second =
    comparisonOptions.find((item) => item.year === comparison.secondYear) ||
    comparisonOptions[3];
  const mode = comparison.mode || "overlay";
  const firstYear = comparison.firstYear;
  const secondYear = comparison.secondYear;
  const controllerRef = useRef(null);
  const [geometryStatus, setGeometryStatus] = useState("idle");
  const [geometryError, setGeometryError] = useState("");
  const pair = useMemo(
    () => resolveGeometryPair({ firstYear, secondYear }, change),
    [firstYear, secondYear, change]
  );

  useEffect(() => {
    if (mode !== "changes" || !pair) {
      setGeometryStatus("idle");
      setGeometryError("");
      onGeometryResult?.(null);
      return undefined;
    }

    controllerRef.current ||= new GeometryDifferenceController();
    let active = true;
    setGeometryStatus("loading");
    setGeometryError("");
    recordExhibitionMetric("comparison_started", 1, {
      fromYear: comparison.firstYear,
      toYear: comparison.secondYear,
      mode,
    });
    controllerRef.current
      .calculate({
        fromYear: comparison.firstYear,
        toYear: comparison.secondYear,
        entityId: pair.entityId,
        first: pair.first.geojson,
        second: pair.second.geojson,
      })
      .then((response) => {
        if (!active) return;
        setGeometryStatus("ready");
        onGeometryResult?.(response.result, {
          durationMs: response.durationMs,
          cached: response.cached,
        });
        recordExhibitionMetric("comparison_completed", response.durationMs, {
          unit: "ms",
          cached: response.cached,
        });
      })
      .catch((error) => {
        if (!active) return;
        setGeometryStatus("error");
        setGeometryError(error?.message || "Geometry difference failed");
        onGeometryResult?.(null);
        recordExhibitionMetric("geometry_difference_failed", 1, {
          reason: error?.message || "unknown",
        });
      });
    return () => {
      active = false;
    };
  }, [
    change,
    comparison.firstYear,
    comparison.secondYear,
    mode,
    onGeometryResult,
    pair,
  ]);

  useEffect(
    () => () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    },
    []
  );

  const updateYear = (key, value) => {
    onGeometryResult?.(null);
    onChange({ ...comparison, [key]: Number(value), geometryResult: null });
  };

  return (
    <section className="ex-panel ex-compare-panel">
      <header className="ex-panel__header">
        <div>
          <span className="ex-kicker">
            {comparison.firstYear} ↔ {comparison.secondYear}
          </span>
          <h2>{text.compareTitle}</h2>
        </div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>
          ×
        </button>
      </header>
      <div className="ex-compare-panel__selectors">
        <label>
          <span>A</span>
          <select
            value={first.year}
            onChange={(event) => updateYear("firstYear", event.target.value)}
          >
            {comparisonOptions.map((item) => (
              <option key={item.id} value={item.year}>
                {formatHistoricalYear(item.year, language)} · {local(item.title, language)}
              </option>
            ))}
          </select>
        </label>
        <b>↔</b>
        <label>
          <span>B</span>
          <select
            value={second.year}
            onChange={(event) => updateYear("secondYear", event.target.value)}
          >
            {comparisonOptions.map((item) => (
              <option key={item.id} value={item.year}>
                {formatHistoricalYear(item.year, language)} · {local(item.title, language)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ex-compare-modes" role="tablist" aria-label={text.compareTitle}>
        <button
          role="tab"
          aria-selected={mode === "overlay"}
          className={mode === "overlay" ? "is-active" : ""}
          onClick={() => onChange({ ...comparison, mode: "overlay" })}
        >
          {language === "en" ? "Overlay" : language === "kk" ? "Қабаттасу" : "Наложение"}
        </button>
        <button
          role="tab"
          aria-selected={mode === "changes"}
          className={mode === "changes" ? "is-active" : ""}
          onClick={() => onChange({ ...comparison, mode: "changes" })}
        >
          {language === "en" ? "Changes" : language === "kk" ? "Өзгерістер" : "Изменения"}
        </button>
      </div>

      <HistoricalChangeLegend language={language} mode={mode} compact />

      {geometryStatus === "loading" && (
        <p className="ex-compare-status" role="status">
          {language === "en"
            ? "Calculating visual difference…"
            : language === "kk"
              ? "Көрнекі айырма есептелуде…"
              : "Вычисляется визуальная разница…"}
        </p>
      )}
      {geometryStatus === "error" && (
        <div className="ex-compare-error" role="status">
          <strong>
            {language === "en"
              ? "Difference could not be calculated"
              : language === "kk"
                ? "Айырманы есептеу мүмкін болмады"
                : "Не удалось вычислить разницу"}
          </strong>
          <p>
            {language === "en"
              ? "The original reconstructed polygons remain visible."
              : language === "kk"
                ? "Бастапқы реконструкцияланған полигондар көрсетіле береді."
                : "Исходные реконструированные полигоны остаются видимыми."}
          </p>
          <small>{geometryError}</small>
        </div>
      )}

      <p className="ex-panel__lead">
        {change
          ? local(change.summaries, language)
          : language === "en"
            ? "No curated historical explanation exists for this pair. Only a technical geometry comparison is shown."
            : language === "kk"
              ? "Бұл жұп үшін іріктелген тарихи түсіндірме жоқ. Тек техникалық геометриялық салыстыру көрсетіледі."
              : "Для этой пары нет курированного исторического объяснения. Показано только техническое сравнение геометрий."}
      </p>
      <div className="ex-disclaimer">
        ⓘ {language === "en"
          ? "The geometric difference is a visual calculation, not independent historical evidence."
          : language === "kk"
            ? "Геометриялық айырма — көрнекі есеп, жеке тарихи дәлел емес."
            : "Геометрическая разница — визуальный расчёт, а не самостоятельное историческое доказательство."}
      </div>
    </section>
  );
}
