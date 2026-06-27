import mapboxgl from "mapbox-gl";

import { isLngLatOk } from "../../lib/mapHelpers";
import { escapeHtml, getPlaceType, localizePlace } from "./mapViewUtils";

export const drawHistoricalMarkerList = ({
  list,
  language,
  markersRef,
  hoverPopupRef,
  map,
  onOpenPlace,
}) => {
  if (!map) return;

  (Array.isArray(list) ? list : []).forEach((place) => {
    const coords = place?.coords;
    if (!isLngLatOk(coords)) return;

    const placeView = localizePlace(place, language);
    const marker = new mapboxgl.Marker({ color: "#d11" }).setLngLat(coords).addTo(map);
    marker.getElement().style.cursor = "pointer";

    marker.getElement().addEventListener("click", (event) => {
      event.stopPropagation();
      onOpenPlace(place);
    });

    marker.getElement().addEventListener("mouseenter", () => {
      if (hoverPopupRef.current) hoverPopupRef.current.remove();

      hoverPopupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
        maxWidth: "260px",
      })
        .setLngLat(coords)
        .setHTML(
          `<strong>${escapeHtml(placeView?.name || "Historical place")}</strong><br/><span>${escapeHtml(
            (placeView?.shortDescription || getPlaceType(placeView)).toString().slice(0, 120)
          )}</span>`
        )
        .addTo(map);
    });

    marker.getElement().addEventListener("mouseleave", () => {
      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
        hoverPopupRef.current = null;
      }
    });

    markersRef.current.push(marker);
  });
};
