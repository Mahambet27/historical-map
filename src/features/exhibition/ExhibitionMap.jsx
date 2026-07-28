import { useEffect, useRef, useState } from "react";
import { mapboxToken, isMapboxTokenConfigured } from "../../config/env.js";
import { getGeometriesAtYear } from "../../data/exhibition/entityGeometries.js";
import { exhibitionPlaces } from "../../data/exhibition/places.js";
import ExhibitionMapFallback from "./ExhibitionMapFallback.jsx";

const emptyCollection = { type: "FeatureCollection", features: [] };

export default function ExhibitionMap({ state, language, text, comparison, reducedMotion }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapFailed, setMapFailed] = useState(!isMapboxTokenConfigured);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!isMapboxTokenConfigured || !containerRef.current) return undefined;
    let cancelled = false;
    let map;

    import("mapbox-gl")
      .then(({ default: mapboxgl }) => {
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = mapboxToken;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [67.2, 48],
          zoom: 4.05,
          pitch: 28,
          bearing: 0,
          maxBounds: [[42, 36], [92, 58]],
          attributionControl: false,
          cooperativeGestures: false,
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => {
          if (cancelled) return;
          map.addSource("ex-territories", { type: "geojson", data: emptyCollection });
          map.addLayer({ id: "ex-territories-fill", type: "fill", source: "ex-territories", paint: { "fill-color": ["match", ["get", "confidenceLevel"], "high", "#2c9281", "medium", "#c99b4b", "low", "#b27b57", "#c99b4b"], "fill-opacity": ["match", ["get", "confidenceLevel"], "low", 0.18, 0.3] } });
          map.addLayer({ id: "ex-territories-line", type: "line", source: "ex-territories", paint: { "line-color": ["match", ["get", "confidenceLevel"], "high", "#88dfc8", "medium", "#f1cd84", "#e4aa80"], "line-width": ["match", ["get", "confidenceLevel"], "high", 3, "medium", 2, 1.5], "line-dasharray": ["match", ["get", "confidenceLevel"], "low", ["literal", [3, 3]], ["literal", [1, 0]]] } });
          map.addSource("ex-places", { type: "geojson", data: emptyCollection });
          map.addLayer({ id: "ex-places-dot", type: "circle", source: "ex-places", paint: { "circle-radius": 6, "circle-color": "#f1cc84", "circle-stroke-color": "#0b1c29", "circle-stroke-width": 2 } });
          map.addLayer({ id: "ex-places-label", type: "symbol", source: "ex-places", layout: { "text-field": ["get", "label"], "text-offset": [0, 1.4], "text-size": 12 }, paint: { "text-color": "#f8f5ef", "text-halo-color": "#0b1c29", "text-halo-width": 1.5 } });
          setMapReady(true);
          setMapFailed(false);
        });
        map.on("error", (event) => {
          if (!map.loaded() && event?.error) setMapFailed(true);
        });
      })
      .catch(() => setMapFailed(true));

    return () => {
      cancelled = true;
      mapRef.current = null;
      map?.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map?.loaded()) return;
    const geometries = getGeometriesAtYear(state.year);
    if (comparison) {
      geometries.push(...getGeometriesAtYear(comparison.secondYear).map((item) => ({
        ...item,
        geojson: { ...item.geojson, properties: { ...item.geojson.properties, confidenceLevel: "disputed" } },
      })));
    }
    map.getSource("ex-territories")?.setData({ type: "FeatureCollection", features: geometries.map((item) => item.geojson) });
    map.getSource("ex-places")?.setData({
      type: "FeatureCollection",
      features: exhibitionPlaces
        .filter((place) => state.placeIds.includes(place.id))
        .map((place) => ({ type: "Feature", properties: { label: place.names[language] || place.names.ru }, geometry: { type: "Point", coordinates: place.coords } })),
    });
    const method = reducedMotion ? "jumpTo" : "easeTo";
    map[method]({ ...state.camera, duration: reducedMotion ? 0 : 900 });
  }, [state, language, comparison, reducedMotion, mapReady]);

  if (mapFailed) return <ExhibitionMapFallback {...{ state, language, text, comparison }} />;
  return <div ref={containerRef} className="ex-mapbox" aria-label={text.mapLabel} />;
}
