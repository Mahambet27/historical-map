import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import settlements from "./data/settlements.json";
import places from "./data/places.json";
import { tarbagataiGeojson, zaysanGeojson } from "./data/regionContours.js";
import {
  normalizeName,
  isLngLatOk,
  toFixed5,
  getBoundsFromCoords,
  clearMarkersList,
} from "./utils/mapHelpers";
import ObjectPresentation from "./ObjectPresentation";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const mapLoadedRef = useRef(false);
  const blockNextMapClickRef = useRef(false);

  const userLocRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeAnimationMarkerRef = useRef(null);
  const routeAbortRef = useRef(null);
  const selectedRef = useRef(null);
  const routeAnimationRef = useRef(null);
  const routeExistsRef = useRef(false);

  const tarbagataiWasVisibleBeforeRouteRef = useRef(false);

  const [mode, setMode] = useState("now");
  const [selectedEra, setSelectedEra] = useState(0);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [tourOn, setTourOn] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [routeExists, setRouteExists] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showModelViewer, setShowModelViewer] = useState(false);

  useEffect(() => {
    selectedRef.current = selected;
    setSlideIndex(0);
    setShowGallery(false);
    setShowModelViewer(false);
  }, [selected]);

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
    () => ["Қола дәуірі", "Сақ дәуірі", "Түркі кезеңі", "Қазақ хандығы", "КСРО", ""],
    []
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
    return (Array.isArray(places) ? places : [])
      .filter((p) => Number(p?.era) === Number(selectedEra))
      .filter((p) => isLngLatOk(p?.coords));
  }, [selectedEra]);

  const filteredPlaces = useMemo(() => {
    const q = normalizeName(query);
    if (!q) return eraPlaces;

    return eraPlaces.filter((p) => {
      const name = normalizeName(p?.name);
      const short = normalizeName(p?.shortDescription);
      return name.includes(q) || short.includes(q);
    });
  }, [eraPlaces, query]);

  const clearMarkers = () => clearMarkersList(markersRef);

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
    if (bounds) map.fitBounds(bounds, { padding: 70, duration: 900 });
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
    if (bounds) map.fitBounds(bounds, { padding: 70, duration: 900 });
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

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      if (routeAbortRef.current === controller) {
        routeAbortRef.current = null;
        setRouteLoading(false);
      }
      alert("VITE_MAPBOX_TOKEN жоқ (.env тексер).");
      return;
    }

    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${from[0]},${from[1]};${to[0]},${to[1]}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${token}`;

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
        if (bounds) map.fitBounds(bounds, { padding: 80, duration: 900 });
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
      model3d: placeData?.model3d || "",
      modelPoster: placeData?.modelPoster || "",
      modelViewerUrl: placeData?.modelViewerUrl || "",
    });
  };

  const openZaysanFromMap = (placeData = null) => {
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
      zoom: opts.zoom ?? 13.8,
      pitch: opts.pitch ?? 75,
      bearing: opts.bearing ?? 30,
      speed: opts.speed ?? 0.75,
      curve: opts.curve ?? 1.5,
      essential: true,
    });

    setSelected({
      type: p?.type || "Тарихи нысан",
      name: p?.name || "Атауы жоқ",
      coords,
      short: p?.shortDescription || "Қысқаша ақпарат жоқ.",
      full: p?.fullDescription || "Толық ақпарат жоқ.",
      images: Array.isArray(p?.images) ? p.images : [],
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

      const marker = new mapboxgl.Marker({ color: "#d11" }).setLngLat(coords).addTo(map);
      marker.getElement().style.cursor = "pointer";

      marker.getElement().addEventListener("click", (ev) => {
        ev.stopPropagation();
        openPlace(p);
      });

      markersRef.current.push(marker);
    });
  };

  const resetView = () => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    clearDrivingRoute();
    hideTarbagatai();
    hideZaysan();
    clearMarkers();
    setSelected(null);
    setTourOn(false);
    setTourIndex(0);

    map.flyTo({ ...initialView, speed: 0.9, curve: 1.4, essential: true });
  };

  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      ...initialView,
      antialias: true,
    });

    mapRef.current = map;

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

      ensureDrivingRouteLayer();
      syncRouteExists();

      if (mode === "history") drawHistoricalMarkers(filteredPlaces);
    });

    map.on("click", (e) => {
      if (blockNextMapClickRef.current) {
        blockNextMapClickRef.current = false;
        return;
      }

      if (mode !== "now") return;
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
        speed: 0.85,
        curve: 1.4,
        essential: true,
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

    if (mode !== "history") {
      setTourOn(false);
      setTourIndex(0);
      clearMarkers();
      return;
    }

    drawHistoricalMarkers(filteredPlaces);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapLoadedRef.current) return;
    if (mode === "history") {
      setTourOn(false);
      setTourIndex(0);
      hideTarbagatai();
      hideZaysan();
      drawHistoricalMarkers(filteredPlaces);
    }
  }, [selectedEra]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapLoadedRef.current) return;
    if (mode !== "history") return;
    drawHistoricalMarkers(filteredPlaces);
  }, [filteredPlaces, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tourOn) return;
    if (filteredPlaces.length === 0) {
      setTourOn(false);
      return;
    }
    if (tourIndex > filteredPlaces.length - 1) setTourIndex(0);
  }, [filteredPlaces, tourOn, tourIndex]);

  const closeSelected = () => {
    setSelected(null);
    setShowModelViewer(false);
    hideTarbagatai();
    hideZaysan();
  };

  const has3D = Boolean(selected?.model3d || selected?.modelViewerUrl);

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
          Карта қазір
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
          Тарихи карта
        </button>

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
          ← Жалпы көрініс
        </button>

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
          title="Маршрутты өшіру"
        >
          Маршрутты өшіру
        </button>

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
              {tourOn ? "Экскурсия қосулы" : "Экскурсия"}
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
                  ← Алдыңғы
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
                  Келесі →
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
                  Тоқтату
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
              Іздеу (эпоха: {eras[selectedEra]})
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Атауы немесе сипаттамасы..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                outline: "none",
                fontSize: 14,
              }}
            />

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              Табылды: <b>{filteredPlaces.length}</b>
            </div>

            {tourOn && filteredPlaces.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                Экскурсия: <b>{tourIndex + 1}</b> / {filteredPlaces.length}
              </div>
            )}
          </div>

          <div style={{ overflowY: "auto" }}>
            {filteredPlaces.map((p, idx) => {
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
                  <div style={{ fontWeight: 900 }}>{p.name || "Атауы жоқ"}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 3 }}>
                    {p.shortDescription ? p.shortDescription.slice(0, 90) : "Қысқаша ақпарат жоқ."}
                    {p.shortDescription && p.shortDescription.length > 90 ? "…" : ""}
                  </div>
                </div>
              );
            })}

            {filteredPlaces.length === 0 && (
              <div style={{ padding: 12, opacity: 0.7, fontSize: 13 }}>
                Ештеңе табылмады.
              </div>
            )}
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
          <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>Эпоха</div>
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
              <div style={{ fontSize: 12, opacity: 0.65 }}>{selected.type}</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{selected.name}</div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                Коорд: {toFixed5(selected.coords?.[1])}, {toFixed5(selected.coords?.[0])}
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
                    Навигация (Google)
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
                    Көшіру
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
                      {routeLoading ? "Маршрут жүктелуде..." : "Маршрут (GPS)"}
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
                      Маршрутты өшіру
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
                      3D көрсету
                    </button>
                  )}
                </div>
              )}

              {routeInfo && (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                  Қашықтық: <b>{routeInfo.distanceKm.toFixed(1)} км</b> · Уақыт: <b>{Math.round(routeInfo.durationMin)} мин</b>
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

          <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.4 }}>{selected.short}</div>

          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 800 }}>Толығырақ</summary>

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
              {selected.full}

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
                    {showGallery ? "Суреттерді жабу" : "Суреттер"} ({selected.images.length})
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
    </>
  );
}
