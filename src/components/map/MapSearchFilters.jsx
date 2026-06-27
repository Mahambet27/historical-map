import { favoriteText, hasPlaceMedia } from "./mapViewUtils.js";

export default function MapSearchFilters({
  eras,
  filteredPlaces,
  onlyWithMedia,
  placeTypes,
  query,
  safeFavoritePlaceIds,
  selectedEra,
  selectedType,
  setOnlyWithMedia,
  setQuery,
  setSelectedType,
  setShowFavoritesOnly,
  showFavoritesOnly,
  tourIndex,
  tourOn,
  tr,
}) {
  const hasActiveFilters = query || selectedType !== "all" || onlyWithMedia || showFavoritesOnly;

  return (
    <div style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 5 }}>
        {tr.search} ({tr.era.toLowerCase()}: {eras[selectedEra]})
      </div>

      <input
        className="hm-search-input"
        type="search"
        aria-label={tr.search}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={tr.searchPlaceholder}
        style={{
          width: "100%",
          padding: "10px 11px",
          borderRadius: 12,
          border: "1px solid #ddd",
          outline: "none",
          fontSize: 15,
        }}
      />

      <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
        <select
          className="hm-select"
          aria-label={tr.allTypes}
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
          style={{
            width: "100%",
            padding: "9px 10px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            fontSize: 15,
            outline: "none",
          }}
        >
          <option value="all">{tr.allTypes}</option>
          {placeTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <label
          className="hm-checkbox-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={onlyWithMedia}
            onChange={(event) => setOnlyWithMedia(event.target.checked)}
          />
          {tr.mediaOnly}
        </label>

        <label
          className="hm-checkbox-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(event) => setShowFavoritesOnly(event.target.checked)}
          />
          {favoriteText.favoritesOnly}
        </label>

        {hasActiveFilters && (
          <button
            className="hm-ghost-button"
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedType("all");
              setOnlyWithMedia(false);
              setShowFavoritesOnly(false);
            }}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: "pointer",
              background: "#fff",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {tr.clearFilters}
          </button>
        )}
      </div>

      <div style={{ marginTop: 7, fontSize: 12, opacity: 0.75 }}>
        {tr.found}: <b>{filteredPlaces.length}</b>
        {" В· "}
        {tr.media}: <b>{filteredPlaces.filter(hasPlaceMedia).length}</b>
        {" В· "}
        {favoriteText.count}: <b>{safeFavoritePlaceIds.length}</b>
      </div>

      {tourOn && filteredPlaces.length > 0 && (
        <div style={{ marginTop: 5, fontSize: 12, opacity: 0.75 }}>
          {tr.tour}: <b>{tourIndex + 1}</b> / {filteredPlaces.length}
        </div>
      )}
    </div>
  );
}
