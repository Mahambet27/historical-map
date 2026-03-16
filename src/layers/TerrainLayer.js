export function setupTerrain(map, enabled = true) {
  if (!map) return;
  if (!map.isStyleLoaded()) return;

  try {
    if (!map.getSource("mapbox-dem")) {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 512,
        maxzoom: 14,
      });
    }

    if (enabled) {
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.9 });
    } else {
      map.setTerrain(null);
    }
  } catch (error) {
    console.warn("Terrain unavailable:", error);
  }
}

export function setupSky(map, enabled = true) {
  if (!map) return;
  if (!map.isStyleLoaded()) return;

  try {
    if (!map.getLayer("sky")) {
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0, 0],
          "sky-atmosphere-sun-intensity": 10,
          "sky-opacity": 1,
        },
      });
    }

    if (map.getLayer("sky")) {
      map.setLayoutProperty("sky", "visibility", enabled ? "visible" : "none");
    }
  } catch (error) {
    console.warn("Sky unavailable:", error);
  }
}