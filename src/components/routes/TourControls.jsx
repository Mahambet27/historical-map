const btnStyle = (active) => ({
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  cursor: "pointer",
  background: active ? "#111" : "#fff",
  color: active ? "#fff" : "#111",
  fontWeight: 800,
});

export default function TourControls({
  filteredPlaces,
  tourOn,
  tourAutoPlay,
  tourIndex,
  startTour,
  goToTourIndex,
  stopTour,
}) {
  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button
          onClick={() => startTour(false)}
          style={btnStyle(tourOn && !tourAutoPlay)}
          disabled={!filteredPlaces.length}
        >
          Экскурсия
        </button>

        <button
          onClick={() => startTour(true)}
          style={btnStyle(tourAutoPlay)}
          disabled={!filteredPlaces.length}
        >
          Auto tour
        </button>

        {tourOn && (
          <>
            <button onClick={() => goToTourIndex(tourIndex - 1)} style={btnStyle(false)}>
              ← Алдыңғы
            </button>

            <button onClick={() => goToTourIndex(tourIndex + 1)} style={btnStyle(false)}>
              Келесі →
            </button>

            <button onClick={stopTour} style={btnStyle(false)}>
              Тоқтату
            </button>
          </>
        )}
      </div>

      {tourOn && filteredPlaces.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
          Экскурсия: <b>{tourIndex + 1}</b> / {filteredPlaces.length}
        </div>
      )}
    </>
  );
}
