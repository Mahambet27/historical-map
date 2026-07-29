import { useEffect, useRef, useState } from "react";
import { mapboxToken, isMapboxTokenConfigured } from "../../config/env.js";
import { getGeometriesAtYear } from "../../data/exhibition/entityGeometries.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { getEntityLabelsAtYear } from "../../data/exhibition/entityLabels.js";
import { exhibitionPlaces } from "../../data/exhibition/places.js";
import {
  ENTITY_LABEL_LAYOUT,
  ENTITY_LABEL_PAINT,
  TERRITORY_FILL_PAINT,
  TERRITORY_LINE_PAINT,
  getExtrusionPaint,
  hideBaseMapLabels,
  applyPaletteToMap,
} from "./mapStyleUtils.js";
import ExhibitionMapFallback from "./ExhibitionMapFallback.jsx";
import { buildTerritoryCollection } from "./mapDataUtils.js";
import {
  recordExhibitionMetric,
  recordExhibitionMetricOnce,
  sampleExhibitionFps,
  timeExhibitionWork,
} from "./performanceTelemetry.js";

const emptyCollection = { type: "FeatureCollection", features: [] };
const entityById = new Map(allHistoricalEntities.map((entity) => [entity.id, entity]));
const local = (value, language) => value?.[language] || value?.ru || "";

const buildLabelCollection = (selectedYear, language) => ({
  type: "FeatureCollection",
  features: getEntityLabelsAtYear(selectedYear)
    .map((item) => {
      const entity = entityById.get(item.entityId);
      if (!entity) return null;
      return {
        type: "Feature",
        id: item.id,
        properties: {
          entityId: item.entityId,
          label: local(entity.names, language),
          rotation: item.labelRotation,
          size: item.labelSize,
        },
        geometry: { type: "Point", coordinates: item.labelPoint },
      };
    })
    .filter(Boolean),
});

const addExhibitionLayers = (map, { light, reducedMotion }) => {
  hideBaseMapLabels(map);
  if (!map.getSource("ex-territories")) {
    map.addSource("ex-territories", { type: "geojson", data: emptyCollection, promoteId: "id" });
    map.addLayer({
      id: "ex-territories-fill",
      type: "fill",
      source: "ex-territories",
      paint: TERRITORY_FILL_PAINT,
    });
    map.addLayer({
      id: "ex-territories-extrusion",
      type: "fill-extrusion",
      source: "ex-territories",
      paint: getExtrusionPaint({ light, reducedMotion }),
    });
    map.addLayer({
      id: "ex-territories-line",
      type: "line",
      source: "ex-territories",
      paint: TERRITORY_LINE_PAINT,
    });
  }
  if (!map.getSource("ex-places")) {
    map.addSource("ex-places", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "ex-places-dot",
      type: "circle",
      source: "ex-places",
      minzoom: 5,
      paint: {
        "circle-radius": 5,
        "circle-color": "#f1cc84",
        "circle-stroke-color": "#0b1c29",
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: "ex-places-label",
      type: "symbol",
      source: "ex-places",
      minzoom: 5.5,
      layout: { "text-field": ["get", "label"], "text-offset": [0, 1.35], "text-size": 12 },
      paint: {
        "text-color": "#f8f5ef",
        "text-halo-color": "#0b1c29",
        "text-halo-width": 1.5,
      },
    });
  }
  if (!map.getSource("ex-entity-label-points")) {
    map.addSource("ex-entity-label-points", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "ex-entity-labels",
      type: "symbol",
      source: "ex-entity-label-points",
      layout: ENTITY_LABEL_LAYOUT,
      paint: ENTITY_LABEL_PAINT,
    });
  }
};

