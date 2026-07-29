import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../../app/i18n.jsx";
import { isMapboxTokenConfigured } from "../../config/env.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { entityGeometries } from "../../data/exhibition/entityGeometries.js";
import { historicalSources } from "../../data/exhibition/sources.js";
import {
  exhibitionModels,
  primaryExhibitionModel,
} from "../../data/exhibition/threeDModels.js";
import { checkSupabaseConnection } from "../../services/supabaseStatus.js";
import { getExhibitionMetrics } from "./performanceTelemetry.js";
import { detectExhibitionQuality, readStoredQualityMode } from "./qualityMode.js";
import { LOCAL_MODEL_VIEWER_CONFIGURED } from "./threeD/loadModelViewer.js";
import { isModelCached, THREE_D_CACHE_NAME } from "./threeD/offlineModelCache.js";

const checkWebGl = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

const diagnostic = (id, label, status, detail) => ({ id, label, status, detail });
const metricByName = (name) =>
  getExhibitionMetrics().find((metric) => metric.name === name);

export default function ExhibitionDiagnosticsPage() {
  const { language } = useI18n();
  const [supabase, setSupabase] = useState({ configured: null, connected: null });
  const [posterReady, setPosterReady] = useState(null);
  const [modelCached, setModelCached] = useState(null);
  const requestedQuality = readStoredQualityMode();
  const effectiveQuality = detectExhibitionQuality({ requested: requestedQuality });
  const webGlReady = useMemo(() => checkWebGl(), []);
  const saveData = Boolean(navigator.connection?.saveData);
  const effectiveType = navigator.connection?.effectiveType || "unknown";
  const lastError = metricByName("3d-last-model-error");
  const lastDuration = metricByName("3d-last-load-duration");

  useEffect(() => {
    let active = true;
    checkSupabaseConnection().then((result) => {
      if (active) setSupabase(result);
    });
    const image = new Image();
    image.onload = () => active && setPosterReady(true);
    image.onerror = () => active && setPosterReady(false);
    image.src = primaryExhibitionModel.poster;
    isModelCached(primaryExhibitionModel.src)
      .then((value) => {
        if (active) setModelCached(value);
      })
      .catch(() => {
        if (active) setModelCached(false);
      });
    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  const checks = useMemo(
    () => [
      diagnostic("mapbox", "Mapbox configuration", isMapboxTokenConfigured ? "ok" : "fallback", isMapboxTokenConfigured ? "Public token configured" : "SVG fallback will be used"),
      diagnostic("webgl", "WebGL", webGlReady ? "ok" : "fallback", webGlReady ? "Rendering context available" : "Poster fallback required"),
      diagnostic("supabase", "Supabase", supabase.connected ? "ok" : supabase.configured === false ? "optional" : supabase.connected === false ? "fallback" : "checking", supabase.connected ? `Connected via ${supabase.table}` : supabase.error || "Local atomic dataset remains active"),
      diagnostic("offline", "PWA / offline shell", "ok", "Exhibition data, SVG fallback and 3D poster are local"),
      diagnostic("data", "Local historical package", allHistoricalEntities.length && entityGeometries.length && historicalSources.length ? "ok" : "error", `${allHistoricalEntities.length} entities · ${entityGeometries.length} geometries · ${historicalSources.length} sources`),
      diagnostic("agent", "Local assistant", "ok", "Deterministic reviewed prompts; no remote AI dependency"),
      diagnostic("quality", "Effective quality", "ok", `${requestedQuality} → ${effectiveQuality}`),
      diagnostic("connection", "Connection hints", saveData ? "fallback" : "ok", `save-data: ${saveData ? "on" : "off"} · effective: ${effectiveType}`),
    ],
    [effectiveQuality, effectiveType, requestedQuality, saveData, supabase, webGlReady]
  );

  const threeDChecks = [
    diagnostic("viewer", "Local model-viewer", LOCAL_MODEL_VIEWER_CONFIGURED ? "ok" : "error", LOCAL_MODEL_VIEWER_CONFIGURED ? "Local lazy import configured" : "Unavailable"),
    diagnostic("manifest", "Production model manifest", exhibitionModels.length ? "ok" : "error", `${exhibitionModels.length} production model · ${primaryExhibitionModel.optimized ? "optimized" : "source"}`),
    diagnostic("size", "Primary model size", "ok", `${(primaryExhibitionModel.fileSizeBytes / 1024 / 1024).toFixed(2)} MiB`),
    diagnostic("poster", "Poster availability", posterReady === null ? "checking" : posterReady ? "ok" : "error", posterReady ? primaryExhibitionModel.poster : "Poster unavailable"),
    diagnostic("cache", "Model cached", modelCached === null ? "checking" : modelCached ? "ok" : "optional", modelCached ? THREE_D_CACHE_NAME : "Use the explicit offline preparation action"),
    diagnostic("offline-model", "Offline model availability", modelCached ? "ok" : "optional", modelCached ? "Production GLB available offline" : "Poster fallback remains available"),
    diagnostic("last-error", "Last model error", lastError ? "fallback" : "ok", lastError?.reason || "none"),
    diagnostic("last-duration", "Last load duration", lastDuration ? "ok" : "optional", lastDuration ? `${lastDuration.value} ms` : "not measured yet"),
  ];

  return (
    <main className="ex-diagnostics">
      <header>
        <a href="/exhibition">← Exhibition</a>
        <span className="ex-kicker">P0.5 diagnostics</span>
        <h1>Qazaq Heritage Map</h1>
        <p>{language === "en" ? "Runtime readiness without personal data." : "Готовность runtime без сбора персональных данных."}</p>
      </header>
      <section className="ex-diagnostics__grid" aria-label="Diagnostic checks">
        {checks.map((item) => (
          <article key={item.id} data-status={item.status}>
            <span>{item.status}</span>
            <h2>{item.label}</h2>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>
      <section className="ex-diagnostics__section" aria-labelledby="three-d-readiness">
        <h2 id="three-d-readiness">3D readiness</h2>
        <div className="ex-diagnostics__grid">
          {threeDChecks.map((item) => (
            <article key={item.id} data-status={item.status}>
              <span>{item.status}</span>
              <h2>{item.label}</h2>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="ex-diagnostics__metrics">
        <h2>Session performance</h2>
        {getExhibitionMetrics().length ? (
          <dl>
            {getExhibitionMetrics().map((metric) => (
              <div key={metric.name}><dt>{metric.name}</dt><dd>{metric.value} {metric.unit || ""}</dd></div>
            ))}
          </dl>
        ) : <p>Open the exhibition once to collect local session metrics.</p>}
      </section>
    </main>
  );
}
