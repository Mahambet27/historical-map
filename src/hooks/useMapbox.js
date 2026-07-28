import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

import { isLngLatOk, normalizeName } from "../lib/mapHelpers";
import { setupRouteLayer } from "../layers/RouteLayer";
import { escapeHtml, smoothCameraOptions } from "../components/map/mapViewUtils";
import { getMapboxTokenError, mapboxToken } from "../config/env.js";
import { getQualityProfile } from "../features/map/utils/mapPerformance.js";
import { logger } from "../lib/logger.js";

const MAP_STYLES = {
  now: "mapbox://styles/mapbox/streets-v12",
  history: "mapbox://styles/mapbox/satellite-streets-v12",
};

const TERRAIN_SOURCE_ID = "mapbox-dem";
const PRIMARY_TERRAIN_URL = "mapbox://mapbox.terrain-rgb";
const FALLBACK_TERRAIN_URL = "mapbox://mapbox.mapbox-terrain-dem-v1";
const TERRAIN_EXAGGERATION = 2.4;

const logTerrainDev = (message, details) => {
  if (!import.meta.env.DEV) return;

  if (details === undefined) {
    console.log(message);
    return;
  }

  console.log(message, details);
};

function removeTerrainSource(map) {
  if (!map.getSource(TERRAIN_SOURCE_ID)) return;

  if (map.getTerrain?.()?.source === TERRAIN_SOURCE_ID) {
    map.setTerrain(null);
  }

  map.removeSource(TERRAIN_SOURCE_ID);
}

function applyTerrain(map, { sourceUrl, allowFallback = true } = {}) {
  if (!map || !map.isStyleLoaded()) return;
  const terrainExaggeration =
    map.__hmQualityProfile?.terrainExaggeration ?? TERRAIN_EXAGGERATION;
  if (terrainExaggeration <= 0) {
    if (map.getTerrain?.()) map.setTerrain(null);
    return false;
  }

  const requestedSourceUrl = sourceUrl || map.__hmTerrainSourceUrl || PRIMARY_TERRAIN_URL;
  const activeSourceUrl = requestedSourceUrl;
  let terrainApplied = false;

  try {
    const currentSourceUrl = map.getStyle?.()?.sources?.[TERRAIN_SOURCE_ID]?.url;
    if (
      map.getSource(TERRAIN_SOURCE_ID) &&
      currentSourceUrl &&
      currentSourceUrl !== requestedSourceUrl
    ) {
      removeTerrainSource(map);
    }

    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, {
        type: "raster-dem",
        url: requestedSourceUrl,
        tileSize: 512,
        maxzoom: 14,
      });
    }

    map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: terrainExaggeration });
    terrainApplied = map.getTerrain?.()?.source === TERRAIN_SOURCE_ID;
    map.__hmTerrainSourceUrl = requestedSourceUrl;
  } catch (error) {
    const safeMessage = sanitizeMapboxText(error?.message || error);
    logTerrainDev("Terrain apply failed", safeMessage);
    console.warn("Terrain disabled:", safeMessage);
  }

  if (!terrainApplied && allowFallback && requestedSourceUrl !== FALLBACK_TERRAIN_URL) {
    logTerrainDev("Primary DEM terrain did not activate; trying fallback DEM source.");
    map.__hmTerrainFallbackAttempted = true;
    return applyTerrain(map, {
      sourceUrl: FALLBACK_TERRAIN_URL,
      allowFallback: false,
    });
  }

  try {
    map.setFog({
      range: [-1, 2.5],
      color: "rgba(240,248,255,0.9)",
      "horizon-blend": 0.18,
    });

    if (!map.getLayer("sky")) {
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 0.0],
          "sky-atmosphere-sun-intensity": 10,
        },
      });
    }
  } catch (error) {
    logTerrainDev("Terrain atmosphere setup failed", sanitizeMapboxText(error?.message || error));
  }

  if (terrainApplied && map.__hmTerrainAppliedLoggedSourceUrl !== activeSourceUrl) {
    logTerrainDev(
      activeSourceUrl === PRIMARY_TERRAIN_URL
        ? "Terrain applied with terrain-rgb"
        : "Terrain applied with fallback DEM",
      {
        sourceUrl: activeSourceUrl,
        exaggeration: terrainExaggeration,
      }
    );
    map.__hmTerrainAppliedLoggedSourceUrl = activeSourceUrl;
  }

  return terrainApplied;
}

