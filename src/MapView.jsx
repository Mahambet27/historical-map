import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import settlements from "./data/settlements.json";
import places from "./data/places.json";
import { additionalEraPlaces } from "./data/eraPlaces.js";
import { historicalBorderContours, historicalBorderLabels } from "./data/historicalBorders.js";
import { popularPlaces } from "./data/popularPlaces.js";
import { tarbagataiGeojson, zaysanGeojson } from "./data/regionContours.js";
import { protectedAreaContours } from "./data/protectedAreas.js";
import {
  normalizeName,
  isLngLatOk,
  toFixed5,
  getBoundsFromCoords,
  clearMarkersList,
} from "./utils/mapHelpers";
import {
  APP_NAME,
  MAPBOX_TOKEN,
  MAPBOX_TOKEN_ENV_NAME,
  isMapboxTokenConfigured,
} from "./config/env.js";
import ObjectPresentation from "./ObjectPresentation";
import AiAssistant from "./ui/AiAssistant";

if (isMapboxTokenConfigured) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const getPlaceType = (place) => place?.type || "Тарихи нысан";

const hasPlaceMedia = (place) => {
  return Boolean(
    (Array.isArray(place?.images) && place.images.length > 0) ||
      place?.model3d ||
      place?.modelViewerUrl
  );
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const MissingMapboxTokenState = () => (
  <div
    role="alert"
    style={{
      minHeight: "100vh",
      width: "100vw",
      display: "grid",
      placeItems: "center",
      padding: 24,
      boxSizing: "border-box",
      background: "linear-gradient(135deg, #111827 0%, #1f2937 48%, #064e3b 100%)",
      color: "#f9fafb",
      fontFamily: "system-ui, Arial",
    }}
  >
    <div
      style={{
        width: "min(560px, 100%)",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: 0, opacity: 0.72 }}>{APP_NAME}</div>
      <h1 style={{ margin: "8px 0 12px", fontSize: 28, lineHeight: 1.1 }}>
        Mapbox token is missing
      </h1>
      <p style={{ margin: 0, lineHeight: 1.55, color: "#d1d5db" }}>
        Add a public Mapbox token to your local <b>.env</b> file as{" "}
        <code>{MAPBOX_TOKEN_ENV_NAME}=your_mapbox_public_token_here</code>, then restart the
        development server. The app has stopped before loading the map so it does not crash or leak
        configuration details.
      </p>
    </div>
  </div>
);

const distanceKm = (from, to) => {
  if (!isLngLatOk(from) || !isLngLatOk(to)) return Number.POSITIVE_INFINITY;

  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to[1] - from[1]);
  const dLng = toRad(to[0] - from[0]);
  const lat1 = toRad(from[1]);
  const lat2 = toRad(to[1]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const smoothMapEasing = (t) => {
  return t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
};

const smoothCameraOptions = {
  duration: 2200,
  easing: smoothMapEasing,
  essential: true,
};

const smoothFitOptions = {
  duration: 2100,
  easing: smoothMapEasing,
  essential: true,
};

const POPULAR_ERA = 5;
const PROTECTED_AREA_LAYER_IDS = [
  "protected-areas-glow",
  "protected-areas-fill",
  "protected-areas-outline",
];
const HISTORICAL_BORDER_LAYER_IDS = [
  "historical-borders-fill",
  "historical-borders-outline",
  "historical-borders-label",
];

const uiText = {
  kk: {
    language: "Тіл",
    settings: "Баптаулар",
    currentMap: "Карта қазір",
    historyMap: "Тарихи карта",
    resetView: "← Жалпы көрініс",
    clearRoute: "Маршрутты өшіру",
    tour: "Экскурсия",
    tourOn: "Экскурсия қосулы",
    previous: "← Алдыңғы",
    next: "Келесі →",
    stop: "Тоқтату",
    search: "Іздеу",
    searchPlaceholder: "Атауы немесе сипаттамасы...",
    allTypes: "Барлық түрлер",
    mediaOnly: "Фото немесе 3D бар нысандар",
    clearFilters: "Фильтрді тазалау",
    found: "Табылды",
    media: "Медиа",
    noResults: "Ештеңе табылмады.",
    era: "Эпоха",
    legend: "Карта легендасы",
    historicalObject: "Тарихи нысан",
    gpsRoute: "GPS маршруты",
    regionContour: "Аймақ контуры",
    historicalBorder: "Тарихи шекара",
    protectedArea: "Қорық немесе ұлттық парк",
    mediaObject: "Фото немесе модель бар",
    coordinates: "Коорд",
    navigation: "Навигация (Google)",
    copy: "Көшіру",
    routeGps: "Маршрут (GPS)",
    routeLoading: "Маршрут жүктелуде...",
    show3d: "3D көрсету",
    nearby: "Жақын жерлер",
    nearest: "Ең жақын нысандар",
    distance: "Қашықтық",
    time: "Уақыт",
    min: "мин",
    more: "Толығырақ",
    images: "Суреттер",
    closeImages: "Суреттерді жабу",
  },
  ru: {
    language: "Язык",
    settings: "Настройки",
    currentMap: "Карта сейчас",
    historyMap: "Историческая карта",
    resetView: "← Общий вид",
    clearRoute: "Убрать маршрут",
    tour: "Экскурсия",
    tourOn: "Экскурсия включена",
    previous: "← Назад",
    next: "Дальше →",
    stop: "Стоп",
    search: "Поиск",
    searchPlaceholder: "Название или описание...",
    allTypes: "Все типы",
    mediaOnly: "Только с фото или 3D",
    clearFilters: "Сбросить фильтры",
    found: "Найдено",
    media: "Медиа",
    noResults: "Ничего не найдено.",
    era: "Эпоха",
    legend: "Легенда карты",
    historicalObject: "Исторический объект",
    gpsRoute: "GPS-маршрут",
    regionContour: "Контур региона",
    historicalBorder: "Историческая граница",
    protectedArea: "Заповедник или нацпарк",
    mediaObject: "Есть фото или модель",
    coordinates: "Коорд",
    navigation: "Навигация (Google)",
    copy: "Копировать",
    routeGps: "Маршрут (GPS)",
    routeLoading: "Маршрут загружается...",
    show3d: "Показать 3D",
    nearby: "Ближайшие места",
    nearest: "Ближайшие объекты",
    distance: "Расстояние",
    time: "Время",
    min: "мин",
    more: "Подробнее",
    images: "Фото",
    closeImages: "Закрыть фото",
  },
  en: {
    language: "Language",
    settings: "Settings",
    currentMap: "Current map",
    historyMap: "Historical map",
    resetView: "← Overview",
    clearRoute: "Clear route",
    tour: "Tour",
    tourOn: "Tour is on",
    previous: "← Previous",
    next: "Next →",
    stop: "Stop",
    search: "Search",
    searchPlaceholder: "Name or description...",
    allTypes: "All types",
    mediaOnly: "Only with photos or 3D",
    clearFilters: "Clear filters",
    found: "Found",
    media: "Media",
    noResults: "Nothing found.",
    era: "Era",
    legend: "Map legend",
    historicalObject: "Historical object",
    gpsRoute: "GPS route",
    regionContour: "Region contour",
    historicalBorder: "Historical border",
    protectedArea: "Reserve or national park",
    mediaObject: "Has photo or model",
    coordinates: "Coords",
    navigation: "Navigation (Google)",
    copy: "Copy",
    routeGps: "Route (GPS)",
    routeLoading: "Loading route...",
    show3d: "Show 3D",
    nearby: "Nearby places",
    nearest: "Nearest objects",
    distance: "Distance",
    time: "Time",
    min: "min",
    more: "More",
    images: "Images",
    closeImages: "Close images",
  },
};

const languageNames = {
  kk: "Қазақша",
  ru: "Русский",
  en: "English",
};

const localizePlace = (place, language) => {
  if (!place) return place;

  const translation = place.translations?.[language];
  if (!translation) return place;

  return {
    ...place,
    type: translation.type || place.type,
    name: translation.name || place.name,
    short: translation.short || place.short,
    full: translation.full || place.full,
    shortDescription: translation.short || place.shortDescription,
    fullDescription: translation.full || place.fullDescription,
  };
};

function MapViewInner() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const hoverPopupRef = useRef(null);
  const mapLoadedRef = useRef(false);
  const blockNextMapClickRef = useRef(false);
  const modeRef = useRef("now");

  const userLocRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeAnimationMarkerRef = useRef(null);
  const routeAbortRef = useRef(null);
  const selectedRef = useRef(null);
  const routeAnimationRef = useRef(null);
  const routeExistsRef = useRef(false);

  const tarbagataiWasVisibleBeforeRouteRef = useRef(false);

  const [mode, setMode] = useState("now");
  const [language, setLanguage] = useState("kk");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEra, setSelectedEra] = useState(0);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [onlyWithMedia, setOnlyWithMedia] = useState(false);
  const [tourOn, setTourOn] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [routeExists, setRouteExists] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  useEffect(() => {
    selectedRef.current = selected;
    setSlideIndex(0);
    setShowGallery(false);
    setShowModelViewer(false);
    setShowNearby(false);
  }, [selected]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    routeExistsRef.current = routeExists;
  }, [routeExists]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.customElements?.get("model-viewer")) return;

    const existing = document.querySelector('script[data-model-viewer="true"]');
    if (existing) return;

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.dataset.modelViewer = "true";
    document.head.appendChild(script);

    return () => {
      // Скрипт оставляем в документе, чтобы не дергать повторно.
    };
  }, []);

  const eras = useMemo(
    () => {
      const labels = {
        kk: ["Қола дәуірі", "Сақ дәуірі", "Түркі кезеңі", "Қазақ хандығы", "КСРО", "Танымал Қазақстан"],
        ru: ["Бронзовый век", "Сакская эпоха", "Тюркский период", "Казахское ханство", "СССР", "Популярный Казахстан"],
        en: ["Bronze Age", "Saka era", "Turkic period", "Kazakh Khanate", "USSR", "Popular Kazakhstan"],
      };

      return labels[language] || labels.kk;
    },
    [language]
  );

  const initialView = useMemo(
    () => ({
      center: [83.6, 47.6],
      zoom: 8.6,
      pitch: 55,
      bearing: -15,
    }),
    []
  );

  const allPlaces = useMemo(() => {
    return [
      ...(Array.isArray(places) ? places : []),
      ...(Array.isArray(additionalEraPlaces) ? additionalEraPlaces : []),
      ...(Array.isArray(popularPlaces) ? popularPlaces : []),
    ];
  }, []);

  const settlementsByName = useMemo(() => {
    const m = new Map();
    (settlements?.features || []).forEach((f) => {
      const props = f?.properties || {};
      const keys = [];
      if (props.name) keys.push(props.name);
      if (Array.isArray(props.altNames)) keys.push(...props.altNames);

      keys.forEach((k) => {
        const nk = normalizeName(k);
        if (nk) m.set(nk, f);
      });
    });
    return m;
  }, []);

  const eraPlaces = useMemo(() => {
    return allPlaces
      .filter((p) => Number(p?.era) === Number(selectedEra))
      .filter((p) => isLngLatOk(p?.coords));
  }, [allPlaces, selectedEra]);

  const placeTypes = useMemo(() => {
    return Array.from(
      new Set(eraPlaces.map((p) => getPlaceType(localizePlace(p, language))).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [eraPlaces, language]);

  useEffect(() => {
    if (selectedType !== "all" && !placeTypes.includes(selectedType)) {
      setSelectedType("all");
    }
  }, [placeTypes, selectedType]);

  const filteredPlaces = useMemo(() => {
    const q = normalizeName(query);

    return eraPlaces.filter((p) => {
      const localized = localizePlace(p, language);
      if (selectedType !== "all" && getPlaceType(localized) !== selectedType) return false;
      if (onlyWithMedia && !hasPlaceMedia(p)) return false;
      if (!q) return true;

      const name = normalizeName(localized?.name);
      const short = normalizeName(localized?.shortDescription);
      return name.includes(q) || short.includes(q);
    });
  }, [eraPlaces, language, query, selectedType, onlyWithMedia]);

  const nearbyPlaces = useMemo(() => {
    if (!selected?.coords) return [];

    return allPlaces
      .filter((p) => p?.name && p.name !== selected.name && isLngLatOk(p?.coords))
      .map((p) => ({ ...p, distanceKm: distanceKm(selected.coords, p.coords) }))
      .filter((p) => Number.isFinite(p.distanceKm))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
  }, [allPlaces, selected]);

  const clearHoverPopup = () => {
    if (hoverPopupRef.current) {
      hoverPopupRef.current.remove();
      hoverPopupRef.current = null;
    }
  };

  const clearMarkers = () => {
    clearMarkersList(markersRef);
    clearHoverPopup();
  };

  const syncRouteExists = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) {
      setRouteExists(false);
      return;
    }

    try {
      const src = map.getSource("driving-route");
      if (!src || !src._data) {
        setRouteExists(false);
        return;
      }
      const data = src._data;
      setRouteExists(Array.isArray(data?.features) && data.features.length > 0);
    } catch {
      setRouteExists(false);
    }
  };

  const isTarbagataiVisible = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return false;
    if (!map.getLayer("tarbagatai-fill")) return false;
    const v = map.getLayoutProperty("tarbagatai-fill", "visibility");
    return v !== "none";
  };

  const hideTarbagatai = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    ["tarbagatai-fill", "tarbagatai-outline", "tarbagatai-glow"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
    });
  };

  const showTarbagataiAndFit = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    ["tarbagatai-fill", "tarbagatai-outline", "tarbagatai-glow"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "visible");
    });

    const coords = tarbagataiGeojson.features?.[0]?.geometry?.coordinates?.[0] || [];
    const bounds = getBoundsFromCoords(coords);
    if (bounds) map.fitBounds(bounds, { padding: 80, ...smoothFitOptions });
  };

  const hideZaysan = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    ["zaysan-fill", "zaysan-outline", "zaysan-glow"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
    });
  };

  const showZaysanAndFit = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    ["zaysan-fill", "zaysan-outline", "zaysan-glow"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "visible");
    });

    const coords = zaysanGeojson.features?.[0]?.geometry?.coordinates?.[0] || [];
    const bounds = getBoundsFromCoords(coords);
    if (bounds) map.fitBounds(bounds, { padding: 80, ...smoothFitOptions });
  };

  const setProtectedAreasVisible = (visible) => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    PROTECTED_AREA_LAYER_IDS.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    });
  };

  const syncProtectedAreasVisibility = () => {
    setProtectedAreasVisible(mode === "history" && Number(selectedEra) === POPULAR_ERA);
  };

  const syncHistoricalBorders = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const visible = mode === "history";
    HISTORICAL_BORDER_LAYER_IDS.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
        map.setFilter(id, ["==", ["get", "era"], Number(selectedEra)]);
      }
    });
  };

  const fitPopularPlaces = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const coords = allPlaces
      .filter((p) => Number(p?.era) === POPULAR_ERA)
      .map((p) => p?.coords)
      .filter(isLngLatOk);
    const bounds = getBoundsFromCoords(coords);

    if (bounds) {
      map.fitBounds(bounds, {
        padding: { top: 120, right: 260, bottom: 120, left: 380 },
        ...smoothFitOptions,
        duration: 2300,
      });
    }
  };

  const ensureDrivingRouteLayer = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    if (!map.getSource("driving-route")) {
      map.addSource("driving-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "driving-route-line",
        type: "line",
        source: "driving-route",
        paint: {
          "line-color": "#ff3b30",
          "line-width": 5,
          "line-opacity": 0.95,
        },
      });

      map.addLayer({
        id: "driving-route-glow",
        type: "line",
        source: "driving-route",
        paint: {
          "line-color": "#ff3b30",
          "line-width": 12,
          "line-opacity": 0.18,
        },
      });
    }
  };

  const stopRouteAnimation = () => {
    if (routeAnimationRef.current) {
      cancelAnimationFrame(routeAnimationRef.current);
      routeAnimationRef.current = null;
    }
    if (routeAnimationMarkerRef.current) {
      routeAnimationMarkerRef.current.remove();
      routeAnimationMarkerRef.current = null;
    }
  };

  const clearDrivingRoute = ({ restoreRegion = true } = {}) => {
    const map = mapRef.current;

    if (routeAbortRef.current) {
      routeAbortRef.current.abort();
      routeAbortRef.current = null;
    }

    stopRouteAnimation();
    setRouteLoading(false);
    setRouteInfo(null);

    if (!map || !mapLoadedRef.current) {
      setRouteExists(false);
      return;
    }

    const src = map.getSource("driving-route");
    if (src) src.setData({ type: "FeatureCollection", features: [] });

    if (restoreRegion && tarbagataiWasVisibleBeforeRouteRef.current) {
      showTarbagataiAndFit();
    }

    syncRouteExists();
  };

  const animateRoute = (coords) => {
    const map = mapRef.current;
    if (!map || !Array.isArray(coords) || coords.length < 2) return;

    stopRouteAnimation();

    const maxPoints = 180;
    const stepSize = Math.max(1, Math.ceil(coords.length / maxPoints));
    const sampled = coords.filter((_, idx) => idx % stepSize === 0);
    if (sampled[sampled.length - 1] !== coords[coords.length - 1]) {
      sampled.push(coords[coords.length - 1]);
    }

    routeAnimationMarkerRef.current = new mapboxgl.Marker({ color: "#ff0000" })
      .setLngLat(sampled[0])
      .addTo(map);

    let index = 0;
    let lastTs = 0;
    const speedMs = 140;

    const tick = (ts) => {
      if (!routeAnimationMarkerRef.current) return;

      if (!lastTs) lastTs = ts;
      const diff = ts - lastTs;

      if (diff >= speedMs) {
        index += 1;
        lastTs = ts;

        if (index >= sampled.length) {
          return;
        }

        routeAnimationMarkerRef.current.setLngLat(sampled[index]);
      }

      routeAnimationRef.current = requestAnimationFrame(tick);
    };

    routeAnimationRef.current = requestAnimationFrame(tick);
  };

  const getCurrentUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Бұл браузерде GPS/Geolocation қолдауы жоқ."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          const coords = [lng, lat];
          userLocRef.current = coords;

          const map = mapRef.current;
          if (map && mapLoadedRef.current) {
            if (!userMarkerRef.current) {
              userMarkerRef.current = new mapboxgl.Marker({ color: "#1b74e4" })
                .setLngLat(coords)
                .addTo(map);
            } else {
              userMarkerRef.current.setLngLat(coords);
            }
          }

          resolve(coords);
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 15000,
        }
      );
    });
  };

  const buildDrivingRoute = async (from, to, options = {}) => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current || !isLngLatOk(from) || !isLngLatOk(to)) return;

    ensureDrivingRouteLayer();

    tarbagataiWasVisibleBeforeRouteRef.current = isTarbagataiVisible();
    hideTarbagatai();
    hideZaysan();

    if (routeAbortRef.current) {
      routeAbortRef.current.abort();
    }

    stopRouteAnimation();
    setRouteLoading(true);
    setRouteInfo(null);

    const controller = new AbortController();
    routeAbortRef.current = controller;

    const src = map.getSource("driving-route");
    if (src) src.setData({ type: "FeatureCollection", features: [] });

    if (!isMapboxTokenConfigured) {
      if (routeAbortRef.current === controller) {
        routeAbortRef.current = null;
        setRouteLoading(false);
      }
      alert(`${MAPBOX_TOKEN_ENV_NAME} is missing. Add it to .env and restart the dev server.`);
      return;
    }

    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${from[0]},${from[1]};${to[0]},${to[1]}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_TOKEN}`;

    try {
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Directions API error:", res.status, txt);
        alert(
          `Маршрут салынбады. HTTP ${res.status}\n` +
            `Егер 401/403 болса — Mapbox token restrictions (localhost / vercel) тексер.`
        );
        return;
      }

      const data = await res.json();
      const route = data?.routes?.[0];
      if (!route?.geometry?.coordinates?.length) {
        alert("Маршрут табылмады.");
        return;
      }

      const routeSource = map.getSource("driving-route");
      if (!routeSource) return;

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

      setRouteInfo({
        distanceKm: Number(route.distance || 0) / 1000,
        durationMin: Number(route.duration || 0) / 60,
      });

      if (options.fit !== false) {
        const bounds = getBoundsFromCoords(route.geometry.coordinates);
        if (bounds) map.fitBounds(bounds, { padding: 90, ...smoothFitOptions });
      }

      animateRoute(route.geometry.coordinates);
      syncRouteExists();
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        alert("Интернет/желіні тексеріңіз (Directions API сұранысы өтпеді).");
      }
    } finally {
      if (routeAbortRef.current === controller) {
        routeAbortRef.current = null;
        setRouteLoading(false);
      }
    }
  };

  const openTarbagataiFromMap = (placeData = null) => {
    clearHoverPopup();
    clearDrivingRoute();
    hideZaysan();
    showTarbagataiAndFit();

    setSelected({
      type: placeData?.type || "Тау жотасы",
      name: placeData?.name || "Тарбағатай тауы",
      coords: placeData?.coords || [83.6, 47.6],
      short:
        placeData?.shortDescription ||
        "Тарбағатай жотасының шамамен аймағы көрсетілді (вытянутый сегмент).",
      full:
        placeData?.fullDescription ||
        "Бұл аймақ — шамамен белгіленген контур. Тарбағатай — табиғи, тарихи және мәдени маңызы жоғары өңір.",
      images: Array.isArray(placeData?.images) ? placeData.images : [],
      regionType: "tarbagatai",
      translations: placeData?.translations || {},
      model3d: placeData?.model3d || "",
      modelPoster: placeData?.modelPoster || "",
      modelViewerUrl: placeData?.modelViewerUrl || "",
    });
  };

  const openZaysanFromMap = (placeData = null) => {
    clearHoverPopup();
    clearDrivingRoute();
    hideTarbagatai();
    showZaysanAndFit();

    setSelected({
      type: placeData?.type || "Көл",
      name: placeData?.name || "Зайсан көлі",
      coords: placeData?.coords || [84.95, 47.78],
      short:
        placeData?.shortDescription ||
        "Зайсан көлінің контуры картада бөлек қабатпен көрсетілді.",
      full:
        placeData?.fullDescription ||
        "Зайсан көлі — Шығыс Қазақстандағы тарихи және табиғи маңызы жоғары ірі көл.",
      images: Array.isArray(placeData?.images) ? placeData.images : [],
      regionType: "zaysan",
      translations: placeData?.translations || {},
      model3d: placeData?.model3d || "",
      modelPoster: placeData?.modelPoster || "",
      modelViewerUrl: placeData?.modelViewerUrl || "",
    });
  };

  const openPlace = (p, opts = {}) => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const coords = p?.coords;
    if (!isLngLatOk(coords)) return;
    clearHoverPopup();

    const n = normalizeName(p?.name);

    if (n === normalizeName("Тарбағатай тауы") || n === normalizeName("Тарбагатай тауы")) {
      openTarbagataiFromMap(p);
      return;
    }

    if (n === normalizeName("Зайсан көлі") || n === normalizeName("Зайсан коли")) {
      openZaysanFromMap(p);
      return;
    }

    hideTarbagatai();
    hideZaysan();

    map.flyTo({
      center: coords,
      zoom: opts.zoom ?? 12.9,
      pitch: opts.pitch ?? 68,
      bearing: opts.bearing ?? 30,
      speed: opts.speed ?? 0.35,
      curve: opts.curve ?? 1.05,
      ...smoothCameraOptions,
      duration: opts.duration ?? 2400,
    });

    setSelected({
      type: p?.type || "Тарихи нысан",
      name: p?.name || "Атауы жоқ",
      coords,
      short: p?.shortDescription || "Қысқаша ақпарат жоқ.",
      full: p?.fullDescription || "Толық ақпарат жоқ.",
      images: Array.isArray(p?.images) ? p.images : [],
      translations: p?.translations || {},
      model3d: p?.model3d || "",
      modelPoster: p?.modelPoster || "",
      modelViewerUrl: p?.modelViewerUrl || "",
    });
  };

  const drawHistoricalMarkers = (list) => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    clearMarkers();

    (Array.isArray(list) ? list : []).forEach((p) => {
      const coords = p?.coords;
      if (!isLngLatOk(coords)) return;
      const pView = localizePlace(p, language);

      const marker = new mapboxgl.Marker({ color: "#d11" }).setLngLat(coords).addTo(map);
      marker.getElement().style.cursor = "pointer";

      marker.getElement().addEventListener("click", (ev) => {
        ev.stopPropagation();
        openPlace(p);
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
            `<strong>${escapeHtml(pView?.name || "Тарихи нысан")}</strong><br/><span>${escapeHtml(
              (pView?.shortDescription || getPlaceType(pView)).toString().slice(0, 120)
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

  const resetView = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    clearHoverPopup();
    clearDrivingRoute();
    hideTarbagatai();
    hideZaysan();
    clearMarkers();
    syncHistoricalBorders();
    syncProtectedAreasVisibility();
    if (mode === "history") drawHistoricalMarkers(filteredPlaces);
    setSelected(null);
    setTourOn(false);
    setTourIndex(0);

    if (mode === "history" && Number(selectedEra) === POPULAR_ERA) {
      fitPopularPlaces();
      return;
    }

    map.flyTo({
      ...initialView,
      speed: 0.38,
      curve: 1.08,
      ...smoothCameraOptions,
      duration: 2200,
    });
  };

  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      ...initialView,
      antialias: true,
      fadeDuration: 450,
      scrollZoom: true,
    });

    mapRef.current = map;

    try {
      map.scrollZoom.setWheelZoomRate?.(1 / 1700);
      map.scrollZoom.setZoomRate?.(1 / 280);
    } catch (error) {
      console.warn("Smooth zoom tuning skipped:", error);
    }

    map.on("load", () => {
      mapLoadedRef.current = true;

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

      try {
        if (!map.getSource("mapbox-dem")) {
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.terrain-rgb",
            tileSize: 512,
            maxzoom: 14,
          });
        }
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.85 });
      } catch (e) {
        console.warn("Terrain disabled:", e);
      }

      map.setFog({
        range: [-1, 2],
        color: "rgba(255,255,255,0.9)",
        "horizon-blend": 0.1,
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

        map.on("mouseenter", "tarbagatai-fill", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "tarbagatai-fill", () => (map.getCanvas().style.cursor = ""));
        map.on("click", "tarbagatai-fill", () => {
          blockNextMapClickRef.current = true;
          openTarbagataiFromMap();
          setTimeout(() => {
            blockNextMapClickRef.current = false;
          }, 0);
        });
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

        map.on("mouseenter", "zaysan-fill", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "zaysan-fill", () => (map.getCanvas().style.cursor = ""));
        map.on("click", "zaysan-fill", () => {
          blockNextMapClickRef.current = true;
          openZaysanFromMap();
          setTimeout(() => {
            blockNextMapClickRef.current = false;
          }, 0);
        });
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

        map.on("mouseenter", "protected-areas-fill", (e) => {
          map.getCanvas().style.cursor = "pointer";

          const feature = e.features?.[0];

          if (hoverPopupRef.current) hoverPopupRef.current.remove();
          hoverPopupRef.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 14,
            maxWidth: "240px",
          })
            .setLngLat(e.lngLat)
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

        map.on("click", "protected-areas-fill", (e) => {
          const areaId = e.features?.[0]?.properties?.id;
          const place = allPlaces.find((p) => p?.protectedAreaId === areaId);
          if (!place) return;

          blockNextMapClickRef.current = true;
          openPlace(place);
          setTimeout(() => {
            blockNextMapClickRef.current = false;
          }, 0);
        });
      }

      ensureDrivingRouteLayer();
      syncRouteExists();
      syncHistoricalBorders();
      syncProtectedAreasVisibility();

      if (mode === "history") drawHistoricalMarkers(filteredPlaces);
    });

    map.on("click", (e) => {
      if (blockNextMapClickRef.current) {
        blockNextMapClickRef.current = false;
        return;
      }

      if (modeRef.current !== "now") return;
      if (!mapLoadedRef.current) return;

      const box = [
        [e.point.x - 6, e.point.y - 6],
        [e.point.x + 6, e.point.y + 6],
      ];

      const features = map.queryRenderedFeatures(box);
      if (!features || features.length === 0) return;

      const placeFeature =
        features.find((f) => f.layer?.id?.includes("place-label") && f.properties?.name) ||
        features.find((f) => f.properties?.name);

      if (!placeFeature) return;

      const clickedNameRaw = placeFeature.properties?.name;
      if (!clickedNameRaw) return;

      const clickedName = String(clickedNameRaw).trim();
      const key = normalizeName(clickedName);

      const settlement = settlementsByName.get(key);
      if (!settlement) return;

      const coords = settlement?.geometry?.coordinates;
      if (!isLngLatOk(coords)) {
        console.warn("Проверь координаты в settlements.json, должно быть [lng, lat]:", settlement);
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
        model3d: props.model3d || "",
        modelPoster: props.modelPoster || "",
        modelViewerUrl: props.modelViewerUrl || "",
      });
    });

    return () => {
      clearDrivingRoute({ restoreRegion: false });
      map.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapLoadedRef.current) return;

    setSelected(null);
    clearDrivingRoute();
    hideTarbagatai();
    hideZaysan();
    syncHistoricalBorders();
    syncProtectedAreasVisibility();

    if (mode !== "history") {
      syncHistoricalBorders();
      setProtectedAreasVisible(false);
      setTourOn(false);
      setTourIndex(0);
      clearMarkers();
      return;
    }

    syncHistoricalBorders();
    syncProtectedAreasVisibility();
    drawHistoricalMarkers(filteredPlaces);
    if (Number(selectedEra) === POPULAR_ERA) fitPopularPlaces();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapLoadedRef.current) return;
    if (mode === "history") {
      setTourOn(false);
      setTourIndex(0);
      hideTarbagatai();
      hideZaysan();
      syncHistoricalBorders();
      syncProtectedAreasVisibility();
      drawHistoricalMarkers(filteredPlaces);
      if (Number(selectedEra) === POPULAR_ERA) fitPopularPlaces();
    } else {
      setProtectedAreasVisible(false);
    }
  }, [selectedEra]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapLoadedRef.current) return;
    if (mode !== "history") return;
    syncHistoricalBorders();
    syncProtectedAreasVisibility();
    drawHistoricalMarkers(filteredPlaces);
  }, [filteredPlaces, mode, language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tourOn) return;
    if (filteredPlaces.length === 0) {
      setTourOn(false);
      return;
    }
    if (tourIndex > filteredPlaces.length - 1) setTourIndex(0);
  }, [filteredPlaces, tourOn, tourIndex]);

  const closeSelected = () => {
    clearHoverPopup();
    setSelected(null);
    setShowModelViewer(false);
    hideTarbagatai();
    hideZaysan();
  };

  const has3D = Boolean(selected?.model3d || selected?.modelViewerUrl);
  const selectedView = useMemo(() => localizePlace(selected, language), [selected, language]);
  const tr = uiText[language] || uiText.kk;

  const openRouteFromUserPosition = async () => {
    if (!selected?.coords || routeLoading) return;

    try {
      const currentCoords = await getCurrentUserLocation();
      await buildDrivingRoute(currentCoords, selected.coords);
    } catch (error) {
      console.error(error);
      alert("GPS орнын алу мүмкін болмады. Браузерден геолокацияға рұқсат беріңіз.");
    }
  };

  return (
    <>
      <div ref={mapContainerRef} style={{ width: "100vw", height: "100vh" }} />

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 20,
          display: "flex",
          gap: 10,
          background: "rgba(255,255,255,0.92)",
          padding: 10,
          borderRadius: 12,
          boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
          alignItems: "center",
          fontFamily: "system-ui, Arial",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            setSelected(null);
            setMode("now");
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: mode === "now" ? "#111" : "#fff",
            color: mode === "now" ? "#fff" : "#111",
            fontWeight: 700,
          }}
        >
          {tr.currentMap}
        </button>

        <button
          onClick={() => {
            setSelected(null);
            setMode("history");
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: mode === "history" ? "#111" : "#fff",
            color: mode === "history" ? "#fff" : "#111",
            fontWeight: 700,
          }}
        >
          {tr.historyMap}
        </button>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowSettings((value) => !value)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: "pointer",
              background: showSettings ? "#111" : "#fff",
              color: showSettings ? "#fff" : "#111",
              fontWeight: 700,
            }}
          >
            {tr.settings}
          </button>

          {showSettings && (
            <div
              style={{
                position: "absolute",
                top: 46,
                left: 0,
                width: 220,
                background: "rgba(255,255,255,0.98)",
                borderRadius: 12,
                padding: 12,
                boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
                border: "1px solid rgba(0,0,0,0.08)",
                zIndex: 60,
              }}
            >
              <label
                style={{
                  display: "grid",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {tr.language}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 9px",
                    borderRadius: 9,
                    border: "1px solid #ddd",
                    background: "#fff",
                    fontWeight: 800,
                    outline: "none",
                  }}
                >
                  {Object.entries(languageNames).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <button
          onClick={resetView}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: "#fff",
            fontWeight: 700,
          }}
        >
          {tr.resetView}
        </button>

        {(routeExists || routeLoading) && (
          <button
            onClick={clearDrivingRoute}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: "pointer",
              background: "#fff",
              fontWeight: 700,
            }}
            title={tr.clearRoute}
          >
            {tr.clearRoute}
          </button>
        )}

        {mode === "history" && (
          <>
            <button
              onClick={() => {
                if (filteredPlaces.length === 0) return;
                setTourOn(true);
                setTourIndex(0);
                openPlace(filteredPlaces[0], { zoom: 14.2, pitch: 78, bearing: 25 });
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                cursor: "pointer",
                background: tourOn ? "#111" : "#fff",
                color: tourOn ? "#fff" : "#111",
                fontWeight: 700,
              }}
            >
              {tourOn ? tr.tourOn : tr.tour}
            </button>

            {tourOn && (
              <>
                <button
                  onClick={() => {
                    const i = Math.max(0, tourIndex - 1);
                    setTourIndex(i);
                    openPlace(filteredPlaces[i]);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    background: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {tr.previous}
                </button>

                <button
                  onClick={() => {
                    const i = Math.min(filteredPlaces.length - 1, tourIndex + 1);
                    setTourIndex(i);
                    openPlace(filteredPlaces[i]);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    background: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {tr.next}
                </button>

                <button
                  onClick={() => {
                    setTourOn(false);
                    setTourIndex(0);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    background: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {tr.stop}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {mode === "history" && (
        <div
          style={{
            position: "absolute",
            top: 78,
            left: 16,
            width: 340,
            maxWidth: "92vw",
            maxHeight: "72vh",
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
          <div style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
              {tr.search} ({tr.era.toLowerCase()}: {eras[selectedEra]})
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr.searchPlaceholder}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                outline: "none",
                fontSize: 14,
              }}
            />

            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="all">{tr.allTypes}</option>
                {placeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={onlyWithMedia}
                  onChange={(e) => setOnlyWithMedia(e.target.checked)}
                />
                {tr.mediaOnly}
              </label>

              {(query || selectedType !== "all" || onlyWithMedia) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedType("all");
                    setOnlyWithMedia(false);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    background: "#fff",
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  {tr.clearFilters}
                </button>
              )}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              {tr.found}: <b>{filteredPlaces.length}</b>
              {" · "}{tr.media}: <b>{filteredPlaces.filter(hasPlaceMedia).length}</b>
            </div>

            {tourOn && filteredPlaces.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                {tr.tour}: <b>{tourIndex + 1}</b> / {filteredPlaces.length}
              </div>
            )}
          </div>

          <div style={{ overflowY: "auto" }}>
            {filteredPlaces.map((p, idx) => {
              const pView = localizePlace(p, language);
              const n = normalizeName(p?.name);
              const isTar =
                n === normalizeName("Тарбағатай тауы") ||
                n === normalizeName("Тарбагатай тауы");
              const isZaysan =
                n === normalizeName("Зайсан көлі") ||
                n === normalizeName("Зайсан коли");

              return (
                <div
                  key={p.id ?? `${p.name}-${idx}`}
                  onClick={() => {
                    if (tourOn) setTourIndex(idx);

                    if (isTar) {
                      openTarbagataiFromMap(p);
                      return;
                    }

                    if (isZaysan) {
                      openZaysanFromMap(p);
                      return;
                    }

                    openPlace(p);
                  }}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    background: tourOn && idx === tourIndex ? "rgba(0,0,0,0.06)" : "transparent",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{pView.name || "Атауы жоқ"}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 3 }}>
                    {pView.shortDescription
                      ? pView.shortDescription.slice(0, 90)
                      : "Қысқаша ақпарат жоқ."}
                    {pView.shortDescription && pView.shortDescription.length > 90 ? "…" : ""}
                  </div>
                </div>
              );
            })}

            {filteredPlaces.length === 0 && (
              <div style={{ padding: 12, opacity: 0.7, fontSize: 13 }}>
                {tr.noResults}
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "history" && (
        <div
          style={{
            position: "absolute",
            right: 16,
            bottom: 84,
            width: 220,
            maxWidth: "calc(100vw - 32px)",
            background: "rgba(255,255,255,0.92)",
            borderRadius: 12,
            padding: 12,
            zIndex: 21,
            boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
            fontFamily: "system-ui, Arial",
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 8 }}>{tr.legend}</div>
          <div style={{ display: "grid", gap: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, background: "#d11" }} />
              {tr.historicalObject}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 22, height: 4, borderRadius: 999, background: "#ff3b30" }} />
              {tr.gpsRoute}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  border: "2px solid #0ea5e9",
                  background: "rgba(14,165,233,0.14)",
                }}
              />
              {tr.regionContour}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 22,
                  height: 0,
                  borderTop: "2px dashed #f59e0b",
                }}
              />
              {tr.historicalBorder}
            </div>
            {Number(selectedEra) === POPULAR_ERA && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: "2px solid #16a34a",
                    background: "rgba(34,197,94,0.16)",
                  }}
                />
                {tr.protectedArea || "Reserve or national park"}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 900 }}>3D</span>
              {tr.mediaObject}
            </div>
          </div>
        </div>
      )}

      {mode === "history" && (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.92)",
            padding: 12,
            borderRadius: 12,
            zIndex: 20,
            minWidth: 280,
            boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
            fontFamily: "system-ui, Arial",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>{tr.era}</div>
          <input
            type="range"
            min="0"
            max={eras.length - 1}
            value={selectedEra}
            onChange={(e) => setSelectedEra(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "center", marginTop: 6, fontWeight: 800 }}>
            {eras[selectedEra]}
          </div>
        </div>
      )}

      {selected && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 380,
            maxWidth: "92vw",
            background: "white",
            borderRadius: 14,
            padding: 16,
            zIndex: 25,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            fontFamily: "system-ui, Arial",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>{selectedView.type}</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{selectedView.name}</div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                {tr.coordinates}: {toFixed5(selected.coords?.[1])}, {toFixed5(selected.coords?.[0])}
              </div>

              {selected?.coords && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selected.coords[1]},${selected.coords[0]}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      textDecoration: "none",
                      color: "#111",
                      fontWeight: 800,
                      background: "#fff",
                    }}
                  >
                    {tr.navigation}
                  </a>

                  <button
                    onClick={() => {
                      const text = `${selected.coords[1]}, ${selected.coords[0]}`;
                      navigator.clipboard?.writeText(text);
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                      background: "#fff",
                      fontWeight: 800,
                    }}
                  >
                    {tr.copy}
                  </button>

                  {!routeExists && (
                    <button
                      onClick={openRouteFromUserPosition}
                      disabled={routeLoading}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        cursor: routeLoading ? "wait" : "pointer",
                        background: routeLoading ? "#f3f3f3" : "#fff",
                        opacity: routeLoading ? 0.75 : 1,
                        fontWeight: 800,
                      }}
                    >
                      {routeLoading ? tr.routeLoading : tr.routeGps}
                    </button>
                  )}

                  {routeExists && (
                    <button
                      onClick={clearDrivingRoute}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        background: "#fff",
                        fontWeight: 800,
                      }}
                    >
                      {tr.clearRoute}
                    </button>
                  )}

                  {has3D && (
                    <button
                      onClick={() => setShowModelViewer(true)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        background: "#fff",
                        fontWeight: 800,
                      }}
                    >
                      {tr.show3d}
                    </button>
                  )}

                  {nearbyPlaces.length > 0 && (
                    <button
                      onClick={() => setShowNearby((value) => !value)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        background: showNearby ? "#111" : "#fff",
                        color: showNearby ? "#fff" : "#111",
                        fontWeight: 800,
                      }}
                    >
                      {tr.nearby}
                    </button>
                  )}
                </div>
              )}

              {routeInfo && (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                  {tr.distance}: <b>{routeInfo.distanceKm.toFixed(1)} км</b> · {tr.time}: <b>{Math.round(routeInfo.durationMin)} {tr.min}</b>
                </div>
              )}

              {showNearby && nearbyPlaces.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 10px",
                      fontWeight: 900,
                      fontSize: 13,
                      borderBottom: "1px solid rgba(0,0,0,0.07)",
                    }}
                  >
                    {tr.nearest}
                  </div>

                  {nearbyPlaces.map((place) => (
                    <button
                      key={`${place.id ?? place.name}-nearby`}
                      type="button"
                      onClick={() => openPlace(place)}
                      style={{
                        width: "100%",
                        border: "none",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        background: "transparent",
                        padding: "8px 10px",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontWeight: 800 }}>{localizePlace(place, language)?.name}</span>
                      <span style={{ opacity: 0.68 }}>{place.distanceKm.toFixed(1)} км</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={closeSelected}
              style={{
                border: "none",
                background: "#f2f2f2",
                borderRadius: 10,
                width: 36,
                height: 36,
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.4 }}>{selectedView.short}</div>

          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 800 }}>{tr.more}</summary>

            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                lineHeight: 1.4,
                maxHeight: "45vh",
                overflowY: "auto",
                paddingRight: 6,
              }}
            >
              {selectedView.full}

              {selected.images?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => setShowGallery((v) => !v)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                      background: "#fff",
                      fontWeight: 800,
                    }}
                  >
                    {showGallery ? tr.closeImages : tr.images} ({selected.images.length})
                  </button>
                </div>
              )}

              {showGallery && selected.images?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#f3f3f3",
                    }}
                  >
                    <img
                      src={selected.images[slideIndex]}
                      alt=""
                      style={{
                        width: "100%",
                        display: "block",
                        maxHeight: 260,
                        objectFit: "cover",
                      }}
                    />

                    {selected.images.length > 1 && (
                      <button
                        onClick={() =>
                          setSlideIndex((i) => (i - 1 + selected.images.length) % selected.images.length)
                        }
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 10,
                          transform: "translateY(-50%)",
                          border: "none",
                          background: "rgba(0,0,0,0.45)",
                          color: "white",
                          width: 36,
                          height: 36,
                          borderRadius: 999,
                          cursor: "pointer",
                          fontSize: 18,
                          fontWeight: 900,
                          lineHeight: "36px",
                        }}
                      >
                        ‹
                      </button>
                    )}

                    {selected.images.length > 1 && (
                      <button
                        onClick={() => setSlideIndex((i) => (i + 1) % selected.images.length)}
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: 10,
                          transform: "translateY(-50%)",
                          border: "none",
                          background: "rgba(0,0,0,0.45)",
                          color: "white",
                          width: 36,
                          height: 36,
                          borderRadius: 999,
                          cursor: "pointer",
                          fontSize: 18,
                          fontWeight: 900,
                          lineHeight: "36px",
                        }}
                      >
                        ›
                      </button>
                    )}

                    {selected.images.length > 1 && (
                      <div
                        style={{
                          position: "absolute",
                          right: 10,
                          bottom: 10,
                          background: "rgba(0,0,0,0.5)",
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {slideIndex + 1} / {selected.images.length}
                      </div>
                    )}
                  </div>

                  {selected.images.length > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
                      {selected.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSlideIndex(i)}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            border: "none",
                            cursor: "pointer",
                            background: i === slideIndex ? "#111" : "#cfcfcf",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      {showModelViewer && selected && (
        <ObjectPresentation
          place={selected}
          onClose={() => setShowModelViewer(false)}
        />
      )}

      <AiAssistant
        selectedPlace={selectedView}
        visiblePlaces={filteredPlaces.map((place) => localizePlace(place, language))}
        language={language}
      />
    </>
  );
}

export default function MapView() {
  return isMapboxTokenConfigured ? <MapViewInner /> : <MissingMapboxTokenState />;
}
