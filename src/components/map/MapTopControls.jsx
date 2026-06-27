export default function MapTopControls({
  clearDrivingRoute,
  filteredPlaces,
  language,
  languageNames,
  mode,
  openPlace,
  resetView,
  routeExists,
  routeLoading,
  setLanguage,
  setMode,
  setSelected,
  setShowSettings,
  setTourIndex,
  setTourOn,
  showSettings,
  tourIndex,
  tourOn,
  tr,
}) {
  const buttonStyle = (active = false) => ({
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    cursor: "pointer",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 700,
    minHeight: 44,
    touchAction: "manipulation",
  });

  return (
    <div
      className="hm-topbar"
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 20,
        display: "flex",
        gap: 10,
        background: "rgba(255,255,255,0.92)",
        padding: 10,
        borderRadius: 12,
        boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
        alignItems: "center",
        fontFamily: "system-ui, Arial",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => {
          setSelected(null);
          setMode("now");
        }}
        style={buttonStyle(mode === "now")}
      >
        {tr.currentMap}
      </button>

      <button
        onClick={() => {
          setSelected(null);
          setMode("history");
        }}
        style={buttonStyle(mode === "history")}
      >
        {tr.historyMap}
      </button>

      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setShowSettings((value) => !value)}
          style={buttonStyle(showSettings)}
        >
          {tr.settings}
        </button>

        {showSettings && (
          <div
            className="hm-settings-menu"
            style={{
              position: "absolute",
              top: 46,
              left: 0,
              width: 220,
              background: "rgba(255,255,255,0.98)",
              borderRadius: 12,
              padding: 12,
              boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
              border: "1px solid rgba(0,0,0,0.08)",
              zIndex: 60,
            }}
          >
            <label
              className="hm-checkbox-row"
              style={{
                display: "grid",
                gap: 6,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {tr.language}
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px",
                  borderRadius: 9,
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontWeight: 800,
                  minHeight: 44,
                  outline: "none",
                }}
              >
                {Object.entries(languageNames).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <button onClick={resetView} style={buttonStyle()}>
        {tr.resetView}
      </button>

      {(routeExists || routeLoading) && (
        <button onClick={clearDrivingRoute} style={buttonStyle()} title={tr.clearRoute}>
          {tr.clearRoute}
        </button>
      )}

      {mode === "history" && (
        <>
          <button
            onClick={() => {
              if (filteredPlaces.length === 0) return;
              setTourOn(true);
              setTourIndex(0);
              openPlace(filteredPlaces[0], { zoom: 14.2, pitch: 78, bearing: 25 });
            }}
            style={buttonStyle(tourOn)}
          >
            {tourOn ? tr.tourOn : tr.tour}
          </button>

          {tourOn && (
            <>
              <button
                onClick={() => {
                  const index = Math.max(0, tourIndex - 1);
                  setTourIndex(index);
                  openPlace(filteredPlaces[index]);
                }}
                style={buttonStyle()}
              >
                {tr.previous}
              </button>

              <button
                onClick={() => {
                  const index = Math.min(filteredPlaces.length - 1, tourIndex + 1);
                  setTourIndex(index);
                  openPlace(filteredPlaces[index]);
                }}
                style={buttonStyle()}
              >
                {tr.next}
              </button>

              <button
                onClick={() => {
                  setTourOn(false);
                  setTourIndex(0);
                }}
                style={buttonStyle()}
              >
                {tr.stop}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
