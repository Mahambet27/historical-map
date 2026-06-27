import { normalizeName } from "../../lib/mapHelpers";
import MapSearchFilters from "./MapSearchFilters.jsx";
import {
  favoriteText,
  getPlaceType,
  localizePlace,
} from "./mapViewUtils.js";

export default function MapSidebar({
  eras,
  filteredPlaces,
  isFavoritePlace,
  language,
  onlyWithMedia,
  openPlace,
  openTarbagataiFromMap,
  openZaysanFromMap,
  placeTypes,
  query,
  safeFavoritePlaceIds,
  selectedEra,
  selectedType,
  setOnlyWithMedia,
  setQuery,
  setSelectedType,
  setShowFavoritesOnly,
  setTourIndex,
  showFavoritesOnly,
  toggleFavoritePlace,
  tourIndex,
  tourOn,
  tr,
}) {
  return (
    <div
      className="hm-sidebar"
      style={{
        position: "absolute",
        top: 78,
        left: 16,
        width: 410,
        maxWidth: "92vw",
        height: "calc(100vh - 112px)",
        maxHeight: "calc(100vh - 112px)",
        overflow: "hidden",
        background: "rgba(255,255,255,0.92)",
        borderRadius: 14,
        zIndex: 22,
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
        fontFamily: "system-ui, Arial",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MapSearchFilters
        eras={eras}
        filteredPlaces={filteredPlaces}
        onlyWithMedia={onlyWithMedia}
        placeTypes={placeTypes}
        query={query}
        safeFavoritePlaceIds={safeFavoritePlaceIds}
        selectedEra={selectedEra}
        selectedType={selectedType}
        setOnlyWithMedia={setOnlyWithMedia}
        setQuery={setQuery}
        setSelectedType={setSelectedType}
        setShowFavoritesOnly={setShowFavoritesOnly}
        showFavoritesOnly={showFavoritesOnly}
        tourIndex={tourIndex}
        tourOn={tourOn}
        tr={tr}
      />

      <div
        className="hm-place-list"
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        {filteredPlaces.map((place, index) => {
          const placeView = localizePlace(place, language);
          const isFavorite = isFavoritePlace(place);
          const normalizedName = normalizeName(place?.name);
          const isTarbagatai =
            normalizedName === normalizeName("Тарбағатай тауы") ||
            normalizedName === normalizeName("Тарбагатай тауы");
          const isZaysan =
            normalizedName === normalizeName("Зайсан көлі") ||
            normalizedName === normalizeName("Зайсан колы");

          const openListPlace = () => {
            if (tourOn) setTourIndex(index);

            if (isTarbagatai) {
              openTarbagataiFromMap(place);
              return;
            }

            if (isZaysan) {
              openZaysanFromMap(place);
              return;
            }

            openPlace(place);
          };

          return (
            <div
              className={`hm-place-card${
                tourOn && index === tourIndex ? " hm-place-card--active" : ""
              }`}
              key={place.id ?? `${place.name}-${index}`}
              role="button"
              tabIndex={0}
              onClick={openListPlace}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openListPlace();
                }
              }}
              style={{
                minHeight: "auto",
                padding: "14px 88px 14px 16px",
                cursor: "pointer",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                lineHeight: 1.35,
                overflow: "visible",
                background:
                  tourOn && index === tourIndex ? "rgba(0,0,0,0.06)" : "transparent",
              }}
            >
              <div style={{ fontWeight: 900, lineHeight: 1.25 }}>
                {placeView.name || "Атауы жоқ"}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.35, opacity: 0.7, marginTop: 5 }}>
                {placeView.shortDescription
                  ? placeView.shortDescription.slice(0, 90)
                  : "Қысқаша ақпарат жоқ."}
                {placeView.shortDescription && placeView.shortDescription.length > 90
                  ? "…"
                  : ""}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <span>{getPlaceType(placeView)}</span>
                {isFavorite && <span>{favoriteText.count}</span>}
              </div>
              <button
                className={`hm-favorite-button${isFavorite ? " hm-favorite-button--active" : ""}`}
                type="button"
                aria-pressed={isFavorite}
                aria-label={isFavorite ? favoriteText.remove : favoriteText.add}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFavoritePlace(place);
                }}
              >
                {isFavorite ? "Saved" : "Save"}
              </button>
            </div>
          );
        })}

        {filteredPlaces.length === 0 && (
          <div className="hm-empty-state" style={{ padding: 12, opacity: 0.7, fontSize: 13 }}>
            {tr.noResults}
          </div>
        )}
      </div>
    </div>
  );
}
