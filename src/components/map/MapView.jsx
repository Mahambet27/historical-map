import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  normalizeName,
  isLngLatOk,
  toFixed5,
  getBoundsFromCoords,
  clearMarkersList,
} from "../../lib/mapHelpers";
import { setupRouteLayer } from "../../layers/RouteLayer";
import {
  APP_NAME,
  MAPBOX_TOKEN,
  MAPBOX_TOKEN_ENV_NAME,
  isMapboxTokenConfigured,
} from "../../config/env.js";
import useLocalStorage from "../../hooks/useLocalStorage.js";
import useMapData from "../../hooks/useMapData.js";
import useMapbox from "../../hooks/useMapbox";
import ErrorState from "../ui/ErrorState";
import { drawHistoricalMarkerList } from "./markerUtils";
import MapTopControls from "./MapTopControls.jsx";
import {
  HISTORICAL_BORDER_LAYER_IDS,
  POPULAR_ERA,
  PROTECTED_AREA_LAYER_IDS,
  distanceKm,
  favoriteText,
  getPlaceFavoriteId,
  getPlaceType,
  hasPlaceMedia,
  localizePlace,
  smoothCameraOptions,
  smoothFitOptions,
} from "./mapViewUtils.js";

const LazyObjectPresentation = lazy(() => import("../places/ObjectPresentation"));
const LazyAiAssistant = lazy(() => import("../chat/AiAssistant"));
const LazyMapSidebar = lazy(() => import("./MapSidebar.jsx"));
const LazySelectedPlacePanel = lazy(() => import("../places/SelectedPlacePanel.jsx"));

if (isMapboxTokenConfigured) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}


const MissingMapboxTokenState = () => (
  <ErrorState eyebrow={APP_NAME} title="Mapbox token is missing">
    Add a public Mapbox token to your local <b>.env</b> file as{" "}
    <code>{MAPBOX_TOKEN_ENV_NAME}=your_mapbox_public_token_here</code>, then restart the development
    server. The app has stopped before loading the map so it does not crash or leak configuration
    details.
  </ErrorState>
);

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
    mediaObject: "Фото немесе модель бар нысан",
    coordinates: "Координаттар",
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
    coordinates: "Координаты",
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
    searchPlaceholder: "Search by name or description...",
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

const MapLoadingState = () => (
  <div className="hm-map-state hm-map-state--loading" aria-live="polite">
    <div className="hm-loader" />
    <div>
      <strong>Loading map</strong>
      <span>Preparing terrain, places, and routes...</span>
    </div>
  </div>
);

const MapErrorState = ({
  message = "Check the Mapbox token, network access, or domain restrictions.",
}) => (
  <div className="hm-map-state hm-map-state--error" role="alert">
    <strong>Map could not be loaded</strong>
    <span>{message}</span>
  </div>
);

