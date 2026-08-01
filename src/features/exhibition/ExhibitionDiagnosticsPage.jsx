import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../../app/i18n.jsx";
import {
  HISTORICAL_DATA_SOURCE,
  isMapboxTokenConfigured,
} from "../../config/env.js";
import { getHistoricalRepository } from "../../dataAccess/createHistoricalRepository.js";
import { LOCAL_DATASET_VERSION } from "../../dataAccess/datasetVersion.js";
import { P2A_VALIDATION_SUMMARY } from "../../dataAccess/p2aValidationSummary.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { entityGeometries } from "../../data/exhibition/entityGeometries.js";
import { historicalSources } from "../../data/exhibition/sources.js";
import { historicalChanges } from "../../data/exhibition/historicalChanges.js";
import {
  historicalStories,
  storyQuestions,
} from "../../data/exhibition/stories.js";
import { AGENT_ACTIONS } from "../agent/agentTypes.js";
import {
  exhibitionModels,
  primaryExhibitionModel,
} from "../../data/exhibition/threeDModels.js";
import { checkSupabaseConnection } from "../../services/supabaseStatus.js";
import { getExhibitionMetrics } from "./performanceTelemetry.js";
import { detectExhibitionQuality, readStoredQualityMode } from "./qualityMode.js";
import { LOCAL_MODEL_VIEWER_CONFIGURED } from "./threeD/loadModelViewer.js";
import { isModelCached, THREE_D_CACHE_NAME } from "./threeD/offlineModelCache.js";
import { getGeometryComparisonDiagnostics } from "./geometryDifferenceClient.js";
import { environmentSnapshots } from "../../data/exhibition/environmentSnapshots.js";
import { hydrologySnapshots } from "../../data/exhibition/hydrologySnapshots.js";
import { historicalSettlements } from "../../data/exhibition/historicalSettlements.js";
import { historicalRoutes } from "../../data/exhibition/historicalRoutes.js";
import { routeSegments } from "../../data/exhibition/routeSegments.js";
import { sourceClaims } from "../../data/exhibition/sourceClaims.js";
import { archiveMaps } from "../../data/exhibition/archiveMaps.js";
import { sourceDisputes } from "../../data/exhibition/sourceDisputes.js";
import { getP1BDataDiagnostics } from "./p1bDataLoader.js";
import { readLayerState } from "./layerState.js";
import { canDisplayFullArchiveMap } from "./archiveMapRights.js";
import { validateEvidenceData } from "./evidenceValidation.js";
import { readLocalReviews } from "./review/localReviewStore.js";
import { parseP1BUrlState } from "./p1bUrlState.js";
import { getP1CDataDiagnostics } from "./p1cDataLoader.js";
import useHistoricalRepositoryStatus from "./hooks/useHistoricalRepositoryStatus.js";

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
  const [p2a5, setP2a5] = useState(null);
  const repository = useHistoricalRepositoryStatus();
  const requestedQuality = readStoredQualityMode();
  const effectiveQuality = detectExhibitionQuality({ requested: requestedQuality });
  const webGlReady = useMemo(() => checkWebGl(), []);
  const saveData = Boolean(navigator.connection?.saveData);
  const effectiveType = navigator.connection?.effectiveType || "unknown";
  const lastError = metricByName("3d-last-model-error");
  const lastDuration = metricByName("3d-last-load-duration");
  const geometryDiagnostics = getGeometryComparisonDiagnostics();
  const p1bDataDiagnostics = getP1BDataDiagnostics();
  const p1bLayers = readLayerState();
  const p1bUrl = parseP1BUrlState();
  const sourceIdSet = new Set(historicalSources.map((source) => source.id));
  const changeSourceIds = historicalChanges.flatMap((change) => [
    ...change.sourceIds,
    ...change.changes.flatMap((item) => item.sourceIds),
    ...change.causes.flatMap((item) => item.sourceIds),
    ...change.consequences.flatMap((item) => item.sourceIds),
  ]);
  const missingChangeSources = changeSourceIds.filter((id) => !sourceIdSet.has(id));
  const needsReviewCount = historicalChanges.reduce(
    (total, change) =>
      total +
      Number(change.verificationStatus === "needs_review") +
      [...change.changes, ...change.causes, ...change.consequences].filter(
        (item) => item.verificationStatus === "needs_review"
      ).length,
    0
  );

  useEffect(() => {
    let active = true;
    getHistoricalRepository().catch(() => {});
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
    if (import.meta.env.DEV) {
      fetch("/__p2a5/verification", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((value) => {
          if (active) setP2a5(value);
        })
        .catch(() => {
          if (active) setP2a5(null);
        });
    }
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
  const p1aChecks = [
    diagnostic("p1a-changes", "Historical change dataset", historicalChanges.length >= 3 ? "ok" : "error", `${historicalChanges.length} curated transitions`),
    diagnostic("p1a-comparisons", "Available comparisons", "ok", historicalChanges.map((change) => `${change.fromYear}→${change.toYear}`).join(" · ")),
    diagnostic("p1a-stories", "Story count", historicalStories.length ? "ok" : "error", `${historicalStories.length} local story`),
    diagnostic("p1a-steps", "Story steps", historicalStories[0]?.steps.length >= 10 ? "ok" : "error", `${historicalStories.reduce((total, story) => total + story.steps.length, 0)} steps`),
    diagnostic("p1a-questions", "Question count", storyQuestions.length >= 4 ? "ok" : "error", `${storyQuestions.length} questions`),
    diagnostic("p1a-worker", "Geometry worker", geometryDiagnostics.workerSupported ? "ok" : "fallback", geometryDiagnostics.workerSupported ? "Module worker available" : "Overlay fallback only"),
    diagnostic("p1a-turf", "Turf lazy status", geometryDiagnostics.turfLazyStatus === "error" ? "fallback" : "ok", geometryDiagnostics.turfLazyStatus),
    diagnostic("p1a-cache", "Cached comparisons", "ok", String(geometryDiagnostics.cachedComparisons)),
    diagnostic("p1a-agent", "Local agent actions", "ok", `${["SHOW_CHANGE", "START_STORY", "OPEN_COMPARISON"].filter((key) => AGENT_ACTIONS[key]).length}/3 P1A actions`),
    diagnostic("p1a-sources", "Source completeness", missingChangeSources.length ? "error" : "ok", missingChangeSources.length ? `${missingChangeSources.length} missing ids` : "All referenced source ids exist"),
    diagnostic("p1a-review", "needs_review count", needsReviewCount ? "optional" : "ok", `${needsReviewCount} explicitly flagged interpretation items`),
  ];
  const p1bNeedsReview = [
    ...environmentSnapshots,
    ...hydrologySnapshots,
    ...historicalSettlements,
    ...historicalRoutes,
    ...routeSegments,
  ].filter((item) =>
    ["needs_review", "demo_only", "disputed"].includes(item.verificationStatus)
  ).length;
  const p1bChecks = [
    diagnostic("p1b-environment", "Environment snapshots", environmentSnapshots.length ? "ok" : "error", String(environmentSnapshots.length)),
    diagnostic("p1b-hydrology", "Hydrology snapshots", hydrologySnapshots.length >= 5 ? "ok" : "error", String(hydrologySnapshots.length)),
    diagnostic("p1b-places", "Historical places", historicalSettlements.length >= 8 ? "ok" : "error", String(historicalSettlements.length)),
    diagnostic("p1b-routes", "Historical routes", historicalRoutes.length ? "ok" : "error", String(historicalRoutes.length)),
    diagnostic("p1b-segments", "Route segments", routeSegments.length ? "ok" : "error", String(routeSegments.length)),
    diagnostic("p1b-sources", "P1B source references", "ok", `${new Set([...historicalRoutes, ...routeSegments, ...historicalSettlements].flatMap((item) => item.sourceIds)).size} unique sources`),
    diagnostic("p1b-review", "P1B needs_review", p1bNeedsReview ? "optional" : "ok", String(p1bNeedsReview)),
    diagnostic("p1b-dynamic", "Loaded dynamic datasets", "ok", p1bDataDiagnostics.loadedDatasets.join(", ") || "none"),
    diagnostic("p1b-layers", "Active layers", "ok", Object.entries(p1bLayers).filter(([, enabled]) => enabled).map(([id]) => id).join(", ")),
    diagnostic("p1b-route", "Active route", p1bUrl.route ? "ok" : "optional", p1bUrl.route || "none"),
    diagnostic("p1b-atmosphere", "Atmosphere status", p1bLayers.atmosphere ? "ok" : "optional", p1bLayers.atmosphere ? "enabled" : "disabled"),
    diagnostic("p1b-animation", "Animation status", "ok", metricByName("route_journey_started") ? "journey measured" : "idle"),
    diagnostic("p1b-svg", "SVG fallback readiness", "ok", "Territories, P1B layers, routes, places and hydrology supported"),
    diagnostic("p1b-layer-time", "Layer update time", metricByName("layer-update-time") ? "ok" : "optional", metricByName("layer-update-time") ? `${metricByName("layer-update-time").value} ms` : "not measured"),
    diagnostic("p1b-route-time", "Route source update time", metricByName("route-source-update-time") ? "ok" : "optional", metricByName("route-source-update-time") ? `${metricByName("route-source-update-time").value} ms` : "not measured"),
  ];
  const p1cValidation = validateEvidenceData({
    sources: historicalSources,
    claims: sourceClaims,
    archiveMaps,
    geometries: entityGeometries,
    reviews: readLocalReviews(),
  });
  const evidenceStory = historicalStories.find((story) => story.id === "historical-evidence");
  const evidenceQuestionCount = storyQuestions.filter((question) =>
    question.id.startsWith("evidence-")
  ).length;
  const p1cChecks = [
    diagnostic("p1c-sources", "Source count", historicalSources.length ? "ok" : "error", String(historicalSources.length)),
    diagnostic("p1c-claims", "Claim count", sourceClaims.length ? "ok" : "error", String(sourceClaims.length)),
    diagnostic("p1c-claim-gaps", "Claims without sources", sourceClaims.some((claim) => !claim.sourceIds.length) ? "error" : "ok", String(sourceClaims.filter((claim) => !claim.sourceIds.length).length)),
    diagnostic("p1c-reviewed", "Reviewed claims", "ok", String(sourceClaims.filter((claim) => ["reviewed", "verified"].includes(claim.verificationStatus)).length)),
    diagnostic("p1c-review-claims", "needs_review claims", "optional", String(sourceClaims.filter((claim) => ["needs_review", "demo_only", "disputed"].includes(claim.verificationStatus)).length)),
    diagnostic("p1c-archive", "Archive map count", "ok", String(archiveMaps.length)),
    diagnostic("p1c-displayable", "Displayable archive maps", "ok", String(archiveMaps.filter(canDisplayFullArchiveMap).length)),
    diagnostic("p1c-restricted", "Restricted maps", "ok", String(archiveMaps.filter((map) => map.license.status === "restricted").length)),
    diagnostic("p1c-unknown", "Unknown license", "optional", String(archiveMaps.filter((map) => map.license.status === "unknown").length)),
    diagnostic("p1c-georef", "Georeferenced maps", "ok", String(archiveMaps.filter((map) => map.georeferenceType === "image-corners").length)),
    diagnostic("p1c-disputes", "Disputes", "optional", `${sourceDisputes.length} demo-only structure`),
    diagnostic("p1c-local-review", "Local review records", "ok", String(readLocalReviews().length)),
    diagnostic("p1c-dynamic", "Loaded P1C datasets", "ok", getP1CDataDiagnostics().loadedDatasets.join(", ") || "none"),
    diagnostic("p1c-story", "Evidence story", evidenceStory?.steps.length >= 9 ? "ok" : "error", `${evidenceStory?.steps.length || 0} steps`),
    diagnostic("p1c-questions", "Evidence questions", evidenceQuestionCount >= 5 ? "ok" : "error", String(evidenceQuestionCount)),
    diagnostic("p1c-overlay", "Overlay readiness", archiveMaps.some(canDisplayFullArchiveMap) ? "ok" : "error", "One project-owned image-corners overlay"),
    diagnostic("p1c-svg", "SVG evidence readiness", "ok", "Rights-gated static background, opacity, claims and story supported"),
    diagnostic("p1c-errors", "Validation errors", p1cValidation.errors.length ? "error" : "ok", String(p1cValidation.errors.length)),
    diagnostic("p1c-warnings", "Validation warnings", p1cValidation.warnings.length ? "optional" : "ok", String(p1cValidation.warnings.length)),
  ];
  const p2aChecks = [
    diagnostic("p2a-configured-source", "Configured data source", "ok", HISTORICAL_DATA_SOURCE),
    diagnostic("p2a-active-repository", "Active repository", repository.activeRepository === "initializing" ? "checking" : repository.activeRepository === "local-fallback" ? "fallback" : "ok", repository.activeRepository),
    diagnostic("p2a-supabase-configured", "Supabase configured", repository.supabaseConfigured ? "ok" : "optional", repository.supabaseConfigured ? "Public configuration present" : "No public configuration; local fallback is safe"),
    diagnostic("p2a-health", "Repository health", repository.healthStatus === "ok" || repository.healthStatus === "local" ? "ok" : repository.healthStatus === "failed" ? "fallback" : "optional", repository.healthStatus),
    diagnostic("p2a-health-duration", "Last health duration", repository.lastHealthDuration != null ? "ok" : "optional", repository.lastHealthDuration != null ? `${Math.round(repository.lastHealthDuration)} ms` : "not measured"),
    diagnostic("p2a-fallback", "Fallback reason", repository.fallbackReason ? "fallback" : "ok", repository.fallbackReason || "none"),
    diagnostic("p2a-local-version", "Local dataset version", "ok", LOCAL_DATASET_VERSION),
    diagnostic("p2a-server-version", "Server dataset version", repository.serverDatasetVersion ? "ok" : "optional", repository.serverDatasetVersion || "not available"),
    diagnostic("p2a-version-match", "Dataset versions match", repository.versionMatch === false ? "fallback" : repository.versionMatch === true ? "ok" : "optional", repository.versionMatch == null ? "not compared" : String(repository.versionMatch)),
    diagnostic("p2a-cache", "Snapshot cache", "ok", `${repository.cacheSize} entries · ${repository.cacheHitCount} hits · ${repository.cacheMissCount} misses`),
    diagnostic("p2a-snapshot-duration", "Last snapshot duration", repository.lastSnapshotDuration != null ? "ok" : "optional", repository.lastSnapshotDuration != null ? `${Math.round(repository.lastSnapshotDuration)} ms` : "not measured"),
    diagnostic("p2a-bbox", "Last bbox bucket", repository.lastBbox ? "ok" : "optional", repository.lastBbox || "not requested"),
    diagnostic("p2a-records", "Records loaded", "ok", String(repository.recordsLoaded || 0)),
    diagnostic("p2a-payload", "Estimated payload", "ok", `${Math.ceil((repository.estimatedPayloadBytes || 0) / 1024)} KiB`),
    diagnostic("p2a-aborted", "Aborted requests", "ok", String(repository.abortedRequests || 0)),
    diagnostic("p2a-errors", "Repository errors", repository.repositoryErrors ? "fallback" : "ok", `${repository.repositoryErrors || 0}${repository.lastErrorCode ? ` · ${repository.lastErrorCode}` : ""}`),
    diagnostic("p2a-seed", "Seed validation", P2A_VALIDATION_SUMMARY.seed.errors ? "error" : "ok", `${P2A_VALIDATION_SUMMARY.seed.records} records · ${P2A_VALIDATION_SUMMARY.seed.errors} errors · ${P2A_VALIDATION_SUMMARY.seed.warnings} warnings`),
    diagnostic("p2a-geometry", "Geometry validation", P2A_VALIDATION_SUMMARY.geometry.errors ? "error" : "optional", `${P2A_VALIDATION_SUMMARY.geometry.records} records · ${P2A_VALIDATION_SUMMARY.geometry.errors} errors · ${P2A_VALIDATION_SUMMARY.geometry.warnings} warnings`),
  ];
  const p2a5Sections = p2a5?.sections || {};
  const p2a5Status = (section) =>
    section?.passed === true
      ? "ok"
      : section?.passed === false
        ? "error"
        : "optional";
  const p2a5Checks = import.meta.env.DEV
    ? [
        diagnostic(
          "p2a5-reachable",
          "Local database reachable",
          p2a5Status(p2a5Sections.schema),
          p2a5Sections.schema?.passed ? "yes" : "not verified"
        ),
        diagnostic(
          "p2a5-postgres",
          "PostgreSQL version",
          p2a5Sections.schema?.postgresVersion ? "ok" : "optional",
          p2a5Sections.schema?.postgresVersion || "not verified"
        ),
        diagnostic(
          "p2a5-postgis",
          "PostGIS version",
          p2a5Sections.schema?.postgisVersion ? "ok" : "optional",
          p2a5Sections.schema?.postgisVersion || "not verified"
        ),
        diagnostic(
          "p2a5-migration",
          "Migration version",
          p2a5Status(p2a5Sections.migrations),
          p2a5Sections.schema?.migrationVersion || "not verified"
        ),
        diagnostic(
          "p2a5-schema",
          "Schema verification",
          p2a5Status(p2a5Sections.schema),
          p2a5Sections.schema?.passed ? "passed" : "not passed"
        ),
        diagnostic(
          "p2a5-seed",
          "Database seed verification",
          p2a5Status(p2a5Sections.seed),
          p2a5Sections.seed?.total != null
            ? `${p2a5Sections.seed.total} records`
            : "not verified"
        ),
        diagnostic(
          "p2a5-rls",
          "Local RLS checks",
          p2a5Status(p2a5Sections.rls),
          p2a5Sections.rls?.assertionCount != null
            ? `${p2a5Sections.rls.assertionCount} assertions`
            : "not verified"
        ),
        diagnostic(
          "p2a5-rpc",
          "Local RPC checks",
          p2a5Status(p2a5Sections.rpc),
          p2a5Sections.rpc?.checks
            ? `${p2a5Sections.rpc.checks.length} checks`
            : "not verified"
        ),
        diagnostic(
          "p2a5-parity",
          "Repository parity",
          p2a5Status(p2a5Sections.parity),
          p2a5Sections.parity?.differenceCount != null
            ? `${p2a5Sections.parity.differenceCount} differences`
            : "not verified"
        ),
        diagnostic(
          "p2a5-query",
          "Last actual query",
          p2a5Sections.rpc?.lastActualQueryDurationMs != null ? "ok" : "optional",
          p2a5Sections.rpc?.lastActualQueryDurationMs != null
            ? `${Math.round(p2a5Sections.rpc.lastActualQueryDurationMs)} ms · ${
                p2a5Sections.rpc.lastRecordsReturned || 0
              } records`
            : "not measured"
        ),
        diagnostic(
          "p2a5-smoke",
          "Local database smoke p95",
          p2a5Status(p2a5Sections.performance),
          p2a5Sections.performance?.p95Ms != null
            ? `${Math.round(p2a5Sections.performance.p95Ms)} ms`
            : "not measured"
        ),
        diagnostic(
          "p2a5-version",
          "Verified server dataset version",
          p2a5Sections.rpc?.datasetVersion ? "ok" : "optional",
          p2a5Sections.rpc?.datasetVersion || "not verified"
        ),
        diagnostic(
          "p2a5-fallback",
          "Local database fallback/retry E2E",
          p2a5Status(p2a5Sections.localDatabaseE2E),
          p2a5Sections.localDatabaseE2E?.passed ? "passed" : "not passed"
        ),
      ]
    : [];

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
      <section className="ex-diagnostics__section" aria-labelledby="p1a-readiness">
        <h2 id="p1a-readiness">P1A readiness</h2>
        <div className="ex-diagnostics__grid">
          {p1aChecks.map((item) => (
            <article key={item.id} data-status={item.status}>
              <span>{item.status}</span>
              <h2>{item.label}</h2>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="ex-diagnostics__section" aria-labelledby="p1b-readiness">
        <h2 id="p1b-readiness">P1B readiness</h2>
        <div className="ex-diagnostics__grid">
          {p1bChecks.map((item) => (
            <article key={item.id} data-status={item.status}>
              <span>{item.status}</span>
              <h2>{item.label}</h2>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="ex-diagnostics__section" aria-labelledby="p1c-readiness">
        <h2 id="p1c-readiness">P1C readiness</h2>
        <div className="ex-diagnostics__grid">
          {p1cChecks.map((item) => (
            <article key={item.id} data-status={item.status}>
              <span>{item.status}</span>
              <h2>{item.label}</h2>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="ex-diagnostics__section" aria-labelledby="p2a-readiness">
        <h2 id="p2a-readiness">P2A Data Foundation</h2>
        <button type="button" className="ex-source-link" onClick={repository.retry}>
          ↻ Retry repository connection
        </button>
        <div className="ex-diagnostics__grid">
          {p2aChecks.map((item) => (
            <article key={item.id} data-status={item.status}>
              <span>{item.status}</span>
              <h2>{item.label}</h2>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      {import.meta.env.DEV && (
        <section className="ex-diagnostics__section" aria-labelledby="p2a5-readiness">
          <h2 id="p2a5-readiness">P2A.5 Local Database Verification</h2>
          <p>Development-only local verification data. Credentials are never included.</p>
          <div className="ex-diagnostics__grid">
            {p2a5Checks.map((item) => (
              <article key={item.id} data-status={item.status}>
                <span>{item.status}</span>
                <h2>{item.label}</h2>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      )}
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
