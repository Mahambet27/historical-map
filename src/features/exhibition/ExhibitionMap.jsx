import { useEffect, useRef, useState } from "react";
import { mapboxToken, isMapboxTokenConfigured } from "../../config/env.js";
import { getGeometriesAtYear } from "../../data/exhibition/entityGeometries.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { getEntityLabelsAtYear } from "../../data/exhibition/entityLabels.js";
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
import ArchiveMapOverlay from "./ArchiveMapOverlay.jsx";
import { buildTerritoryCollection } from "./mapDataUtils.js";
import { ensureHistoricalLayerOrder } from "./layerRegistry.js";
import {
  buildEmptyP1BCollections,
  buildEnvironmentCollection,
  buildHistoricalPlaceCollections,
  buildHydrologyCollection,
  buildRouteCollections,
} from "./p1bMapDataUtils.js";
import {
  recordExhibitionMetric,
  recordExhibitionMetricOnce,
  sampleExhibitionFps,
  timeExhibitionWork,
} from "./performanceTelemetry.js";
import {
  mountArchiveOverlay,
  removeArchiveOverlay,
  updateArchiveOverlayOpacity,
} from "./archiveMapOverlayUtils.js";
import {
  createHistoricalBasemapStyle,
  validateHistoricalBasemap,
} from "./historicalBasemapPolicy.js";
import { isRecordAllowedInOfficialDemo } from "./officialDemoMode.js";

const emptyCollection = { type: "FeatureCollection", features: [] };
const entityById = new Map(allHistoricalEntities.map((entity) => [entity.id, entity]));
const local = (value, language) => value?.[language] || value?.ru || "";

const buildLabelCollection = (selectedYear, language) => ({
  type: "FeatureCollection",
  features: getEntityLabelsAtYear(selectedYear)
    .map((item) => {
      const entity = entityById.get(item.entityId);
      const geometry = getGeometriesAtYear(selectedYear).find(
        (candidate) => candidate.entityId === item.entityId
      );
      if (!entity) return null;
      return {
        type: "Feature",
        id: item.id,
        properties: {
          labelKind: "state",
          entityId: item.entityId,
          label: local(entity.names, language),
          rotation: item.labelRotation,
          size: item.labelSize,
          verificationStatus: geometry?.verificationStatus || "needs_review",
          sourceIds: geometry?.sourceIds || [],
        },
        geometry: { type: "Point", coordinates: item.labelPoint },
      };
    })
    .filter(Boolean),
});

// eslint-disable-next-line react-refresh/only-export-components
export const buildHistoricalLabelCollection = ({
  selectedYear,
  language,
  collections = buildEmptyP1BCollections(),
}) => ({
  type: "FeatureCollection",
  features: [
    ...buildLabelCollection(selectedYear, language).features,
    ...[...(collections.places?.features || []), ...(collections.archaeology?.features || [])]
      .filter((feature) => feature.properties.label)
      .map((feature) => ({
        ...feature,
        id: `label-${feature.id}`,
        properties: { ...feature.properties, labelKind: "place" },
      })),
    ...(collections.hydrology?.features || [])
      .filter((feature) => feature.properties.label && feature.properties.verificationStatus !== "demo_only")
      .map((feature) => ({
        ...feature,
        id: `label-${feature.id}`,
        properties: { ...feature.properties, labelKind: "hydrology" },
      })),
    ...[
      ...(collections.trade?.features || []),
      ...(collections.nomadic?.features || []),
      ...(collections.military?.features || []),
    ]
      .filter((feature) => feature.properties.label && feature.properties.verificationStatus !== "demo_only")
      .map((feature) => ({
        ...feature,
        id: `label-${feature.id}`,
        properties: { ...feature.properties, labelKind: "route" },
      })),
  ],
});