const LazyPanelFallback = ({ label = "Loading panel..." }) => (
  <div className="hm-lazy-fallback" aria-live="polite">
    {label}
  </div>
);

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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoritePlaceIds, setFavoritePlaceIds] = useLocalStorage(
    "historical-map:favorites",
    []
  );
  const [mapStatus, setMapStatus] = useState("loading");
  const [tourOn, setTourOn] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [routeExists, setRouteExists] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [showChatGuide, setShowChatGuide] = useState(false);
  const { data: mapData, error: mapDataError, loading: mapDataLoading } = useMapData();
  const {
    settlements,
    places,
    additionalEraPlaces,
    popularPlaces,
    historicalBorderContours,
    historicalBorderLabels,
    tarbagataiGeojson,
    zaysanGeojson,
    protectedAreaContours,
  } = mapData;
  const mapDataReady = !mapDataLoading && !mapDataError;

  const safeFavoritePlaceIds = useMemo(
    () => (Array.isArray(favoritePlaceIds) ? favoritePlaceIds : []),
    [favoritePlaceIds]
  );
  const favoritePlaceIdSet = useMemo(
    () => new Set(safeFavoritePlaceIds),
    [safeFavoritePlaceIds]
  );
  const isFavoritePlace = (place) => favoritePlaceIdSet.has(getPlaceFavoriteId(place));
  const toggleFavoritePlace = (place) => {
    const id = getPlaceFavoriteId(place);
    setFavoritePlaceIds((ids) => {
      const current = Array.isArray(ids) ? ids : [];
      return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    });
  };

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
      zoom: 7.35,
      pitch: 62,
      bearing: -18,
    }),
    []
  );

  const overviewView = useMemo(
    () => ({
      center: [83.6, 47.6],
      zoom: 7.65,
      pitch: 68,
      bearing: -22,
    }),
    []
  );

  const allPlaces = useMemo(() => {
    return [
      ...(Array.isArray(places) ? places : []),
      ...(Array.isArray(additionalEraPlaces) ? additionalEraPlaces : []),
      ...(Array.isArray(popularPlaces) ? popularPlaces : []),
    ];
  }, [additionalEraPlaces, places, popularPlaces]);

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
  }, [settlements]);

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
      if (showFavoritesOnly && !favoritePlaceIdSet.has(getPlaceFavoriteId(p))) return false;
      if (!q) return true;

      const name = normalizeName(localized?.name);
      const short = normalizeName(localized?.shortDescription);
      return name.includes(q) || short.includes(q);
    });
  }, [
    eraPlaces,
    language,
    query,
    selectedType,
    onlyWithMedia,
    showFavoritesOnly,
    favoritePlaceIdSet,
  ]);

  const nearbyPlaces = useMemo(() => {
    if (!selected?.coords) return [];

    return allPlaces
      .filter((p) => p?.name && p.name !== selected.name && isLngLatOk(p?.coords))
      .map((p) => ({ ...p, distanceKm: distanceKm(selected.coords, p.coords, isLngLatOk) }))
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

    setupRouteLayer(map);

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
        "Тарбағатай жотасының шамамен аймағы көрсетілді (ұзартылған сегмент).",
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
        "Зайсан көлі — Шығыс Қазақстандағы тарихи және табиғи маңызы зор ірі көл.",
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

    if (n === normalizeName("Зайсан көлі") || n === normalizeName("Зайсан колы")) {
      openZaysanFromMap(p);
      return;
    }

    hideTarbagatai();
    hideZaysan();

    map.flyTo({
      center: coords,
      zoom: opts.zoom ?? 12.9,
      pitch: opts.pitch ?? 75,
      bearing: opts.bearing ?? -20,
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

    drawHistoricalMarkerList({
      list,
      language,
      markersRef,
      hoverPopupRef,
      map,
      onOpenPlace: openPlace,
    });
  };

  const resetView = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const logOverviewState = () => {
      if (!import.meta.env.DEV) return;

      window.setTimeout(() => {
        const overviewMap = mapRef.current;
        if (!overviewMap) return;

        console.log("After overview terrain:", overviewMap.getTerrain?.());
        console.log("After overview camera:", {
          center: overviewMap.getCenter?.().toArray?.(),
          zoom: overviewMap.getZoom?.(),
          pitch: overviewMap.getPitch?.(),
          bearing: overviewMap.getBearing?.(),
        });
      }, 1000);
    };

    clearHoverPopup();
    clearDrivingRoute();
    hideTarbagatai();
    hideZaysan();
    clearMarkers();
    syncHistoricalBorders();
    syncProtectedAreasVisibility();
    setSelected(null);
    setTourOn(false);
    setTourIndex(0);

    if (mode !== "history") {
      setMode("history");
      logOverviewState();
      return;
    }

    drawHistoricalMarkers(filteredPlaces);

    map.flyTo({
      ...overviewView,
      speed: 0.38,
      curve: 1.08,
      ...smoothCameraOptions,
      duration: 1600,
    });

    if (import.meta.env.DEV) {
      console.log("Overview camera restored", overviewView);
    }
    logOverviewState();
  };

  useMapbox({
    allPlaces,
    blockNextMapClickRef,
    buildDrivingRoute,
    clearDrivingRoute,
    drawHistoricalMarkers,
    enabled: mapDataReady,
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
  });

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
  const visiblePlacesForChat = useMemo(
    () => filteredPlaces.map((place) => localizePlace(place, language)),
    [filteredPlaces, language]
  );
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
      <div
        ref={mapContainerRef}
        className="hm-map-canvas"
        style={{ width: "100%", height: "100%" }}
      />

      {(mapStatus === "loading" || mapDataLoading) && !mapDataError && <MapLoadingState />}
      {mapStatus === "error" && <MapErrorState />}
      {mapDataError && (
        <MapErrorState message="Historical map data could not be loaded. Refresh the page or check the local build output." />
      )}

      <MapTopControls
        clearDrivingRoute={clearDrivingRoute}
        filteredPlaces={filteredPlaces}
        language={language}
        languageNames={languageNames}
        mode={mode}
        openPlace={openPlace}
        resetView={resetView}
        routeExists={routeExists}
        routeLoading={routeLoading}
        setLanguage={setLanguage}
        setMode={setMode}
        setSelected={setSelected}
        setShowSettings={setShowSettings}
        setTourIndex={setTourIndex}
        setTourOn={setTourOn}
        showSettings={showSettings}
        tourIndex={tourIndex}
        tourOn={tourOn}
        tr={tr}
      />

      {mode === "history" && !selected && (
        <Suspense fallback={<LazyPanelFallback label="Loading history panel..." />}>
          <LazyMapSidebar
            eras={eras}
            filteredPlaces={filteredPlaces}
            isFavoritePlace={isFavoritePlace}
            language={language}
            onlyWithMedia={onlyWithMedia}
            openPlace={openPlace}
            openTarbagataiFromMap={openTarbagataiFromMap}
            openZaysanFromMap={openZaysanFromMap}
            placeTypes={placeTypes}
            query={query}
            safeFavoritePlaceIds={safeFavoritePlaceIds}
            selectedEra={selectedEra}
            selectedType={selectedType}
            setOnlyWithMedia={setOnlyWithMedia}
            setQuery={setQuery}
            setSelectedType={setSelectedType}
            setShowFavoritesOnly={setShowFavoritesOnly}
            setTourIndex={setTourIndex}
            showFavoritesOnly={showFavoritesOnly}
            toggleFavoritePlace={toggleFavoritePlace}
            tourIndex={tourIndex}
            tourOn={tourOn}
            tr={tr}
          />
        </Suspense>
      )}

      {mode === "history" && (
        <div
          className="hm-legend"
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
          className="hm-era-control"
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
        <Suspense fallback={<LazyPanelFallback label="Loading place panel..." />}>
          <LazySelectedPlacePanel
            selected={selected}
            selectedView={selectedView}
            tr={tr}
            toFixed5={toFixed5}
            routeInfo={routeInfo}
            nearbyPlaces={nearbyPlaces}
            has3D={has3D}
            routeExists={routeExists}
            routeLoading={routeLoading}
            showNearby={showNearby}
            setShowNearby={setShowNearby}
            showGallery={showGallery}
            setShowGallery={setShowGallery}
            slideIndex={slideIndex}
            setSlideIndex={setSlideIndex}
            onClose={closeSelected}
            openPlace={openPlace}
            openRouteFromUserPosition={openRouteFromUserPosition}
            clearDrivingRoute={clearDrivingRoute}
            onOpenModelViewer={() => setShowModelViewer(true)}
            isFavoritePlace={isFavoritePlace}
            toggleFavoritePlace={toggleFavoritePlace}
            favoriteText={favoriteText}
            localizePlace={localizePlace}
            language={language}
          />
        </Suspense>
      )}

      {showModelViewer && selected && (
        <Suspense fallback={<LazyPanelFallback label="Loading 3D viewer..." />}>
          <LazyObjectPresentation
            place={selected}
            onClose={() => setShowModelViewer(false)}
          />
        </Suspense>
      )}

      {showChatGuide ? (
        <Suspense fallback={<LazyPanelFallback label="Loading chat guide..." />}>
          <LazyAiAssistant
            selectedPlace={selectedView}
            visiblePlaces={visiblePlacesForChat}
            language={language}
            initialOpen
          />
        </Suspense>
      ) : (
        <button
          type="button"
          onClick={() => setShowChatGuide(true)}
          className="hm-chat-launch"
          title="Chat guide"
        >
          Chat guide
        </button>
      )}
    </>
  );
}

export default function MapView() {
  return isMapboxTokenConfigured ? <MapViewInner /> : <MissingMapboxTokenState />;
}

