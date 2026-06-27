import { useState } from "react";
import { toFixed5 } from "../../lib/mapHelpers";

const actionBtnStyle = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  cursor: "pointer",
  background: "#fff",
  fontWeight: 800,
};

const actionLinkStyle = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  textDecoration: "none",
  color: "#111",
  fontWeight: 800,
  background: "#fff",
};

export default function InfoPanel({
  selected,
  routeExists,
  userLocRef,
  buildRouteToSelected,
  clearRoute,
  onClose,
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  if (!selected) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 390,
        maxWidth: "92vw",
        background: "rgba(255,255,255,0.98)",
        borderRadius: 16,
        padding: 16,
        zIndex: 35,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        fontFamily: "system-ui, Arial",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>{selected.type}</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{selected.name}</div>
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
            Коорд: {toFixed5(selected.coords?.[1])}, {toFixed5(selected.coords?.[0])}
          </div>

          {selected?.coords && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.coords[1]},${selected.coords[0]}`}
                target="_blank"
                rel="noreferrer"
                style={actionLinkStyle}
              >
                Навигация (Google)
              </a>

              <button
                onClick={() => {
                  const text = `${selected.coords[1]}, ${selected.coords[0]}`;
                  navigator.clipboard?.writeText(text);
                }}
                style={actionBtnStyle}
              >
                Көшіру
              </button>

              {!routeExists && (
                <button
                  onClick={() => {
                    if (!userLocRef.current) {
                      alert("Алдымен GPS қос: геолокация батырмасын бас.");
                      return;
                    }
                    buildRouteToSelected();
                  }}
                  style={actionBtnStyle}
                >
                  Маршрут (GPS)
                </button>
              )}

              {routeExists && (
                <button onClick={clearRoute} style={actionBtnStyle}>
                  Маршрутты өшіру
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "#f2f2f2",
            borderRadius: 10,
            width: 36,
            height: 36,
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.45 }}>{selected.short}</div>

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800 }}>Толығырақ</summary>

        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.45,
            maxHeight: "45vh",
            overflowY: "auto",
            paddingRight: 6,
          }}
        >
          {selected.full}

          {selected.images?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setShowGallery((v) => !v)}
                style={actionBtnStyle}
              >
                {showGallery ? "Суреттерді жабу" : "Суреттер"} ({selected.images.length})
              </button>
            </div>
          )}

          {showGallery && selected.images?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#f3f3f3",
                }}
              >
                <img
                  src={selected.images[slideIndex]}
                  alt={selected.name}
                  style={{
                    width: "100%",
                    display: "block",
                    maxHeight: 260,
                    objectFit: "cover",
                  }}
                />

                {selected.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSlideIndex((i) => (i - 1 + selected.images.length) % selected.images.length)
                      }
                      style={arrowLeft}
                    >
                      ‹
                    </button>

                    <button
                      onClick={() => setSlideIndex((i) => (i + 1) % selected.images.length)}
                      style={arrowRight}
                    >
                      ›
                    </button>

                    <div style={counterStyle}>
                      {slideIndex + 1} / {selected.images.length}
                    </div>
                  </>
                )}
              </div>

              {selected.images.length > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
                  {selected.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIndex(i)}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        border: "none",
                        cursor: "pointer",
                        background: i === slideIndex ? "#111" : "#cfcfcf",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

const arrowLeft = {
  position: "absolute",
  top: "50%",
  left: 10,
  transform: "translateY(-50%)",
  border: "none",
  background: "rgba(0,0,0,0.45)",
  color: "white",
  width: 36,
  height: 36,
  borderRadius: 999,
  cursor: "pointer",
  fontSize: 18,
  fontWeight: 900,
};

const arrowRight = {
  position: "absolute",
  top: "50%",
  right: 10,
  transform: "translateY(-50%)",
  border: "none",
  background: "rgba(0,0,0,0.45)",
  color: "white",
  width: 36,
  height: 36,
  borderRadius: 999,
  cursor: "pointer",
  fontSize: 18,
  fontWeight: 900,
};

const counterStyle = {
  position: "absolute",
  right: 10,
  bottom: 10,
  background: "rgba(0,0,0,0.5)",
  color: "white",
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};