export default function ExhibitionMap({
  selectedYear,
  activeSnapshot,
  activeEra,
  language,
  text,
  comparison,
  reducedMotion,
  selectedEntityId,
  onSelectEntity,
  palette,
  effectiveQuality,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const onSelectEntityRef = useRef(onSelectEntity);
  const paletteRef = useRef(palette);
  const selectedEntityIdRef = useRef(selectedEntityId);
  const hoveredFeatureRef = useRef(null);
  const selectedFeatureIdsRef = useRef([]);
  const [mapFailed, setMapFailed] = useState(!isMapboxTokenConfigured);
  const [styleRevision, setStyleRevision] = useState(0);
  const qualityLight = effectiveQuality === "light";

  onSelectEntityRef.current = onSelectEntity;
  paletteRef.current = palette;
  selectedEntityIdRef.current = selectedEntityId;

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
          pitch: qualityLight ? 18 : 38,
          bearing: 0,
          maxBounds: [[38, 31], [101, 63]],
          attributionControl: false,
          cooperativeGestures: false,
          antialias: !qualityLight,
        });
        mapRef.current = map;
        recordExhibitionMetricOnce("map-init");
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        const handleStyleLoad = () => {
          if (cancelled) return;
          addExhibitionLayers(map, { light: qualityLight, reducedMotion });
          // Re-apply after every style load so Mapbox labels never return.
          hideBaseMapLabels(map);
          applyPaletteToMap(map, paletteRef.current);
          setStyleRevision((revision) => revision + 1);
          setMapFailed(false);
          recordExhibitionMetricOnce("map-first-interactive");
        };
        map.on("style.load", handleStyleLoad);
        map.on("mousemove", "ex-territories-fill", (event) => {
          const id = event.features?.[0]?.id;
          if (id === hoveredFeatureRef.current) return;
          if (hoveredFeatureRef.current !== null) {
            map.setFeatureState(
              { source: "ex-territories", id: hoveredFeatureRef.current },
              { hover: false }
            );
          }
          hoveredFeatureRef.current = id ?? null;
          if (id !== undefined) map.setFeatureState({ source: "ex-territories", id }, { hover: true });
        });
        map.on("mouseleave", "ex-territories-fill", () => {
          if (hoveredFeatureRef.current !== null) {
            map.setFeatureState(
              { source: "ex-territories", id: hoveredFeatureRef.current },
              { hover: false }
            );
          }
          hoveredFeatureRef.current = null;
        });
        map.on("click", "ex-territories-fill", (event) => {
          const entityId = event.features?.[0]?.properties?.entityId;
          if (entityId) onSelectEntityRef.current?.(entityId);
        });
        map.on("mouseenter", "ex-territories-fill", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "ex-territories-fill", () => { map.getCanvas().style.cursor = ""; });
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
  }, [qualityLight, reducedMotion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    const frame = requestAnimationFrame(() => {
      const territories = buildTerritoryCollection(selectedYear);
      if (comparison) {
        const comparisonFeatures = buildTerritoryCollection(comparison.secondYear).features.map(
          (feature) => ({
            ...feature,
            id: `compare-${feature.id}`,
            properties: {
              ...feature.properties,
              id: `compare-${feature.properties.id}`,
              color: "#4f9f99",
              borderColor: "#9be0d7",
            },
          })
        );
        territories.features.push(...comparisonFeatures);
      }
      timeExhibitionWork("territory-source-update", () =>
        map.getSource("ex-territories")?.setData(territories)
      );
      const selectedIds = selectedEntityIdRef.current
        ? getGeometriesAtYear(selectedYear)
            .filter((geometry) => geometry.entityId === selectedEntityIdRef.current)
            .map((geometry) => geometry.id)
        : [];
      selectedIds.forEach((id) => {
        map.setFeatureState({ source: "ex-territories", id }, { selected: true });
      });
      selectedFeatureIdsRef.current = selectedIds;
      recordExhibitionMetricOnce("first-timeline-update", selectedYear, { unit: "year" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedYear, comparison, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    map.getSource("ex-entity-label-points")?.setData(buildLabelCollection(selectedYear, language));
  }, [selectedYear, language, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    map.getSource("ex-places")?.setData({
      type: "FeatureCollection",
      features: exhibitionPlaces
        .filter((place) => activeSnapshot?.placeIds?.includes(place.id))
        .map((place) => ({
          type: "Feature",
          properties: { label: local(place.names, language) },
          geometry: { type: "Point", coordinates: place.coords },
        })),
    });
  }, [activeSnapshot, language, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    const camera = activeSnapshot?.camera || activeEra?.camera || {
      center: [67.2, 48], zoom: 4.05, pitch: qualityLight ? 18 : 38, bearing: 0,
    };
    map[reducedMotion ? "jumpTo" : "easeTo"]({
      ...camera,
      pitch: qualityLight ? Math.min(camera.pitch || 0, 18) : camera.pitch,
      duration: reducedMotion ? 0 : 800,
    });
  }, [
    activeSnapshot, activeEra, reducedMotion, styleRevision, qualityLight,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    selectedFeatureIdsRef.current.forEach((id) => {
      map.setFeatureState({ source: "ex-territories", id }, { selected: false });
    });
    const nextIds = selectedEntityId
      ? getGeometriesAtYear(selectedYear)
          .filter((geometry) => geometry.entityId === selectedEntityId)
          .map((geometry) => geometry.id)
      : [];
    nextIds.forEach((id) => {
      map.setFeatureState({ source: "ex-territories", id }, { selected: true });
    });
    selectedFeatureIdsRef.current = nextIds;
  }, [selectedEntityId, selectedYear, comparison, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    applyPaletteToMap(map, palette);
  }, [palette, styleRevision]);

  useEffect(() => {
    if (mapFailed) {
      recordExhibitionMetric("fallback-usage", 1, { unit: "boolean" });
      return undefined;
    }
    return sampleExhibitionFps();
  }, [mapFailed]);

  useEffect(() => {
    const stopHiddenAnimation = () => {
      if (document.hidden) mapRef.current?.stop();
    };
    document.addEventListener("visibilitychange", stopHiddenAnimation);
    return () => document.removeEventListener("visibilitychange", stopHiddenAnimation);
  }, []);

  if (mapFailed) {
    return (
      <ExhibitionMapFallback
        {...{ selectedYear, activeSnapshot, language, text, comparison, selectedEntityId }}
        onSelectEntity={onSelectEntity}
      />
    );
  }
  const legendItems = getGeometriesAtYear(selectedYear)
    .map((geometry) => ({ geometry, entity: entityById.get(geometry.entityId) }))
    .filter((item) => item.entity);
  return (
    <>
      <div ref={containerRef} className="ex-mapbox" aria-label={text.mapLabel} />
      <aside className="ex-map-legend" aria-label={text.mapLegend}>
        <strong>{text.mapLegend}</strong>
        {legendItems.map(({ entity, geometry }) => (
          <button
            key={entity.id}
            className={entity.id === selectedEntityId ? "is-active" : ""}
            onClick={() => onSelectEntity?.(entity.id)}
          >
            <i style={{ background: entity.color, borderColor: entity.borderColor }} />
            <span>{local(entity.names, language)}</span>
            {geometry.verificationStatus === "needs_review" && (
              <small title={text.needsReview}>○</small>
            )}
          </button>
        ))}
      </aside>
    </>
  );
}
