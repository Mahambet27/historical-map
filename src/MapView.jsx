import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// ✅ JSON (ТОЛЬКО settlements + places)
import settlements from "./data/settlements.json";
import places from "./data/places.json"; // ⚠️ у тебя это массив, НЕ FeatureCollection

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const markersRef = useRef([]);
  const mapLoadedRef = useRef(false);

  const [mode, setMode] = useState("now"); // "now" | "history"
  const [selectedEra, setSelectedEra] = useState(0);
  const [selected, setSelected] = useState(null);

  // ✅ (3) список + поиск
  const [query, setQuery] = useState("");

  // ✅ (5) экскурсия/маршрут
  const [tourOn, setTourOn] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  // ✅ (Gallery) слайдер + кнопка показа
  const [slideIndex, setSlideIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  // ✅ сброс галереи при выборе другого объекта
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

  // ---------- helpers ----------
  const normalizeName = (s) => {
    if (!s) return "";
    return String(s)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replaceAll("ә", "а")
      .replaceAll("қ", "к")
      .replaceAll("ң", "н")
      .replaceAll("ғ", "г")
      .replaceAll("ө", "о")
      .replaceAll("ү", "у")
      .replaceAll("ұ", "у")
      .replaceAll("һ", "х")
      .replaceAll("і", "и");
  };

  const isLngLatOk = (coords) =>
    Array.isArray(coords) &&
    coords.length >= 2 &&
    Number.isFinite(coords[0]) &&
    Number.isFinite(coords[1]) &&
    Math.abs(coords[0]) <= 180 &&
    Math.abs(coords[1]) <= 90;

  // ---------- быстрый поиск (аулы) ----------
  const settlementsByName = useMemo(() => {
    const m = new Map();
    (settlements?.features || []).forEach((f) => {
      const props = f?.properties || {};
      const main = props.name;

      const keys = [];
      if (main) keys.push(main);

      // ✅ если добавишь: "altNames": ["Aqjar", "Akzhar", ...]
      if (Array.isArray(props.altNames)) keys.push(...props.altNames);

      keys.forEach((k) => {
        const nk = normalizeName(k);
        if (nk) m.set(nk, f);
      });
    });
    return m;
  }, []);

  // ✅ (3) список объектов эпохи + фильтр по поиску
  const eraPlaces = useMemo(() => {
    const list = (Array.isArray(places) ? places : [])
      .filter((p) => Number(p?.era) === Number(selectedEra))
      .filter((p) => isLngLatOk(p?.coords));
    return list;
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

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  };

  // ✅ (3) единая функция открытия исторического объекта (и для маркера, и для списка, и для экскурсии)
  const openPlace = (p, opts = {}) => {
    const map = mapRef.current;
    if (!map) return;

    const coords = p?.coords;
    if (!isLngLatOk(coords)) return;

    map.flyTo({
      center: coords,
      zoom: opts.zoom ?? 13.8,
      pitch: opts.pitch ?? 75,
      bearing: opts.bearing ?? 30,
      speed: opts.speed ?? 0.75,
      curve: opts.curve ?? 1.5,
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

  // ✅ ИСТОРИЯ: places.json = массив объектов [{id,name,coords,era,...}]
  // ✅ (3) теперь рисуем по списку (filteredPlaces), чтобы поиск фильтровал и маркеры
  const drawHistoricalMarkers = (list) => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    clearMarkers();

    (Array.isArray(list) ? list : []).forEach((p) => {
      const coords = p?.coords;

      // coords должны быть [lng, lat]
      if (!isLngLatOk(coords)) return;

      const marker = new mapboxgl.Marker({ color: "#d11" })
        .setLngLat(coords)
        .addTo(map);

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
    map.flyTo({ ...initialView, speed: 0.9, curve: 1.4 });
    setSelected(null);
  };

  // ===== INIT MAP only once =====
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

      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.terrain-rgb",
          tileSize: 512,
          maxzoom: 14,
        });
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.35 });
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

      if (mode === "history") drawHistoricalMarkers(filteredPlaces);
    });

    // ✅ клик по подписи — only now (ТОЛЬКО settlements)
    map.on("click", (e) => {
      if (mode !== "now") return;

      const box = [
        [e.point.x - 6, e.point.y - 6],
        [e.point.x + 6, e.point.y + 6],
      ];

      const features = map.queryRenderedFeatures(box);
      if (!features || features.length === 0) return;

      const placeFeature =
        features.find(
          (f) => f.layer?.id?.includes("place-label") && f.properties?.name
        ) || features.find((f) => f.properties?.name);

      if (!placeFeature) return;

      const clickedNameRaw = placeFeature.properties?.name;
      if (!clickedNameRaw) return;

      const clickedName = String(clickedNameRaw).trim();
      const key = normalizeName(clickedName);

      const settlement = settlementsByName.get(key);
      if (!settlement) return;

      const coords = settlement?.geometry?.coordinates;
      if (!isLngLatOk(coords)) {
        console.warn(
          "Проверь координаты в settlements.json, должно быть [lng, lat]:",
          settlement
        );
        return;
      }

      map.flyTo({
        center: coords,
        zoom: 12.3,
        pitch: 65,
        bearing: 20,
        speed: 0.85,
        curve: 1.4,
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
  }, []); // 👈 ВАЖНО

  // ===== when mode changes =====
  useEffect(() => {
    if (!mapLoadedRef.current) return;

    setSelected(null);

    // ✅ (5) выключаем экскурсию при выходе из history
    if (mode !== "history") {
      setTourOn(false);
      setTourIndex(0);
    }

    if (mode === "history") {
      drawHistoricalMarkers(filteredPlaces);
    } else {
      clearMarkers();
    }
  }, [mode]);

  // ===== when era changes =====
  useEffect(() => {
    if (!mapLoadedRef.current) return;
    if (mode !== "history") return;

    // ✅ (3) смена эпохи: обновляем маркеры (и логично сбросить тур)
    setTourOn(false);
    setTourIndex(0);
    drawHistoricalMarkers(filteredPlaces);
  }, [selectedEra]);

  // ✅ (3) при поиске обновляем маркеры в history
  useEffect(() => {
    if (!mapLoadedRef.current) return;
    if (mode !== "history") return;
    drawHistoricalMarkers(filteredPlaces);
  }, [filteredPlaces, mode]);

  // ✅ (5) чтобы экскурсия не ломалась при фильтре/поиске
  useEffect(() => {
    if (!tourOn) return;
    if (filteredPlaces.length === 0) {
      setTourOn(false);
      return;
    }
    if (tourIndex > filteredPlaces.length - 1) setTourIndex(0);
  }, [filteredPlaces, tourOn, tourIndex]);

  return (
    <>
      <div ref={mapContainerRef} style={{ width: "100vw", height: "100vh" }} />

      {/* Верхняя панель — НЕ менял (только добавил кнопки экскурсии) */}
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

        {/* ✅ (5) Экскурсия/Маршрут */}
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

      {/* ✅ (3) Левая панель: поиск + список объектов (только history) */}
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

            {/* маленький индикатор экскурсии */}
            {tourOn && filteredPlaces.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                Экскурсия: <b>{tourIndex + 1}</b> / {filteredPlaces.length}
              </div>
            )}
          </div>

          <div style={{ overflowY: "auto" }}>
            {filteredPlaces.map((p, idx) => (
              <div
                key={p.id ?? `${p.name}-${idx}`}
                onClick={() => {
                  if (tourOn) setTourIndex(idx);
                  openPlace(p);
                }}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  background:
                    tourOn && idx === tourIndex ? "rgba(0,0,0,0.06)" : "transparent",
                }}
                title="Көрсету"
              >
                <div style={{ fontWeight: 900 }}>{p.name || "Атауы жоқ"}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 3 }}>
                  {p.shortDescription
                    ? p.shortDescription.slice(0, 90)
                    : "Қысқаша ақпарат жоқ."}
                  {p.shortDescription && p.shortDescription.length > 90 ? "…" : ""}
                </div>
              </div>
            ))}

            {filteredPlaces.length === 0 && (
              <div style={{ padding: 12, opacity: 0.7, fontSize: 13 }}>
                Ештеңе табылмады.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ползунок эпох — НЕ менял */}
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

      {/* Панель — НЕ менял, только добавил (9) навигацию и копирование + (Gallery) кнопку и слайдер */}
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
                Коорд: {selected.coords[1].toFixed(5)}, {selected.coords[0].toFixed(5)}
              </div>

              {/* ✅ (9) Навигация до точки + копирование */}
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
                </div>
              )}
            </div>

            <button
              onClick={() => setSelected(null)}
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

          <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.4 }}>
            {selected.short}
          </div>

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

              {/* ✅ КНОПКА после текста (как ты просил) */}
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

              {/* ✅ Галерея-слайдер (показывается только по кнопке) */}
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
                          setSlideIndex(
                            (i) => (i - 1 + selected.images.length) % selected.images.length
                          )
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
                        onClick={() =>
                          setSlideIndex((i) => (i + 1) % selected.images.length)
                        }
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 6,
                        marginTop: 10,
                      }}
                    >
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
