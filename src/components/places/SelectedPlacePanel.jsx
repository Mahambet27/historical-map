export default function SelectedPlacePanel({
  selected,
  selectedView,
  tr,
  toFixed5,
  routeInfo,
  nearbyPlaces,
  has3D,
  routeExists,
  routeLoading,
  showNearby,
  setShowNearby,
  showGallery,
  setShowGallery,
  slideIndex,
  setSlideIndex,
  onClose,
  openPlace,
  openRouteFromUserPosition,
  clearDrivingRoute,
  onOpenModelViewer,
  isFavoritePlace,
  toggleFavoritePlace,
  favoriteText,
  localizePlace,
  language,
}) {
  if (!selected) return null;

  const imageFallback =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e5e7eb'/%3E%3Cpath d='M120 380 280 220l92 104 74-88 226 144z' fill='%239ca3af'/%3E%3Ccircle cx='620' cy='140' r='44' fill='%23d97706'/%3E%3C/svg%3E";

  return (
    <div
      className="hm-info-panel"
      style={{
        position: "absolute",
        top: 86,
        right: 16,
        width: 350,
        maxWidth: "92vw",
        background: "white",
        borderRadius: 14,
        padding: 14,
        zIndex: 25,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        fontFamily: "system-ui, Arial",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>{selectedView.type}</div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{selectedView.name}</div>
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
            {tr.coordinates}: {toFixed5(selected.coords?.[1])}, {toFixed5(selected.coords?.[0])}
          </div>

          {selected?.coords && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.coords[1]},${selected.coords[0]}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  textDecoration: "none",
                  color: "#111",
                  fontWeight: 800,
                  background: "#fff",
                }}
              >
                {tr.navigation}
              </a>

              <button
                className={`hm-favorite-chip${isFavoritePlace(selected) ? " hm-favorite-chip--active" : ""}`}
                type="button"
                aria-pressed={isFavoritePlace(selected)}
                onClick={() => toggleFavoritePlace(selected)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  background: isFavoritePlace(selected) ? "#111" : "#fff",
                  color: isFavoritePlace(selected) ? "#fff" : "#111",
                  fontWeight: 800,
                }}
              >
                {isFavoritePlace(selected) ? favoriteText.remove : favoriteText.add}
              </button>

              <button
                onClick={() => {
                  const text = `${selected.coords[1]}, ${selected.coords[0]}`;
                  navigator.clipboard?.writeText(text);
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  background: "#fff",
                  fontWeight: 800,
                }}
              >
                {tr.copy}
              </button>

              {!routeExists && (
                <button
                  onClick={openRouteFromUserPosition}
                  disabled={routeLoading}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: routeLoading ? "wait" : "pointer",
                    background: routeLoading ? "#f3f3f3" : "#fff",
                    opacity: routeLoading ? 0.75 : 1,
                    fontWeight: 800,
                  }}
                >
                  {routeLoading ? tr.routeLoading : tr.routeGps}
                </button>
              )}

              {routeExists && (
                <button
                  onClick={clearDrivingRoute}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    background: "#fff",
                    fontWeight: 800,
                  }}
                >
                  {tr.clearRoute}
                </button>
              )}

              {has3D && (
                <button
                  onClick={onOpenModelViewer}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    background: "#fff",
                    fontWeight: 800,
                  }}
                >
                  {tr.show3d}
                </button>
              )}

              {nearbyPlaces.length > 0 && (
                <button
                  onClick={() => setShowNearby((value) => !value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    background: showNearby ? "#111" : "#fff",
                    color: showNearby ? "#fff" : "#111",
                    fontWeight: 800,
                  }}
                >
                  {tr.nearby}
                </button>
              )}
            </div>
          )}

          {routeInfo && (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
              {tr.distance}: <b>{routeInfo.distanceKm.toFixed(1)} км</b> · {tr.time}: <b>{Math.round(routeInfo.durationMin)} {tr.min}</b>
            </div>
          )}

          {showNearby && nearbyPlaces.length > 0 && (
            <div
              style={{
                marginTop: 10,
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  fontWeight: 900,
                  fontSize: 13,
                  borderBottom: "1px solid rgba(0,0,0,0.07)",
                }}
              >
                {tr.nearest}
              </div>

              {nearbyPlaces.map((place) => (
                <button
                  key={`${place.id ?? place.name}-nearby`}
                  type="button"
                  onClick={() => openPlace(place)}
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    background: "transparent",
                    padding: "8px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 800 }}>
                    {localizePlace(place, language)?.name ?? place.name}
                  </span>
                  <span style={{ opacity: 0.68 }}>{place.distanceKm.toFixed(1)} км</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Close selected place panel"
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
          ×
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.45 }}>{selectedView.short}</div>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800 }}>{tr.more}</summary>

        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            lineHeight: 1.45,
            maxHeight: "30vh",
            overflowY: "auto",
            paddingRight: 6,
          }}
        >
          {selectedView.full}

          {selected.images?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setShowGallery((v) => !v)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  background: "#fff",
                  fontWeight: 800,
                }}
              >
                {showGallery ? tr.closeImages : tr.images} ({selected.images.length})
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
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    if (event.currentTarget.dataset.fallbackApplied === "1") return;
                    event.currentTarget.dataset.fallbackApplied = "1";
                    event.currentTarget.src = imageFallback;
                  }}
                  style={{
                    width: "100%",
                    display: "block",
                    maxHeight: 160,
                    objectFit: "cover",
                  }}
                />

                {selected.images.length > 1 && (
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() =>
                      setSlideIndex((i) => (i - 1 + selected.images.length) % selected.images.length)
                    }
                    style={{
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
                      lineHeight: "36px",
                    }}
                  >
                    ‹
                  </button>
                )}

                {selected.images.length > 1 && (
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setSlideIndex((i) => (i + 1) % selected.images.length)}
                    style={{
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
                      lineHeight: "36px",
                    }}
                  >
                    ›
                  </button>
                )}

                {selected.images.length > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      right: 10,
                      bottom: 10,
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {slideIndex + 1} / {selected.images.length}
                  </div>
                )}
              </div>

              {selected.images.length > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
                  {selected.images.map((_, i) => (
                    <button
                      type="button"
                      aria-label={`Show image ${i + 1}`}
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
