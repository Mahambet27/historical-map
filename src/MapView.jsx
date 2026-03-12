import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import settlements from "./data/settlements.json";
import places from "./data/places.json";
import { tarbagataiGeojson, zaysanGeojson } from "./data/regionContours";
import {
  normalizeName,
  isLngLatOk,
  toFixed5,
  getBoundsFromCoords,
  clearMarkersList,
} from "./utils/mapHelpers";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const mapLoadedRef = useRef(false);
  const blockNextMapClickRef = useRef(false);

  const userLocRef = useRef(null);
  const userMarkerRef = useRef(null);

  const tarbagataiWasVisibleBeforeRouteRef = useRef(false);

  const [mode, setMode] = useState("now");
  const [selectedEra, setSelectedEra] = useState(0);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [tourOn, setTourOn] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    setSlideIndex(0);
    setShowGallery(false);
  }, [selected?.name]);

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

  const isTarbagataiVisible = () => {
    const map = mapRef.current;
    if (!map) return false;
    const v = map.getLayoutProperty("tarbagatai-fill", "visibility");
    return v !== "none";
  };

  const hideTarbagatai = () => {
    const map = mapRef.current;
    if (!map) return;
    ["tarbagatai-fill", "tarbagatai-outline", "tarbagatai-glow"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
    });
  };

  const showTarbagataiAndFit = () => {
    const map = mapRef.current;
    if (!map) return;

    ["tarbagatai-fill", "tarbagatai-outline", "tarbagatai-glow"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "visible");
    });

    const coords = tarbagataiGeojson.features?.[0]?.geometry?.coordinates?.[0] || [];
    const bounds = getBoundsFromCoords(coords);
    if (bounds) map.fitBounds(bounds, { padding: 70, duration: 900 });
  };

  const hideZaysan = () => {
    const map = mapRef.current;
    if (!map) return;
    ["zaysan-fill", "zaysan-outline", "zaysan-glow"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
    });
  };

  const showZaysanAndFit = () => {
    const map = mapRef.current;
    if (!map) return;

    ["zaysan-fill", "zaysan-outline", "zaysan-glow"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "visible");
    });

    const coords = zaysanGeojson.features?.[0]?.geometry?.coordinates?.[0] || [];
    const bounds = getBoundsFromCoords(coords);
    if (bounds) map.fitBounds(bounds, { padding: 70, duration: 900 });
  };

  const ensureDrivingRouteLayer = () => {
    const map = mapRef.current;
    if (!map) return;

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

  const clearDrivingRoute = () => {
    const map = mapRef.current;
    if (!map) return;

    const src = map.getSource("driving-route");
    if (src) src.setData({ type: "FeatureCollection", features: [] });

    if (tarbagataiWasVisibleBeforeRouteRef.current) {
      showTarbagataiAndFit();
    }
  };

  const buildDrivingRoute = async (from, to) => {
    const map = mapRef.current;
    if (!map || !isLngLatOk(from) || !isLngLatOk(to)) return;

    ensureDrivingRouteLayer();

    tarbagataiWasVisibleBeforeRouteRef.current = isTarbagataiVisible();
    hideTarbagatai();
    hideZaysan();

    const src = map.getSource("driving-route");
    if (src) src.setData({ type: "FeatureCollection", features: [] });

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      alert("VITE_MAPBOX_TOKEN жоқ (.env тексер).");
      return;
    }

    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${from[0]},${from[1]};${to[0]},${to[1]}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${token}`;

    let res;
    try {
      res = await fetch(url);
    } catch (e) {
      console.error(e);
      alert("Интернет/желіні тексеріңіз (Directions API сұранысы өтпеді).");
      return;
    }

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

    map.getSource("driving-route").setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        },
      ],
    });

    const bounds = getBoundsFromCoords(route.geometry.coordinates);
    if (bounds) map.fitBounds(bounds, { padding: 80, duration: 900 });
  };

  const hasRouteOnMap = () => {
    const map = mapRef.current;
    if (!map) return false;
    const src = map.getSource("driving-route");
    if (!src) return false;
    const data = src._data;
    return Array.isArray(data?.features) && data.features.length > 0;
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
    });
  };

  const openPlace = (p, opts = {}) => {
    const map = mapRef.current;
    if (!map) return;

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
      type: "Тарихи нысан",
      name: p?.name || "Атауы жоқ",
      coords,
      short: p?.shortDescription || "Қысқаша ақпарат жоқ.",
      full: p?.fullDescription || "Толық ақпарат жоқ.",
      images: Array.isArray(p?.images) ? p.images : [],
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
    if (!map) return;

    clearDrivingRoute();
    hideTarbagatai();
    hideZaysan();
    setSelected(null);

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
        userLocRef.current = [lng, lat];

        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({ color: "#1b74e4" })
            .setLngLat([lng, lat])
            .addTo(map);
        } else {
          userMarkerRef.current.setLngLat([lng, lat]);
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
          setTimeout(() => (blockNextMapClickRef.current = false), 0);
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
          setTimeout(() => (blockNextMapClickRef.current = false), 0);
        });
      }

      ensureDrivingRouteLayer();

      if (mode === "history") drawHistoricalMarkers(filteredPlaces);
    });

    map.on("click", (e) => {
      if (blockNextMapClickRef.current) {
        blockNextMapClickRef.current = false;
        return;
      }

      if (mode !== "now") return;

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
      });
    });

    return () => map.remove();
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
    }

    if (mode === "history") {
      drawHistoricalMarkers(filteredPlaces);
    } else {
      clearMarkers();
    }
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
    hideTarbagatai();
    hideZaysan();
  };

  const routeExists = useMemo(() => {
    try {
      return hasRouteOnMap();
    } catch {
      return false;
    }
  }, [selected?.name, mode, selectedEra, query]);

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
          onClick={() => setMode("now")}
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
          onClick={() => setMode("history")}
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
          onClick={() => {
            clearDrivingRoute();
            hideTarbagatai();
            hideZaysan();
            setSelected(null);
            const map = mapRef.current;
            if (map) map.flyTo({ ...initialView, speed: 0.9, curve: 1.4, essential: true });
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
          ← Жалпы көрініс
        </button>

        <button
          onClick={() => {
            clearDrivingRoute();
          }}
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
              title="Кезекпен көрсету"
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
              const isTar = n === normalizeName("Тарбағатай тауы") || n === normalizeName("Тарбагатай тауы");
              const isZaysan = n === normalizeName("Зайсан көлі") || n === normalizeName("Зайсан коли");

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
                  title="Көрсету"
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
              <div style={{ padding: 12, opacity: 0.7, fontSize: 13 }}>Ештеңе табылмады.</div>
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
          <div style={{ textAlign: "center", marginTop: 6, fontWeight: 800 }}>{eras[selectedEra]}</div>
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
                    title="Google Maps навигация"
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
                    title="Координатты көшіру"
                  >
                    Көшіру
                  </button>

                  {!routeExists && (
                    <button
                      onClick={() => {
                        if (!userLocRef.current) {
                          alert("Алдымен GPS қос: оң жақтағы геолокация батырмасын бас (top-right).");
                          return;
                        }
                        buildDrivingRoute(userLocRef.current, selected.coords);
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        background: "#fff",
                        fontWeight: 800,
                      }}
                      title="GPS тұрған жерден автожолмен маршрут"
                    >
                      Маршрут (GPS)
                    </button>
                  )}

                  {routeExists && (
                    <button
                      onClick={() => clearDrivingRoute()}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        background: "#fff",
                        fontWeight: 800,
                      }}
                      title="Маршрутты өшіру"
                    >
                      Маршрутты өшіру
                    </button>
                  )}
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
              title="Жабу"
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
                    title="Суреттерді көрсету"
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
                        title="Алдыңғы"
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
                        title="Келесі"
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
                          title={`Сурет ${i + 1}`}
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
    </>
  );
}
