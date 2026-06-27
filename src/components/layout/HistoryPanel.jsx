import { normalizeName } from "../../lib/mapHelpers";
import { ERAS } from "../../lib/mapConfig";
import TourControls from "../routes/TourControls";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  outline: "none",
  fontSize: 14,
};

export default function HistoryPanel({
  selectedEra,
  query,
  setQuery,
  filteredPlaces,
  tourOn,
  tourIndex,
  setTourIndex,
  openTarbagataiFromMap,
  openZaysanFromMap,
  openPlace,
  startTour,
  goToTourIndex,
  stopTour,
  tourAutoPlay,
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 78,
        left: 16,
        width: 360,
        maxWidth: "92vw",
        maxHeight: "75vh",
        overflow: "hidden",
        background: "rgba(255,255,255,0.94)",
        borderRadius: 16,
        zIndex: 32,
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
        fontFamily: "system-ui, Arial",
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ padding: 14, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
          Іздеу (эпоха: {ERAS[selectedEra]})
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Атауы, қысқаша не толық сипаттамасы..."
          style={inputStyle}
        />

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
          Табылды: <b>{filteredPlaces.length}</b>
        </div>

        <TourControls
          filteredPlaces={filteredPlaces}
          tourOn={tourOn}
          tourAutoPlay={tourAutoPlay}
          tourIndex={tourIndex}
          startTour={startTour}
          goToTourIndex={goToTourIndex}
          stopTour={stopTour}
        />
      </div>

      <div style={{ overflowY: "auto" }}>
        {filteredPlaces.map((p, idx) => {
          const n = normalizeName(p?.name);
          const isTar =
            n === normalizeName("Тарбағатай тауы") ||
            n === normalizeName("Тарбагатай тауы");
          const isZaysan =
            n === normalizeName("Зайсан көлі") ||
            n === normalizeName("Зайсан коли");

          return (
            <div
              key={p.id ?? `${p.name}-${idx}`}
              onClick={() => {
                if (tourOn) setTourIndex(idx);

                if (isTar) return openTarbagataiFromMap(p);
                if (isZaysan) return openZaysanFromMap(p);
                openPlace(p);
              }}
              style={{
                padding: "12px 14px",
                cursor: "pointer",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                background: tourOn && idx === tourIndex ? "rgba(0,0,0,0.06)" : "transparent",
              }}
            >
              <div style={{ fontWeight: 900 }}>{p.name || "Атауы жоқ"}</div>
              <div style={{ fontSize: 12, opacity: 0.72, marginTop: 3 }}>
                {p.shortDescription ? p.shortDescription.slice(0, 100) : "Қысқаша ақпарат жоқ."}
                {p.shortDescription && p.shortDescription.length > 100 ? "…" : ""}
              </div>
            </div>
          );
        })}

        {filteredPlaces.length === 0 && (
          <div style={{ padding: 14, opacity: 0.7, fontSize: 13 }}>Ештеңе табылмады.</div>
        )}
      </div>
    </div>
  );
}
