import { getBoundsFromCoords } from "../lib/mapHelpers";
import { LAYER_IDS } from "../lib/mapConfig";

export function setLayerVisibility(map, ids, visible) {
  if (!map) return;
  if (!map.isStyleLoaded()) return;

  ids.forEach((id) => {
    try {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    } catch (e) {
      console.warn(`Layer visibility failed for ${id}`, e);
    }
  });
}

export function fitPolygon(map, geojson) {
  if (!map) return;

  const coords = geojson?.features?.[0]?.geometry?.coordinates?.[0] || [];
  const bounds = getBoundsFromCoords(coords);

  if (bounds) {
    map.fitBounds(bounds, {
      padding: 70,
      duration: 900,
    });
  }
}

export function hideTarbagatai(map) {
  setLayerVisibility(
    map,
    [
      LAYER_IDS.tarbagatai.fill,
      LAYER_IDS.tarbagatai.outline,
      LAYER_IDS.tarbagatai.glow,
      LAYER_IDS.tarbagatai.hover,
    ],
    false
  );
}

export function hideZaysan(map) {
  setLayerVisibility(
    map,
    [
      LAYER_IDS.zaysan.fill,
      LAYER_IDS.zaysan.outline,
      LAYER_IDS.zaysan.glow,
      LAYER_IDS.zaysan.hover,
    ],
    false
  );
}

export function showTarbagatai(map) {
  setLayerVisibility(
    map,
    [
      LAYER_IDS.tarbagatai.fill,
      LAYER_IDS.tarbagatai.outline,
      LAYER_IDS.tarbagatai.glow,
    ],
    true
  );
}

export function showZaysan(map) {
  setLayerVisibility(
    map,
    [
      LAYER_IDS.zaysan.fill,
      LAYER_IDS.zaysan.outline,
      LAYER_IDS.zaysan.glow,
    ],
    true
  );
}

export function isTarbagataiVisible(map) {
  if (!map) return false;
  if (!map.isStyleLoaded()) return false;
  if (!map.getLayer(LAYER_IDS.tarbagatai.fill)) return false;

  try {
    return map.getLayoutProperty(LAYER_IDS.tarbagatai.fill, "visibility") !== "none";
  } catch {
    return false;
  }
}

export function setupRegionLayers({
  map,
  tarbagataiGeojson,
  zaysanGeojson,
  onTarbagataiClick,
  onZaysanClick,
}) {
  if (!map) return;
  if (!map.isStyleLoaded()) return;

  if (!map.getSource(LAYER_IDS.tarbagatai.source)) {
    map.addSource(LAYER_IDS.tarbagatai.source, {
      type: "geojson",
      data: tarbagataiGeojson,
    });
  }

  if (!map.getLayer(LAYER_IDS.tarbagatai.glow)) {
    map.addLayer({
      id: LAYER_IDS.tarbagatai.glow,
      type: "line",
      source: LAYER_IDS.tarbagatai.source,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#ff3b30",
        "line-width": 14,
        "line-opacity": 0.18,
        "line-blur": 6,
      },
    });
  }

  if (!map.getLayer(LAYER_IDS.tarbagatai.fill)) {
    map.addLayer({
      id: LAYER_IDS.tarbagatai.fill,
      type: "fill",
      source: LAYER_IDS.tarbagatai.source,
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#ff3b30",
        "fill-opacity": 0.18,
      },
    });
  }

  if (!map.getLayer(LAYER_IDS.tarbagatai.hover)) {
    map.addLayer({
      id: LAYER_IDS.tarbagatai.hover,
      type: "line",
      source: LAYER_IDS.tarbagatai.source,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#ffffff",
        "line-width": 5,
        "line-opacity": 0.9,
      },
    });
  }

  if (!map.getLayer(LAYER_IDS.tarbagatai.outline)) {
    map.addLayer({
      id: LAYER_IDS.tarbagatai.outline,
      type: "line",
      source: LAYER_IDS.tarbagatai.source,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#ff3b30",
        "line-width": 3,
        "line-opacity": 0.9,
      },
    });
  }

  if (!map.getSource(LAYER_IDS.zaysan.source)) {
    map.addSource(LAYER_IDS.zaysan.source, {
      type: "geojson",
      data: zaysanGeojson,
    });
  }

  if (!map.getLayer(LAYER_IDS.zaysan.glow)) {
    map.addLayer({
      id: LAYER_IDS.zaysan.glow,
      type: "line",
      source: LAYER_IDS.zaysan.source,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#5dbbff",
        "line-width": 16,
        "line-opacity": 0.22,
        "line-blur": 8,
      },
    });
  }

  if (!map.getLayer(LAYER_IDS.zaysan.fill)) {
    map.addLayer({
      id: LAYER_IDS.zaysan.fill,
      type: "fill",
      source: LAYER_IDS.zaysan.source,
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#3e98ff",
        "fill-opacity": 0.62,
      },
    });
  }

  if (!map.getLayer(LAYER_IDS.zaysan.hover)) {
    map.addLayer({
      id: LAYER_IDS.zaysan.hover,
      type: "line",
      source: LAYER_IDS.zaysan.source,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#ffffff",
        "line-width": 4,
        "line-opacity": 0.95,
      },
    });
  }

  if (!map.getLayer(LAYER_IDS.zaysan.outline)) {
    map.addLayer({
      id: LAYER_IDS.zaysan.outline,
      type: "line",
      source: LAYER_IDS.zaysan.source,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#1b63d4",
        "line-width": 2.4,
        "line-opacity": 0.95,
      },
    });
  }

  const bindHover = (fillId, hoverId, clickHandler) => {
    map.on("mouseenter", fillId, () => {
      map.getCanvas().style.cursor = "pointer";
      if (map.getLayer(hoverId)) {
        map.setLayoutProperty(hoverId, "visibility", "visible");
      }
    });

    map.on("mouseleave", fillId, () => {
      map.getCanvas().style.cursor = "";
      if (map.getLayer(hoverId)) {
        map.setLayoutProperty(hoverId, "visibility", "none");
      }
    });

    map.on("click", fillId, clickHandler);
  };

  bindHover(LAYER_IDS.tarbagatai.fill, LAYER_IDS.tarbagatai.hover, onTarbagataiClick);
  bindHover(LAYER_IDS.zaysan.fill, LAYER_IDS.zaysan.hover, onZaysanClick);
}
