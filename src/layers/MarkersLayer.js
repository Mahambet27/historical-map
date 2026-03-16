import mapboxgl from "mapbox-gl";
import { isLngLatOk, clearMarkersList } from "../utils/mapHelpers";

export function clearHistoricalMarkers(markersRef) {
  clearMarkersList(markersRef);
}

export function drawHistoricalMarkers({ map, markersRef, list, onMarkerClick, enabled = true }) {
  if (!map) return;

  clearMarkersList(markersRef);

  if (!enabled) return;
  if (!Array.isArray(list)) return;

  list.forEach((place) => {
    const coords = place?.coords;
    if (!isLngLatOk(coords)) return;

    const el = document.createElement("div");
    el.style.width = "14px";
    el.style.height = "14px";
    el.style.borderRadius = "999px";
    el.style.background = "#d11";
    el.style.boxShadow = "0 0 0 4px rgba(209,17,17,0.22)";
    el.style.cursor = "pointer";

    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (typeof onMarkerClick === "function") {
        onMarkerClick(place);
      }
    });

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(coords)
      .addTo(map);

    markersRef.current.push(marker);
  });
}