const addExhibitionLayers = (map, { light, reducedMotion }) => {
  hideBaseMapLabels(map);
  if (!map.getSource("historical-terrain-source")) {
    map.addSource("historical-terrain-source", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [[[67.5, 39.5], [82, 39.5], [81, 44.3], [70, 44], [67.5, 39.5]]],
        },
      },
    });
    map.addLayer({
      id: "historical-terrain-subtle",
      type: "fill",
      source: "historical-terrain-source",
      paint: { "fill-color": "#666a6d", "fill-opacity": light ? 0 : 0.08 },
    });
  }
  if (!map.getSource("ex-environment")) {
    map.addSource("ex-environment", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "ex-environment-fill",
      type: "fill",
      source: "ex-environment",
      paint: {
        "fill-color": [
          "match", ["get", "environmentType"],
          "mountain", "#746f61",
          "river_valley", "#497f73",
          "#927d4f",
        ],
        "fill-opacity": light ? 0.14 : 0.22,
      },
    });
  }
  if (!map.getSource("ex-hydrology")) {
    map.addSource("ex-hydrology", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "ex-hydrology-fill",
      type: "fill",
      source: "ex-hydrology",
      paint: { "fill-color": "#2d8193", "fill-opacity": 0.38 },
    });
    map.addLayer({
      id: "ex-hydrology-line",
      type: "line",
      source: "ex-hydrology",
      paint: { "line-color": "#86cfdb", "line-width": 1.5, "line-opacity": 0.8 },
    });
  }
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
    map.addLayer({
      id: "historical-boundary-uncertainty",
      type: "line",
      source: "ex-territories",
      filter: ["==", ["get", "uncertaintyVariant"], "soft-edge"],
      paint: {
        "line-color": "#f3ead5",
        "line-width": light ? 3 : 6,
        "line-opacity": 0.32,
        "line-blur": light ? 0 : 2,
      },
    });
    map.addLayer({
      id: "historical-boundary-patterned",
      type: "line",
      source: "ex-territories",
      filter: ["==", ["get", "uncertaintyVariant"], "patterned"],
      paint: {
        "line-color": "#ffffff",
        "line-width": 3,
        "line-opacity": 0.9,
        "line-dasharray": [6, 3, 1, 3],
      },
    });
    map.addLayer({
      id: "historical-boundary-schematic",
      type: "line",
      source: "ex-territories",
      filter: ["==", ["get", "uncertaintyVariant"], "schematic"],
      paint: {
        "line-color": "#ffffff",
        "line-width": 2,
        "line-opacity": 0.72,
        "line-dasharray": [2, 3],
      },
    });
  }
  if (!map.getSource("ex-trade-routes")) {
    map.addSource("ex-trade-routes", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "ex-trade-route-glow",
      type: "line",
      source: "ex-trade-routes",
      paint: {
        "line-color": "#d7ad5c",
        "line-width": light ? 0 : 7,
        "line-opacity": light ? 0 : 0.16,
        "line-blur": 4,
      },
    });
    map.addLayer({
      id: "ex-trade-route-line",
      type: "line",
      source: "ex-trade-routes",
      paint: {
        "line-color": "#e8bf69",
        "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 5, 3],
        "line-opacity": 0.92,
      },
    });
    map.addLayer({
      id: "ex-trade-route-arrows",
      type: "symbol",
      source: "ex-trade-routes",
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 90,
        "text-field": "›",
        "text-size": 16,
        "text-keep-upright": false,
      },
      paint: { "text-color": "#fff0bd", "text-halo-color": "#513c1b", "text-halo-width": 1 },
    });
  }
  if (!map.getSource("ex-nomadic-routes")) {
    map.addSource("ex-nomadic-routes", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "ex-nomadic-route-line",
      type: "line",
      source: "ex-nomadic-routes",
      paint: { "line-color": "#50b8a7", "line-width": 3, "line-dasharray": [2, 2] },
    });
  }
  if (!map.getSource("ex-military-routes")) {
    map.addSource("ex-military-routes", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "ex-military-route-line",
      type: "line",
      source: "ex-military-routes",
      filter: ["==", ["get", "routeType"], "military_campaign"],
      paint: { "line-color": "#833d4a", "line-width": 3, "line-dasharray": [3, 1] },
    });
    map.addLayer({
      id: "ex-diplomatic-route-line",
      type: "line",
      source: "ex-military-routes",
      filter: ["==", ["get", "routeType"], "diplomatic_mission"],
      paint: { "line-color": "#8a66a6", "line-width": 2, "line-dasharray": [1, 2] },
    });
  }
  if (!map.getSource("ex-historical-places")) {
    map.addSource("ex-historical-places", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "historical-places-circle",
      type: "circle",
      source: "ex-historical-places",
      minzoom: 3.5,
      paint: {
        "circle-radius": ["case", ["boolean", ["feature-state", "selected"], false], 8, 5],
        "circle-color": "#f1cc84",
        "circle-stroke-color": "#071722",
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: "historical-places-selected",
      type: "circle",
      source: "ex-historical-places",
      paint: {
        "circle-radius": 9,
        "circle-color": "transparent",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 3,
        "circle-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 1, 0],
      },
    });
    map.addLayer({
      id: "historical-places-capital",
      type: "circle",
      source: "ex-historical-places",
      filter: ["in", "capital", ["get", "placeTypes"]],
      paint: { "circle-radius": 7, "circle-color": "#f5d879", "circle-stroke-color": "#462f0d", "circle-stroke-width": 2 },
    });
    map.addLayer({
      id: "historical-places-symbol",
      type: "circle",
      source: "ex-historical-places",
      paint: { "circle-radius": 2, "circle-color": "#fff4c9" },
    });
  }
  if (!map.getSource("ex-archaeology")) {
    map.addSource("ex-archaeology", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "historical-places-archaeology",
      type: "circle",
      source: "ex-archaeology",
      minzoom: 5,
      paint: {
        "circle-radius": 5,
        "circle-color": "#b58b63",
        "circle-stroke-color": "#fff1d1",
        "circle-stroke-width": 1.5,
      },
    });
  }
  if (!map.getSource("historical-labels-source")) {
    map.addSource("historical-labels-source", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "historical-state-labels",
      type: "symbol",
      source: "historical-labels-source",
      filter: ["==", ["get", "labelKind"], "state"],
      layout: ENTITY_LABEL_LAYOUT,
      paint: ENTITY_LABEL_PAINT,
    });
    [
      ["historical-place-labels", "place", 4.5],
      ["historical-hydrology-labels", "hydrology", 3.5],
      ["historical-route-labels", "route", 4],
    ].forEach(([id, kind, minzoom]) =>
      map.addLayer({
        id,
        type: "symbol",
        source: "historical-labels-source",
        filter: ["==", ["get", "labelKind"], kind],
        minzoom,
        layout: {
          "symbol-placement": kind === "route" ? "line" : "point",
          "text-field": ["get", "label"],
          "text-size": kind === "place" ? 12 : 11,
          "text-offset": kind === "place" ? [0, 1.3] : [0, 0],
          "text-max-width": 12,
        },
        paint: { "text-color": "#fff8e8", "text-halo-color": "#071722", "text-halo-width": 1.5 },
      })
    );
  }
  if (!map.getSource("ex-comparison")) {
    map.addSource("ex-comparison", { type: "geojson", data: emptyCollection });
    map.addLayer({
      id: "ex-comparison-fill",
      type: "fill",
      source: "ex-comparison",
      paint: {
        "fill-color": [
          "match",
          ["get", "comparisonRole"],
          "first", "#426f9f",
          "second", "#d2a64b",
          "common", "#4fa69f",
          "added", "#e5c77a",
          "lost", "#758b9e",
          "#8ca0ad",
        ],
        "fill-opacity": [
          "match",
          ["get", "comparisonRole"],
          "first", 0.3,
          "second", 0.3,
          "common", 0.56,
          "added", 0.62,
          "lost", 0.58,
          0.35,
        ],
      },
    });
    map.addLayer({
      id: "ex-comparison-line",
      type: "line",
      source: "ex-comparison",
      paint: {
        "line-color": "#f8f2e3",
        "line-width": 1.5,
        "line-opacity": 0.8,
      },
    });
  }
  ensureHistoricalLayerOrder(map);
};

