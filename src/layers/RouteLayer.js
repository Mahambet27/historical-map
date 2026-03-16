import { getBoundsFromCoords } from "../utils/mapHelpers";
import { LAYER_IDS } from "../utils/mapConfig";

function isMapStyleReady(map) {
  return !!map && typeof map.isStyleLoaded === "function" && map.isStyleLoaded();
}

export function setupRouteLayer(map, visible = true) {
  if (!isMapStyleReady(map)) return;

  try {
    if (!map.getSource(LAYER_IDS.route.source)) {
      map.addSource(LAYER_IDS.route.source, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
    }

    if (!map.getLayer(LAYER_IDS.route.glow)) {
      map.addLayer({
        id: LAYER_IDS.route.glow,
        type: "line",
        source: LAYER_IDS.route.source,
        layout: {
          visibility: visible ? "visible" : "none",
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#ff3b30",
          "line-width": 14,
          "line-opacity": 0.18,
          "line-blur": 2,
        },
      });
    }

    if (!map.getLayer(LAYER_IDS.route.line)) {
      map.addLayer({
        id: LAYER_IDS.route.line,
        type: "line",
        source: LAYER_IDS.route.source,
        layout: {
          visibility: visible ? "visible" : "none",
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#ff3b30",
          "line-width": 5,
          "line-opacity": 0.95,
        },
      });
    }
  } catch (error) {
    console.warn("setupRouteLayer error:", error);
  }
}

export function setRouteVisibility(map, visible) {
  if (!isMapStyleReady(map)) return;

  try {
    [LAYER_IDS.route.line, LAYER_IDS.route.glow].forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    });
  } catch (error) {
    console.warn("setRouteVisibility error:", error);
  }
}

export function clearDrivingRoute(map) {
  if (!isMapStyleReady(map)) return;

  try {
    const src = map.getSource(LAYER_IDS.route.source);
    if (!src || typeof src.setData !== "function") return;

    src.setData({
      type: "FeatureCollection",
      features: [],
    });
  } catch (error) {
    console.warn("clearDrivingRoute error:", error);
  }
}

export function hasRouteOnMap(map) {
  if (!isMapStyleReady(map)) return false;

  try {
    const src = map.getSource(LAYER_IDS.route.source);
    if (!src || !src._data) return false;

    return Array.isArray(src._data?.features) && src._data.features.length > 0;
  } catch {
    return false;
  }
}

export async function buildDrivingRoute(map, from, to) {
  if (!isMapStyleReady(map)) return false;
  if (!from || !to) return false;

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token) {
    alert("VITE_MAPBOX_TOKEN жоқ (.env тексер).");
    return false;
  }

  try {
    const src = map.getSource(LAYER_IDS.route.source);
    if (src && typeof src.setData === "function") {
      src.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  } catch (error) {
    console.warn("route source reset error:", error);
  }

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${from[0]},${from[1]};${to[0]},${to[1]}` +
    `?geometries=geojson&overview=full&steps=false&access_token=${token}`;

  let res;

  try {
    res = await fetch(url);
  } catch (error) {
    console.error(error);
    alert("Интернет/желіні тексеріңіз. Directions API сұранысы өтпеді.");
    return false;
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("Directions API error:", res.status, txt);
    alert(`Маршрут салынбады. HTTP ${res.status}`);
    return false;
  }

  const data = await res.json();
  const route = data?.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    alert("Маршрут табылмады.");
    return false;
  }

  try {
    const routeSource = map.getSource(LAYER_IDS.route.source);
    if (!routeSource || typeof routeSource.setData !== "function") return false;

    routeSource.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        },
      ],
    });
  } catch (error) {
    console.warn("routeSource.setData error:", error);
    return false;
  }

  const bounds = getBoundsFromCoords(route.geometry.coordinates);
  if (bounds) {
    map.fitBounds(bounds, {
      padding: 80,
      duration: 900,
    });
  }

  return true;
}