function reapplyTerrainAfterStyleLoad(map) {
  const attemptReapply = (label, allowFallback = false) => {
    if (!map || !map.isStyleLoaded()) return;

    const terrainApplied = applyTerrain(map, { allowFallback });
    const terrain = map.getTerrain?.();

    if (
      terrainApplied &&
      terrain?.source === TERRAIN_SOURCE_ID &&
      !map.__hmTerrainStyleReapplyLogged
    ) {
      logTerrainDev("Terrain re-applied after style.load", {
        label,
        sourceUrl: map.__hmTerrainSourceUrl,
        exaggeration: TERRAIN_EXAGGERATION,
      });
      map.__hmTerrainStyleReapplyLogged = true;
    } else {
      if (!terrainApplied || terrain?.source !== TERRAIN_SOURCE_ID) {
        console.warn("Terrain re-apply failed after style.load; waiting for idle");
      }
    }

  };

  window.requestAnimationFrame(() => attemptReapply("After style.load animation frame"));
  window.setTimeout(() => attemptReapply("After delayed style.load"), 200);
  map.once("idle", () => attemptReapply("After style.load idle", true));
}

const isDemTerrainError = (event, error) => {
  const details = [
    event?.sourceId,
    event?.url,
    event?.tile?.url,
    error?.url,
    error?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    event?.sourceId === TERRAIN_SOURCE_ID ||
    details.includes("terrain-rgb") ||
    details.includes("terrain-dem") ||
    details.includes(TERRAIN_SOURCE_ID)
  );
};

const isAuthError = (error) => {
  const status = error?.status || error?.statusCode;
  const message = String(error?.message || "");
  return status === 401 || status === 403 || message.includes("401") || message.includes("403");
};

const sanitizeMapboxText = (value) => {
  if (value === undefined || value === null) return undefined;

  return String(value)
    .replace(/([?&]access_token=)[^&\s]+/gi, "$1[redacted]")
    .replace(/pk\.[A-Za-z0-9._-]+/g, "pk.[redacted]");
};

const resourceUrlWithoutToken = (event, error) => {
  const value = event?.url || event?.tile?.url || error?.url;
  if (!value) return undefined;

  try {
    const url = new URL(String(value));
    url.searchParams.delete("access_token");
    return sanitizeMapboxText(url.toString());
  } catch {
    return sanitizeMapboxText(value).replace(/([?&])access_token=[^&\s]*&?/gi, "$1");
  }
};

const getMapboxErrorDiagnostics = (event, error) => ({
  message: sanitizeMapboxText(error?.message || event?.message || "Unknown Mapbox error"),
  sourceId: event?.sourceId || error?.sourceId,
  tile: sanitizeMapboxText(event?.tile?.url || event?.tile?.tileID || error?.tile),
  statusCode:
    error?.status || error?.statusCode || event?.status || event?.statusCode || event?.response?.status,
  url: resourceUrlWithoutToken(event, error),
});