const comparisonFeature = (feature, role, id) => ({
  ...feature,
  id,
  properties: {
    ...(feature?.properties || {}),
    id,
    comparisonRole: role,
  },
});

const buildComparisonCollection = (comparison) => {
  if (!comparison) return emptyCollection;
  if (comparison.mode === "changes" && comparison.geometryResult) {
    const roles = ["common", "added", "lost"];
    return {
      type: "FeatureCollection",
      features: roles
        .filter((role) => comparison.geometryResult[role])
        .map((role) =>
          comparisonFeature(
            comparison.geometryResult[role],
            role,
            `comparison-${role}`
          )
        ),
    };
  }
  const first = buildTerritoryCollection(comparison.firstYear).features.map(
    (feature) =>
      comparisonFeature(feature, "first", `comparison-first-${feature.id}`)
  );
  const second = buildTerritoryCollection(comparison.secondYear).features.map(
    (feature) =>
      comparisonFeature(feature, "second", `comparison-second-${feature.id}`)
  );
  return { type: "FeatureCollection", features: [...first, ...second] };
};

export default function ExhibitionMap({
  selectedYear,
  activeSnapshot,
  activeEra,
  cameraOverride,
  language,
  text,
  comparison,
  activeLayers,
  reducedMotion,
  selectedEntityId,
  onSelectEntity,
  palette,
  effectiveQuality,
  layerState,
  p1bData,
  selectedRouteId,
  selectedPlaceId,
  onSelectRoute,
  onSelectPlace,
  archiveMap,
  archiveOverlayEnabled = false,
  archiveOpacity = 0.65,
  archiveAboveReconstruction = false,
  forceFallback = false,
  officialDemo = false,
  performanceDegraded = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const onSelectEntityRef = useRef(onSelectEntity);
  const onSelectRouteRef = useRef(onSelectRoute);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const paletteRef = useRef(palette);
  const selectedEntityIdRef = useRef(selectedEntityId);
  const hoveredFeatureRef = useRef(null);
  const selectedFeatureIdsRef = useRef([]);
  const selectedRouteFeatureIdsRef = useRef([]);
  const selectedPlaceIdRef = useRef(null);
  const [mapFailed, setMapFailed] = useState(
    !isMapboxTokenConfigured || forceFallback
  );
  const [styleRevision, setStyleRevision] = useState(0);
  const qualityLight = effectiveQuality === "light";

  onSelectEntityRef.current = onSelectEntity;
  onSelectRouteRef.current = onSelectRoute;
  onSelectPlaceRef.current = onSelectPlace;
  paletteRef.current = palette;
  selectedEntityIdRef.current = selectedEntityId;

  useEffect(() => {
    if (forceFallback || !isMapboxTokenConfigured || !containerRef.current) return undefined;
    let cancelled = false;
    let map;

    import("mapbox-gl")
      .then(({ default: mapboxgl }) => {
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = mapboxToken;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: createHistoricalBasemapStyle(),
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
          const integrity = validateHistoricalBasemap(map);
          if (!integrity.passed) {
            recordExhibitionMetric("basemap_policy_violation", 1, {
              violations: Object.values(integrity.violations).flat().map((layer) => layer.id),
            });
          }
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
        map.on("click", "ex-trade-route-line", (event) => {
          const routeId = event.features?.[0]?.properties?.routeId;
          if (routeId) onSelectRouteRef.current?.(routeId);
        });
        map.on("click", "historical-places-circle", (event) => {
          const placeId = event.features?.[0]?.properties?.id;
          if (placeId) onSelectPlaceRef.current?.(placeId);
        });
        map.on("click", "historical-places-archaeology", (event) => {
          const placeId = event.features?.[0]?.properties?.id;
          if (placeId) onSelectPlaceRef.current?.(placeId);
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
  }, [forceFallback, qualityLight, reducedMotion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    const frame = requestAnimationFrame(() => {
      const territoryCollection = buildTerritoryCollection(selectedYear);
      const territories = officialDemo
        ? {
            ...territoryCollection,
            features: territoryCollection.features.filter((feature) =>
              isRecordAllowedInOfficialDemo(feature.properties)
            ),
          }
        : territoryCollection;
      timeExhibitionWork("territory-source-update", () =>
        map.getSource("ex-territories")?.setData(territories)
      );
      map
        .getSource("ex-comparison")
        ?.setData(buildComparisonCollection(comparison));
      const p1bCollections = p1bData
        ? {
            environment: buildEnvironmentCollection(
              p1bData.environmentSnapshots,
              selectedYear,
              language
            ),
            hydrology: buildHydrologyCollection(
              p1bData.hydrologySnapshots,
              selectedYear,
              language
            ),
            ...buildHistoricalPlaceCollections(
              p1bData.historicalSettlements,
              selectedYear,
              language
            ),
            ...buildRouteCollections(
              p1bData.historicalRoutes,
              p1bData.routeSegments,
              selectedYear,
              language
            ),
          }
        : buildEmptyP1BCollections();
      timeExhibitionWork("layer-update-time", () => {
        map.getSource("ex-environment")?.setData(p1bCollections.environment);
        map.getSource("ex-hydrology")?.setData(p1bCollections.hydrology);
        map.getSource("ex-historical-places")?.setData(p1bCollections.places);
        map.getSource("ex-archaeology")?.setData(p1bCollections.archaeology);
      });
      timeExhibitionWork("route-source-update-time", () => {
        map.getSource("ex-trade-routes")?.setData(p1bCollections.trade);
        map.getSource("ex-nomadic-routes")?.setData(p1bCollections.nomadic);
        map.getSource("ex-military-routes")?.setData(p1bCollections.military);
      });
      map
        .getSource("historical-labels-source")
        ?.setData(buildHistoricalLabelCollection({ selectedYear, language, collections: p1bCollections }));
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
  }, [selectedYear, comparison, styleRevision, p1bData, language, officialDemo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    const camera = cameraOverride || activeSnapshot?.camera || activeEra?.camera || {
      center: [67.2, 48], zoom: 4.05, pitch: qualityLight ? 18 : 38, bearing: 0,
    };
    map[reducedMotion ? "jumpTo" : "easeTo"]({
      ...camera,
      pitch: qualityLight ? Math.min(camera.pitch || 0, 18) : camera.pitch,
      duration: reducedMotion ? 0 : 800,
    });
  }, [
    activeSnapshot, activeEra, cameraOverride, reducedMotion, styleRevision, qualityLight,
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
    selectedRouteFeatureIdsRef.current.forEach((id) => {
      map.setFeatureState({ source: "ex-trade-routes", id }, { selected: false });
    });
    const nextIds = selectedRouteId
      ? p1bData?.routeSegments
          ?.filter((segment) => segment.routeId === selectedRouteId)
          .map((segment) => segment.id) || []
      : [];
    nextIds.forEach((id) => {
      map.setFeatureState({ source: "ex-trade-routes", id }, { selected: true });
    });
    selectedRouteFeatureIdsRef.current = nextIds;
  }, [p1bData, selectedRouteId, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    if (selectedPlaceIdRef.current) {
      ["ex-historical-places", "ex-archaeology"].forEach((source) => {
        map.removeFeatureState({ source, id: selectedPlaceIdRef.current });
      });
    }
    if (selectedPlaceId) {
      ["ex-historical-places", "ex-archaeology"].forEach((source) => {
        map.setFeatureState({ source, id: selectedPlaceId }, { selected: true });
      });
    }
    selectedPlaceIdRef.current = selectedPlaceId;
  }, [selectedPlaceId, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    applyPaletteToMap(map, palette);
  }, [palette, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    const layerAliases = {
      territories: "politicalTerritories",
    };
    const enabled = (group) => {
      const registryId = layerAliases[group] || group;
      const allowedByUser = activeLayers
        ? true
        : (layerState?.[registryId] ?? true);
      const allowedByStory =
        !activeLayers ||
        activeLayers.includes(group) ||
        activeLayers.includes(registryId);
      return allowedByUser && allowedByStory;
    };
    const groups = {
      territories: [
        "ex-territories-fill",
        "ex-territories-extrusion",
        "ex-territories-line",
      ],
      uncertainty: [
        "historical-boundary-uncertainty",
        "historical-boundary-patterned",
        "historical-boundary-schematic",
      ],
      stateLabels: ["historical-state-labels"],
      comparison: ["ex-comparison-fill", "ex-comparison-line"],
      environment: ["ex-environment-fill"],
      hydrology: ["ex-hydrology-fill", "ex-hydrology-line", "historical-hydrology-labels"],
      tradeRoutes: [
        "ex-trade-route-glow",
        "ex-trade-route-line",
        "ex-trade-route-arrows",
        "historical-route-labels",
      ],
      nomadicRoutes: ["ex-nomadic-route-line"],
      militaryRoutes: ["ex-military-route-line", "ex-diplomatic-route-line"],
      historicalPlaces: [
        "historical-places-circle",
        "historical-places-symbol",
        "historical-places-selected",
        "historical-places-capital",
        "historical-place-labels",
      ],
      archaeology: ["historical-places-archaeology"],
      terrain: ["historical-terrain-subtle"],
    };
    Object.entries(groups).forEach(([group, layerIds]) => {
      layerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            "visibility",
            enabled(group) ? "visible" : "none"
          );
        }
      });
    });
  }, [activeLayers, layerState, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return;
    if (map.getLayer("ex-trade-route-glow")) {
      map.setPaintProperty(
        "ex-trade-route-glow",
        "line-opacity",
        performanceDegraded ? 0 : qualityLight ? 0 : 0.16
      );
    }
  }, [performanceDegraded, qualityLight, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleRevision || !map?.isStyleLoaded()) return undefined;
    if (!archiveOverlayEnabled || !archiveMap) {
      removeArchiveOverlay(map);
      return undefined;
    }
    const cleanup = mountArchiveOverlay({
      map,
      archiveMap,
      opacity: archiveOpacity,
      reducedMotion,
      beforeId: archiveAboveReconstruction
        ? "historical-state-labels"
        : "ex-environment-fill",
    });
    if (!archiveAboveReconstruction) ensureHistoricalLayerOrder(map);
    return cleanup;
  }, [
    archiveAboveReconstruction,
    archiveMap,
    archiveOverlayEnabled,
    archiveOpacity,
    reducedMotion,
    styleRevision,
  ]);

  useEffect(() => {
    updateArchiveOverlayOpacity(mapRef.current, archiveOpacity);
  }, [archiveOpacity]);

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
        {...{
          selectedYear,
          activeSnapshot,
          language,
          text,
          comparison,
          selectedEntityId,
          activeLayers,
          layerState,
          p1bData,
          selectedRouteId,
          selectedPlaceId,
          onSelectEntity,
          onSelectRoute,
          onSelectPlace,
          archiveMap,
          archiveOverlayEnabled,
          archiveOpacity,
          effectiveQuality,
          officialDemo,
        }}
      />
    );
  }
  const legendItems = getGeometriesAtYear(selectedYear)
    .map((geometry) => ({ geometry, entity: entityById.get(geometry.entityId) }))
    .filter((item) => item.entity);
  return (
    <>
      <div ref={containerRef} className="ex-mapbox" aria-label={text.mapLabel} />
      {archiveOverlayEnabled && archiveMap && (
        <ArchiveMapOverlay
          archiveMap={archiveMap}
          language={language}
          opacity={archiveOpacity}
        />
      )}
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
        <div className="ex-uncertainty-legend">
          <strong>
            {language === "en"
              ? "Reconstruction precision and status"
              : language === "kk"
                ? "Реконструкция дәлдігі мен мәртебесі"
                : "Точность и статус реконструкции"}
          </strong>
          <span><i className="is-solid" />{language === "en" ? "Reviewed/generalized" : "Проверенная/обобщённая"}</span>
          <span><i className="is-soft" />{language === "en" ? "Approximate" : "Приблизительная"}</span>
          <span><i className="is-patterned" />{language === "en" ? "Disputed/schematic" : "Спорная/схематическая"}</span>
        </div>
      </aside>
    </>
  );
}
