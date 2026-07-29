import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { primaryExhibitionModel } from "../../data/exhibition/threeDModels.js";
import { recordExhibitionMetric } from "./performanceTelemetry.js";
import { loadModelViewer } from "./threeD/loadModelViewer.js";
import {
  cacheModelForOffline,
  isModelCached,
  THREE_D_CACHE_NAME,
} from "./threeD/offlineModelCache.js";
import {
  initialThreeDState,
  shouldAutoLoadThreeD,
  threeDReducer,
} from "./threeD/threeDState.js";

export const MODEL_LOAD_TIMEOUT_MS = 15000;

const local = (value, language) => value?.[language] || value?.ru || "";
const formatMiB = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
const now = () => globalThis.performance?.now?.() ?? Date.now();

export default function ExhibitionThreeD({
  language,
  text,
  onClose,
  effectiveQuality = "high",
}) {
  const model = primaryExhibitionModel;
  const viewerRef = useRef(null);
  const timerRef = useRef(null);
  const attemptRef = useRef(0);
  const startedAtRef = useRef(0);
  const [state, dispatch] = useReducer(threeDReducer, initialThreeDState);
  const [modelRequested, setModelRequested] = useState(false);
  const [cached, setCached] = useState(false);
  const [cacheStep, setCacheStep] = useState("idle");
  const [cacheProgress, setCacheProgress] = useState(0);
  const [cacheError, setCacheError] = useState("");
  const saveData = Boolean(navigator.connection?.saveData);
  const autoLoad = shouldAutoLoadThreeD({ effectiveQuality, saveData });

  const clearTimer = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const fail = useCallback((status, error) => {
    clearTimer();
    dispatch({ type: status === "timeout" ? "TIMEOUT" : "ERROR", error });
    recordExhibitionMetric("3d-last-model-error", 1, {
      reason: error?.message || String(error || status),
    });
  }, [clearTimer]);

  const startLoad = useCallback(() => {
    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;
    startedAtRef.current = now();
    setModelRequested(false);
    dispatch({ type: "START", startedAt: startedAtRef.current });
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      if (attemptRef.current === attempt) fail("timeout", new Error("3D loading timed out"));
    }, MODEL_LOAD_TIMEOUT_MS);

    loadModelViewer()
      .then(() => {
        if (attemptRef.current !== attempt) return;
        if (!window.customElements?.get("model-viewer")) {
          throw new Error("Local model-viewer custom element is unavailable");
        }
        dispatch({ type: "VIEWER_READY" });
        setModelRequested(true);
      })
      .catch((error) => {
        if (attemptRef.current === attempt) fail("error", error);
      });
  }, [clearTimer, fail]);

  useEffect(() => {
    let active = true;
    isModelCached(model.src)
      .then((value) => {
        if (active) setCached(value);
      })
      .catch(() => {
        if (active) setCached(false);
      });
    return () => {
      active = false;
    };
  }, [model.src]);

  useEffect(() => {
    const frame = autoLoad ? requestAnimationFrame(startLoad) : 0;
    return () => {
      cancelAnimationFrame(frame);
      attemptRef.current += 1;
      clearTimer();
    };
  }, [autoLoad, clearTimer, startLoad]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!modelRequested || !viewer) return undefined;
    const handleModelReady = () => {
      clearTimer();
      dispatch({ type: "MODEL_READY" });
      recordExhibitionMetric("3d-last-load-duration", now() - startedAtRef.current, {
        unit: "ms",
      });
    };
    const handleModelError = () => fail("error", new Error("GLB loading failed"));
    viewer.addEventListener("load", handleModelReady);
    viewer.addEventListener("error", handleModelError);
    return () => {
      viewer.removeEventListener("load", handleModelReady);
      viewer.removeEventListener("error", handleModelError);
    };
  }, [clearTimer, fail, modelRequested]);

  const handleRetry = () => {
    dispatch({ type: "RETRY" });
    startLoad();
  };

  const prepareOffline = async () => {
    setCacheStep("loading");
    setCacheError("");
    setCacheProgress(0);
    try {
      await loadModelViewer();
      await cacheModelForOffline({
        src: model.src,
        fileSizeBytes: model.fileSizeBytes,
        onProgress: ({ percent }) => setCacheProgress(Math.round(percent)),
      });
      setCached(true);
      setCacheStep("ready");
      recordExhibitionMetric("3d-offline-cache-ready", 1, {
        cacheName: THREE_D_CACHE_NAME,
      });
    } catch (error) {
      setCacheError(error?.message || "Offline cache failed");
      setCacheStep("error");
    }
  };

  const showFailure = state.status === "error" || state.status === "timeout";
  const isLoading = state.status === "loading-viewer" || state.status === "loading-model";

  return (
    <section className="ex-panel ex-3d-panel" data-3d-status={state.status}>
      <header className="ex-panel__header">
        <div><span className="ex-kicker">{text.threeD}</span><h2>{local(model.title, language)}</h2></div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>

      <div className="ex-3d-stage">
        <img
          className={`ex-3d-poster ${state.status === "ready" ? "is-hidden" : ""}`}
          src={model.poster}
          alt={local(model.title, language)}
        />
        {state.status === "idle" && (
          <div className="ex-3d-overlay">
            <strong>{local(model.description, language)}</strong>
            <button type="button" className="ex-primary" onClick={startLoad}>
              {effectiveQuality === "light"
                ? language === "en" ? "Load 3D manually" : "Загрузить 3D вручную"
                : text.openThreeD}
            </button>
          </div>
        )}
        {isLoading && (
          <div className="ex-3d-overlay ex-3d-loading" role="status">
            <i />
            <strong>
              {state.status === "loading-viewer"
                ? language === "en" ? "Loading local viewer…" : "Загружаем локальный viewer…"
                : language === "en" ? "Loading 3D model…" : "Загружаем 3D-модель…"}
            </strong>
          </div>
        )}
        {showFailure && (
          <div className="ex-3d-overlay ex-3d-fallback" role="alert">
            <span>◇</span>
            <strong>{language === "en" ? "3D model is unavailable" : "3D-модель недоступна"}</strong>
            <small>{local(model.description, language)}</small>
            <small>
              {state.status === "timeout"
                ? language === "en" ? "Loading took too long." : "Превышено время ожидания."
                : state.error}
            </small>
            <div>
              <button type="button" onClick={handleRetry}>{language === "en" ? "Retry" : "Повторить"}</button>
              <button type="button" onClick={onClose}>{text.close}</button>
            </div>
          </div>
        )}
        {modelRequested && (
          <model-viewer
            ref={viewerRef}
            class={state.status === "ready" ? "is-ready" : ""}
            src={model.src}
            poster={model.poster}
            camera-controls
            {...(effectiveQuality === "high" ? { "auto-rotate": "" } : {})}
            shadow-intensity="1"
            interaction-prompt="none"
            loading="eager"
            alt={local(model.reconstructionNotice, language)}
          />
        )}
      </div>

      <p className="ex-disclaimer">ⓘ {local(model.reconstructionNotice, language)}</p>
      <div className="ex-3d-actions">
        {state.status === "ready" && (
          <button type="button" onClick={() => {
            if (viewerRef.current) {
              viewerRef.current.cameraOrbit = "auto auto auto";
              viewerRef.current.cameraTarget = "auto auto auto";
              viewerRef.current.fieldOfView = "auto";
            }
          }}>↻ {text.resetView}</button>
        )}
        {cached ? (
          <span className="ex-3d-cache-ready">✓ {language === "en" ? "3D ready offline" : "3D готово офлайн"}</span>
        ) : cacheStep === "confirm" ? (
          <div className="ex-3d-cache-confirm">
            <span>{language === "en" ? `Download ${formatMiB(model.fileSizeBytes)}?` : `Скачать ${formatMiB(model.fileSizeBytes)}?`}</span>
            <button type="button" onClick={prepareOffline}>{language === "en" ? "Confirm" : "Подтвердить"}</button>
            <button type="button" onClick={() => setCacheStep("idle")}>{language === "en" ? "Cancel" : "Отмена"}</button>
          </div>
        ) : cacheStep === "loading" ? (
          <div className="ex-3d-cache-progress" role="status">
            <progress max="100" value={cacheProgress} />
            <span>{cacheProgress}%</span>
          </div>
        ) : (
          <button type="button" onClick={() => setCacheStep("confirm")}>
            {language === "en" ? "Prepare 3D for offline display" : "Подготовить 3D для офлайн-показа"} · {formatMiB(model.fileSizeBytes)}
          </button>
        )}
      </div>
      {cacheStep === "error" && <p className="ex-3d-cache-error">{cacheError}</p>}
    </section>
  );
}