export default function useMapbox({
  allPlaces,
  blockNextMapClickRef,
  buildDrivingRoute,
  clearDrivingRoute,
  drawHistoricalMarkers,
  enabled = true,
  filteredPlaces,
  hideTarbagatai,
  hideZaysan,
  historicalBorderContours,
  historicalBorderLabels,
  hoverPopupRef,
  initialView,
  mapContainerRef,
  mapLoadedRef,
  mapRef,
  mode,
  modeRef,
  openPlace,
  openTarbagataiFromMap,
  openZaysanFromMap,
  protectedAreaContours,
  routeExistsRef,
  selectedEra,
  selectedRef,
  setMapStatus,
  setSelected,
  settlementsByName,
  syncHistoricalBorders,
  syncProtectedAreasVisibility,
  syncRouteExists,
  tarbagataiGeojson,
  userLocRef,
  userMarkerRef,
  zaysanGeojson,
}) {
  useEffect(() => {
    if (!enabled) return;
    if (mapRef.current) return;

    const qualityProfile = getQualityProfile();
    logger.info("Mapbox initialization", { quality: qualityProfile.mode });

    const tokenError = getMapboxTokenError();
    if (tokenError) {
      console.error("Mapbox configuration error:", tokenError);
      setMapStatus("error");
      return;
    }

    if (!mapContainerRef.current) {
      console.error("Mapbox initialization error: map container is not available.");
      setMapStatus("error");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const initialStyle = mode === "history" ? MAP_STYLES.history : MAP_STYLES.now;
    let map;

    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        ...initialView,
        antialias: qualityProfile.antialias,
        fadeDuration: qualityProfile.animations ? 450 : 0,
        pixelRatio: Math.min(window.devicePixelRatio || 1, qualityProfile.maxPixelRatio),
        scrollZoom: true,
      });
    } catch (error) {
      console.error("Mapbox initialization error:", sanitizeMapboxText(error?.message));
      setMapStatus("error");
      return;
    }

    mapRef.current = map;
    map.__hmQualityProfile = qualityProfile;
    map.__hmCurrentStyle = initialStyle;
    map.__hmTerrainSourceUrl = PRIMARY_TERRAIN_URL;
    map.__hmTerrainFallbackAttempted = false;
    map.__hmTerrainAppliedLoggedSourceUrl = null;
    map.__hmTerrainStyleReapplyLogged = false;

    map.on("error", (event) => {
      const error = event?.error || event;
      console.error("Mapbox error diagnostics:", getMapboxErrorDiagnostics(event, error));

      const terrainError = isDemTerrainError(event, error);
      const authError = isAuthError(error);
      if (terrainError || authError) {
        console.warn(
          "DEM terrain tiles are not loading. Check Mapbox token scopes, allowed URLs, or tileset access."
        );
      }

      if (terrainError && !map.__hmTerrainFallbackAttempted) {
        map.__hmTerrainFallbackAttempted = true;
        window.setTimeout(() => {
          if (!map || !map.isStyleLoaded()) return;

          applyTerrain(map, {
            sourceUrl: FALLBACK_TERRAIN_URL,
            allowFallback: false,
          });
        }, 0);
      }

      if (authError) {
        console.warn(
          "Mapbox tiles or style may be blocked. Check the Mapbox token allowed URLs/domains."
        );
      }

      if (!mapLoadedRef.current) {
        setMapStatus("error");
      }
    });

    try {
      map.scrollZoom.setWheelZoomRate?.(1 / 1700);
      map.scrollZoom.setZoomRate?.(1 / 280);
    } catch (error) {
      console.warn("Smooth zoom tuning skipped:", sanitizeMapboxText(error?.message || error));
    }

    map.on("load", () => {
      mapLoadedRef.current = true;
      setMapStatus("ready");

      const geo = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      });
      map.addControl(geo, "top-right");

      geo.on("geolocate", (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;
        const currentCoords = [lng, lat];
        userLocRef.current = currentCoords;

        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({ color: "#1b74e4" })
            .setLngLat(currentCoords)
            .addTo(map);
        } else {
          userMarkerRef.current.setLngLat(currentCoords);
        }

        const activeSelected = selectedRef.current;
        if (activeSelected?.coords && routeExistsRef.current) {
          buildDrivingRoute(currentCoords, activeSelected.coords, { fit: false });
        }
      });

      const setupStyleContent = ({ allowTerrainFallback = true } = {}) => {
        applyTerrain(map, { allowFallback: allowTerrainFallback });

      if (!map.getSource("tarbagatai")) {
        map.addSource("tarbagatai", { type: "geojson", data: tarbagataiGeojson });

        map.addLayer({
          id: "tarbagatai-glow",
          type: "line",
          source: "tarbagatai",
          layout: { visibility: "none" },
          paint: {
            "line-color": "#ff3b30",
            "line-width": 14,
            "line-opacity": 0.18,
            "line-blur": 6,
          },
        });

        map.addLayer({
          id: "tarbagatai-fill",
          type: "fill",
          source: "tarbagatai",
          layout: { visibility: "none" },
          paint: {
            "fill-color": "#ff3b30",
            "fill-opacity": 0.18,
          },
        });

        map.addLayer({
          id: "tarbagatai-outline",
          type: "line",
          source: "tarbagatai",
          layout: { visibility: "none" },
          paint: {
            "line-color": "#ff3b30",
            "line-width": 3,
            "line-opacity": 0.9,
          },
        });

        if (!map.__hmTarbagataiHandlersBound) {
          map.on("mouseenter", "tarbagatai-fill", () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "tarbagatai-fill", () => (map.getCanvas().style.cursor = ""));
          map.on("click", "tarbagatai-fill", () => {
            blockNextMapClickRef.current = true;
            openTarbagataiFromMap();
            setTimeout(() => {
              blockNextMapClickRef.current = false;
            }, 0);
          });
          map.__hmTarbagataiHandlersBound = true;
        }
      }

      if (!map.getSource("zaysan")) {
        map.addSource("zaysan", { type: "geojson", data: zaysanGeojson });

        map.addLayer({
          id: "zaysan-glow",
          type: "line",
          source: "zaysan",
          layout: { visibility: "none" },
          paint: {
            "line-color": "#5dbbff",
            "line-width": 16,
            "line-opacity": 0.22,
            "line-blur": 8,
          },
        });

        map.addLayer({
          id: "zaysan-fill",
          type: "fill",
          source: "zaysan",
          layout: { visibility: "none" },
          paint: {
            "fill-color": "#3e98ff",
            "fill-opacity": 0.62,
          },
        });

        map.addLayer({
          id: "zaysan-outline",
          type: "line",
          source: "zaysan",
          layout: { visibility: "none" },
          paint: {
            "line-color": "#1b63d4",
            "line-width": 2.4,
            "line-opacity": 0.95,
          },
        });

        if (!map.__hmZaysanHandlersBound) {
          map.on("mouseenter", "zaysan-fill", () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "zaysan-fill", () => (map.getCanvas().style.cursor = ""));
          map.on("click", "zaysan-fill", () => {
            blockNextMapClickRef.current = true;
            openZaysanFromMap();
            setTimeout(() => {
              blockNextMapClickRef.current = false;
            }, 0);
          });
          map.__hmZaysanHandlersBound = true;
        }
      }

      if (!map.getSource("historical-borders")) {
        map.addSource("historical-borders", { type: "geojson", data: historicalBorderContours });
        map.addSource("historical-border-labels", { type: "geojson", data: historicalBorderLabels });

        map.addLayer({
          id: "historical-borders-fill",
          type: "fill",
          source: "historical-borders",
          layout: { visibility: "none" },
          paint: {
            "fill-color": ["coalesce", ["get", "color"], "#f59e0b"],
            "fill-opacity": 0.045,
          },
          filter: ["==", ["get", "era"], Number(selectedEra)],
        });

        map.addLayer({
          id: "historical-borders-outline",
          type: "line",
          source: "historical-borders",
          layout: { visibility: "none" },
          paint: {
            "line-color": ["coalesce", ["get", "color"], "#f59e0b"],
            "line-width": 1.7,
            "line-opacity": 0.68,
            "line-dasharray": [2, 1.2],
          },
          filter: ["==", ["get", "era"], Number(selectedEra)],
        });

        map.addLayer({
          id: "historical-borders-label",
          type: "symbol",
          source: "historical-border-labels",
          layout: {
            visibility: "none",
            "text-field": ["get", "name"],
            "text-size": 12,
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0],
            "text-anchor": "center",
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#111827",
            "text-halo-color": "rgba(255,255,255,0.92)",
            "text-halo-width": 1.4,
          },
          filter: ["==", ["get", "era"], Number(selectedEra)],
        });
      }

      if (!map.getSource("protected-areas")) {
        map.addSource("protected-areas", { type: "geojson", data: protectedAreaContours });

        map.addLayer({
          id: "protected-areas-glow",
          type: "line",
          source: "protected-areas",
          layout: { visibility: "none" },
          paint: {
            "line-color": ["coalesce", ["get", "color"], "#16a34a"],
            "line-width": 12,
            "line-opacity": 0.16,
            "line-blur": 6,
          },
        });

        map.addLayer({
          id: "protected-areas-fill",
          type: "fill",
          source: "protected-areas",
          layout: { visibility: "none" },
          paint: {
            "fill-color": ["coalesce", ["get", "color"], "#22c55e"],
            "fill-opacity": 0.18,
          },
        });

        map.addLayer({
          id: "protected-areas-outline",
          type: "line",
          source: "protected-areas",
          layout: { visibility: "none" },
          paint: {
            "line-color": ["coalesce", ["get", "color"], "#16a34a"],
            "line-width": 2.5,
            "line-opacity": 0.9,
          },
        });

        if (!map.__hmProtectedAreaHandlersBound) {
          map.on("mouseenter", "protected-areas-fill", (event) => {
            map.getCanvas().style.cursor = "pointer";

            const feature = event.features?.[0];

            if (hoverPopupRef.current) hoverPopupRef.current.remove();
            hoverPopupRef.current = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 14,
              maxWidth: "240px",
            })
              .setLngLat(event.lngLat)
              .setHTML(`<strong>${escapeHtml(feature?.properties?.name || "Protected area")}</strong>`)
              .addTo(map);
          });

          map.on("mouseleave", "protected-areas-fill", () => {
            map.getCanvas().style.cursor = "";
            if (hoverPopupRef.current) {
              hoverPopupRef.current.remove();
              hoverPopupRef.current = null;
            }
          });

          map.on("click", "protected-areas-fill", (event) => {
            const areaId = event.features?.[0]?.properties?.id;
            const place = allPlaces.find((item) => item?.protectedAreaId === areaId);
            if (!place) return;

            blockNextMapClickRef.current = true;
            openPlace(place);
            setTimeout(() => {
              blockNextMapClickRef.current = false;
            }, 0);
          });
          map.__hmProtectedAreaHandlersBound = true;
        }
      }

      setupRouteLayer(map);
      syncRouteExists();
      syncHistoricalBorders();
      syncProtectedAreasVisibility();

      if (modeRef.current === "history") drawHistoricalMarkers(filteredPlaces);
      };

      map.__hmSetupStyleContent = setupStyleContent;
      setupStyleContent();
    });

    map.on("click", (event) => {
      if (blockNextMapClickRef.current) {
        blockNextMapClickRef.current = false;
        return;
      }

      if (modeRef.current !== "now") return;
      if (!mapLoadedRef.current) return;

      const box = [
        [event.point.x - 6, event.point.y - 6],
        [event.point.x + 6, event.point.y + 6],
      ];

      const features = map.queryRenderedFeatures(box);
      if (!features || features.length === 0) return;

      const placeFeature =
        features.find((feature) => feature.layer?.id?.includes("place-label") && feature.properties?.name) ||
        features.find((feature) => feature.properties?.name);

      if (!placeFeature) return;

      const clickedNameRaw = placeFeature.properties?.name;
      if (!clickedNameRaw) return;

      const clickedName = String(clickedNameRaw).trim();
      const key = normalizeName(clickedName);

      const settlement = settlementsByName.get(key);
      if (!settlement) return;

      const coords = settlement?.geometry?.coordinates;
      if (!isLngLatOk(coords)) {
        console.warn("Check coordinates in settlements.json, expected [lng, lat]:", settlement);
        return;
      }

      hideTarbagatai();
      hideZaysan();

      map.flyTo({
        center: coords,
        zoom: 12.3,
        pitch: 65,
        bearing: 20,
        speed: 0.55,
        curve: 1.18,
        ...smoothCameraOptions,
        duration: 1400,
      });

      const props = settlement.properties || {};

      setSelected({
        type: "Ауыл",
        name: props.name || clickedName,
        coords,
        short: props.shortDescription || "Қысқаша ақпарат жоқ.",
        full: props.fullDescription || "Толық ақпарат жоқ.",
        images: Array.isArray(props.images) ? props.images : [],
        modelPoster: props.modelPoster || "",
        modelViewerUrl: props.modelViewerUrl || "",
      });
    });

    return () => {
      clearDrivingRoute({ restoreRegion: false });
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
      mapLoadedRef.current = false;
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) return;
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const targetStyle = mode === "history" ? MAP_STYLES.history : MAP_STYLES.now;
    if (map.__hmCurrentStyle === targetStyle) {
      applyTerrain(map);
      return;
    }

    map.__hmCurrentStyle = targetStyle;

    map.once("style.load", () => {
      map.__hmTerrainSourceUrl = PRIMARY_TERRAIN_URL;
      map.__hmTerrainFallbackAttempted = false;
      map.__hmTerrainAppliedLoggedSourceUrl = null;
      map.__hmTerrainStyleReapplyLogged = false;
      map.__hmSetupStyleContent?.({ allowTerrainFallback: false });
      applyTerrain(map, { allowFallback: false });
      reapplyTerrainAfterStyleLoad(map);
      setupRouteLayer(map);
      syncRouteExists();
      syncHistoricalBorders();
      syncProtectedAreasVisibility();

      if (mode === "history") {
        drawHistoricalMarkers(filteredPlaces);
        map.easeTo({
          ...initialView,
          ...smoothCameraOptions,
          duration: 1600,
        });
      } else {
        map.easeTo({
          pitch: 48,
          bearing: -15,
          duration: 700,
          ...smoothCameraOptions,
        });
      }
    });

    map.setStyle(targetStyle);
  }, [enabled, mode]); // eslint-disable-line react-hooks/exhaustive-deps
}
