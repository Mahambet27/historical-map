import { useEffect, useState } from "react";

const MODEL_VIEWER_SCRIPT_URL =
  "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

const ensureModelViewerLoaded = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.customElements?.get("model-viewer")) return Promise.resolve();

  const existing = document.querySelector('script[data-model-viewer="true"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = MODEL_VIEWER_SCRIPT_URL;
    script.dataset.modelViewer = "true";
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
};

export default function ObjectPresentation({ place, onClose }) {
  const [modelViewerLoad, setModelViewerLoad] = useState({
    key: "",
    ready: false,
    error: false,
  });
  const modelViewerKey = place?.model3d || "";
  const needsModelViewer = Boolean(place?.model3d && !place?.modelViewerUrl);
  const modelViewerReady =
    !needsModelViewer ||
    (modelViewerLoad.key === modelViewerKey && modelViewerLoad.ready);
  const modelViewerError =
    needsModelViewer &&
    modelViewerLoad.key === modelViewerKey &&
    modelViewerLoad.error;

  useEffect(() => {
    let active = true;

    if (!needsModelViewer) return undefined;

    ensureModelViewerLoaded()
      .then(() => {
        if (active) {
          setModelViewerLoad({ key: modelViewerKey, ready: true, error: false });
        }
      })
      .catch(() => {
        if (active) {
          setModelViewerLoad({ key: modelViewerKey, ready: false, error: true });
        }
      });

    return () => {
      active = false;
    };
  }, [modelViewerKey, needsModelViewer]);

  if (!place) return null;

  const imageFallback =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e5e7eb'/%3E%3Cpath d='M120 380 280 220l92 104 74-88 226 144z' fill='%239ca3af'/%3E%3Ccircle cx='620' cy='140' r='44' fill='%23d97706'/%3E%3C/svg%3E";

  const facts = [
    place?.type ? { label: "Түрі", value: place.type } : null,
    place?.eraLabel ? { label: "Эпоха", value: place.eraLabel } : null,
    Array.isArray(place?.coords) && place.coords.length === 2
      ? { label: "Координат", value: `${Number(place.coords[1]).toFixed(5)}, ${Number(place.coords[0]).toFixed(5)}` }
      : null,
    place?.regionType ? { label: "Аймақ", value: place.regionType } : null,
  ].filter(Boolean);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,10,18,0.72)",
        backdropFilter: "blur(6px)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1280px, 96vw)",
          height: "min(820px, 92vh)",
          background: "linear-gradient(180deg, #ffffff 0%, #f6f7fb 100%)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
          display: "grid",
          gridTemplateColumns: "minmax(380px, 1.25fr) minmax(320px, 0.75fr)",
        }}
      >
        <div
          style={{
            position: "relative",
            background:
              "radial-gradient(circle at top, rgba(255,255,255,0.28), rgba(255,255,255,0.02) 35%), linear-gradient(180deg, #121826 0%, #1d2433 100%)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 28%), radial-gradient(circle at 80% 10%, rgba(92,143,255,0.16), transparent 24%)",
            }}
          />

          {place.modelViewerUrl ? (
            <iframe
              src={place.modelViewerUrl}
              title={place.name || "3D object"}
              style={{ width: "100%", height: "100%", border: "none", position: "relative", zIndex: 1 }}
              allow="autoplay; fullscreen; xr-spatial-tracking"
            />
          ) : modelViewerError ? (
            <div
              style={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                padding: 24,
                textAlign: "center",
                fontWeight: 800,
              }}
            >
              3D viewer could not be loaded.
            </div>
          ) : !modelViewerReady ? (
            <div
              style={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                padding: 24,
                textAlign: "center",
                fontWeight: 800,
              }}
            >
              Loading 3D viewer...
            </div>
          ) : (
            <model-viewer
              src={place.model3d}
              poster={place.modelPoster || undefined}
              camera-controls
              auto-rotate
              auto-rotate-delay="0"
              rotation-per-second="18deg"
              shadow-intensity="1"
              exposure="1"
              interaction-prompt="none"
              environment-image="neutral"
              style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}
            />
          )}

          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 18,
              zIndex: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 999,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.2,
              }}
            >
              3D интерактивті қарау
            </div>

            {Array.isArray(place?.coords) && place.coords.length === 2 && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.coords[1]},${place.coords[0]}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  background: "#fff",
                  color: "#111",
                  borderRadius: 999,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 800,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                }}
              >
                Google Maps ашу
              </a>
            )}
          </div>
        </div>

        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            fontFamily: "system-ui, Arial",
            minHeight: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 8, fontWeight: 700 }}>
                {place.type || "Тарихи нысан"}
              </div>
              <div style={{ fontSize: 32, lineHeight: 1.08, fontWeight: 900, color: "#14171f" }}>
                {place.name || "Нысан"}
              </div>
              {place.short && (
                <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6, color: "#3f4754" }}>
                  {place.short}
                </div>
              )}
            </div>

            <button
              type="button"
              aria-label="Close 3D viewer"
              onClick={onClose}
              style={{
                border: "none",
                background: "#eef1f6",
                color: "#111",
                borderRadius: 14,
                width: 44,
                height: 44,
                cursor: "pointer",
                fontSize: 18,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {facts.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              {facts.map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(17,24,39,0.08)",
                    borderRadius: 16,
                    padding: 14,
                    boxShadow: "0 8px 18px rgba(17,24,39,0.05)",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 6, fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 800, color: "#1a2230" }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(17,24,39,0.08)",
              borderRadius: 18,
              padding: 18,
              overflowY: "auto",
              minHeight: 0,
              boxShadow: "0 10px 20px rgba(17,24,39,0.05)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 10, color: "#111827" }}>
              Толық ақпарат
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.75, color: "#2b3340", whiteSpace: "pre-wrap" }}>
              {place.full || place.short || "Ақпарат жоқ."}
            </div>
          </div>

          {Array.isArray(place?.images) && place.images.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 10, color: "#111827" }}>Галерея</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {place.images.slice(0, 3).map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    style={{
                      borderRadius: 14,
                      overflow: "hidden",
                      background: "#e8ebf0",
                      aspectRatio: "1 / 1",
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        if (event.currentTarget.dataset.fallbackApplied === "1") return;
                        event.currentTarget.dataset.fallbackApplied = "1";
                        event.currentTarget.src = imageFallback;
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
