import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AtlasHeader from "./components/AtlasHeader.jsx";
import AtlasSidebar from "./components/AtlasSidebar.jsx";
import AtlasCanvas from "./components/AtlasCanvas.jsx";
import AtlasTimeline from "./components/AtlasTimeline.jsx";
import AtlasObjectCard from "./components/AtlasObjectCard.jsx";
import AtlasMobileToolbar from "./components/AtlasMobileToolbar.jsx";
import AtlasIcon from "./components/AtlasIcon.jsx";
import { atlasLayers } from "./data/atlasDemoData.js";
import { atlasEras, buildAtlasHistoricalSnapshot } from "./data/atlasHistoricalData.js";
import {
  adaptAtlasSnapshot,
  filterAtlasObjects,
  atlasObjectsToGeoJSON,
} from "./data/atlasSnapshotAdapter.js";
import { atlasText } from "./data/atlasText.js";
import { atlasHistoricalGeometry, atlasTerritoryCards } from "./data/atlasHistoricalGeometry.js";
import { atlasHistoricalOverlays, atlasOverlayCards } from "./data/atlasHistoricalOverlays.js";
import { atlasYearFromSearch, atlasSearchForYear } from "./data/atlasLocation.js";

function useAtlasModal(ref, open, onClose) {
  useEffect(() => {
    if (!open || !ref.current) return undefined;
    const previous = document.activeElement;
    const element = ref.current;
    const focusable = () => [
      ...element.querySelectorAll("button:not(:disabled), input:not(:disabled), [tabindex='0']"),
    ];
    focusable()[0]?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const targets = focusable();
        const first = targets[0];
        const last = targets.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    element.addEventListener("keydown", handleKey);
    return () => {
      element.removeEventListener("keydown", handleKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, ref, onClose]);
}

export default function AtlasShell() {
  const [language, setLanguage] = useState("ru");
  const [year, setYear] = useState(() => atlasYearFromSearch(window.location.search));
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [layers, setLayers] = useState(() =>
    Object.fromEntries(atlasLayers.map((layer) => [layer.id, layer.on]))
  );
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const aboutRef = useRef(null);
  const drawerRef = useRef(null);
  const closeAbout = useCallback(() => setAboutOpen(false), []);
  const closeDrawer = useCallback(() => setSidebarOpen(false), []);
  useAtlasModal(aboutRef, aboutOpen, closeAbout);
  useAtlasModal(drawerRef, sidebarOpen, closeDrawer);
  const text = atlasText[language];
  const snapshot = useMemo(() => buildAtlasHistoricalSnapshot(year), [year]);
  const view = useMemo(() => adaptAtlasSnapshot(snapshot), [snapshot]);
  const historical = useMemo(() => ({
    ...atlasHistoricalGeometry(snapshot), ...atlasHistoricalOverlays(snapshot),
  }), [snapshot]);
  const overlayCards = useMemo(() => atlasOverlayCards(snapshot, historical), [snapshot, historical]);
  const territoryCards = useMemo(
    () => atlasTerritoryCards(snapshot, historical.territories),
    [snapshot, historical]
  );
  const { era } = view;
  const objects = useMemo(
    () => filterAtlasObjects(view.objects, query, categories),
    [view, query, categories]
  );
  if (selectedId && !view.objects.some((object) => object.id === selectedId)) {
    setSelectedId(null);
    setCardOpen(false);
  }
  if (selectedEntityId && !territoryCards.some((object) => object.entityId === selectedEntityId)) {
    setSelectedEntityId(null);
    setCardOpen(false);
  }
  if (selectedOverlayId && !overlayCards.some((object) => object.id === selectedOverlayId)) {
    setSelectedOverlayId(null);
    setCardOpen(false);
  }
  const selected = selectedOverlayId ? overlayCards.find((object) => object.id === selectedOverlayId) : selectedEntityId
    ? territoryCards.find((object) => object.entityId === selectedEntityId)
    : objects.find((object) => object.id === selectedId);
  const geojson = useMemo(
    () => atlasObjectsToGeoJSON(layers.settlements ? objects : [], language, selectedId),
    [objects, layers.settlements, language, selectedId]
  );

  useEffect(() => {
    const onLocation = () => {
      setYear(atlasYearFromSearch(window.location.search));
      setPlaying(false);
    };
    window.addEventListener("popstate", onLocation);
    return () => window.removeEventListener("popstate", onLocation);
  }, []);
  useEffect(() => {
    const search = atlasSearchForYear(window.location.search, year);
    if (search !== window.location.search)
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}${window.location.hash}`);
  }, [year]);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Qazaq Historical Atlas · Prototype";
    return () => {
      document.title = previousTitle;
    };
  }, []);
  useEffect(() => {
    if (!playing || year === 2026) return undefined;
    const timer = window.setInterval(
      () =>
        setYear((value) => {
          const next = Math.min(2026, value + 25);
          return next === 0 ? 1 : next;
        }),
      900
    );
    return () => window.clearInterval(timer);
  }, [playing, year]);

  const chooseYear = (value) => {
    setYear(value === 0 ? (year < 0 ? 1 : -1) : value);
    setPlaying(false);
  };
  const resetFilters = () => {
    setQuery("");
    setCategories([]);
  };
  const select = (id) => {
    setSelectedOverlayId(null);
    setSelectedEntityId(null);
    setSelectedId(id);
    setCardOpen(true);
    setSidebarOpen(false);
    setLayers((current) => ({ ...current, settlements: true }));
  };
  const selectEntity = (id) => {
    if (!territoryCards.some((object) => object.entityId === id)) return;
    setSelectedId(null);
    setSelectedOverlayId(null);
    setSelectedEntityId(id);
    setCardOpen(true);
    setSidebarOpen(false);
  };
  const selectOverlay = (id) => {
    if (!overlayCards.some((object) => object.id === id)) return;
    setSelectedId(null);
    setSelectedEntityId(null);
    setSelectedOverlayId(id);
    setCardOpen(true);
    setSidebarOpen(false);
  };
  const closeCard = () => {
    setCardOpen(false);
    (
      document.getElementById(`atlas-marker-${selectedId}`) ||
      document.querySelector(".atlas-maplibre-container canvas")
    )?.focus();
  };
  const sidebarProps = {
    currentEra: era,
    atlasEras,
    atlasCategories: view.categories,
    onEra: chooseYear,
    categories,
    onCategory: (id) =>
      setCategories((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      ),
    onReset: resetFilters,
    language,
    text,
    layers,
    historical,
    onToggle: (id) => setLayers((current) => ({ ...current, [id]: !current[id] })),
    onClose: closeDrawer,
  };
  return (
    <div className="atlas-root" lang={language}>
      <a className="atlas-skip" href="#atlas-map">
        {text.skip}
      </a>
      <AtlasHeader
        language={language}
        onLanguage={setLanguage}
        text={text}
        onAbout={() => setAboutOpen(true)}
        query={query}
        onQuery={setQuery}
        results={objects}
        onSelect={select}
      />
      <div className="atlas-workspace">
        <div className="atlas-desktop-sidebar">
          <AtlasSidebar {...sidebarProps} />
        </div>
        <main className={`atlas-main ${selected && cardOpen ? "atlas-main-with-card" : ""}`}>
          <div className="atlas-object-count" role="status">
            {text.objects}: {objects.length}
          </div>
          <AtlasCanvas
            objects={objects}
            geojson={geojson}
            historical={historical}
            onSelectEntity={selectEntity}
            onSelectOverlay={selectOverlay}
            selectedId={selectedId}
            onSelect={select}
            layers={layers}
            year={year}
            era={era}
            language={language}
            text={text}
            onResetFilters={resetFilters}
          />
          {selected && cardOpen && (
            <AtlasObjectCard
              key={selected.id}
              object={selected}
              onClose={closeCard}
              language={language}
              text={text}
            />
          )}
          <button
            className="atlas-tablet-filters atlas-icon-button"
            onClick={() => setSidebarOpen(true)}
            aria-label={text.filters}
            aria-expanded={sidebarOpen}
          >
            <AtlasIcon name="layers" />
          </button>
        </main>
      </div>
      <AtlasTimeline
        year={year}
        onYear={chooseYear}
        era={era}
        language={language}
        text={text}
        playing={playing && year < 2026}
        onPlay={() => {
          if (year === 2026) {
            setYear(-3000);
            setPlaying(true);
          } else setPlaying((value) => !value);
        }}
      />
      <AtlasMobileToolbar
        text={text}
        sidebarOpen={sidebarOpen}
        onFilters={() => {
          setCardOpen(false);
          setSidebarOpen(true);
        }}
        onMap={() => {
          setCardOpen(false);
          setSidebarOpen(false);
        }}
        onObject={() => {
          if (!selected && view.objects[0]) {
            resetFilters();
            select(view.objects[0].id);
          } else setCardOpen(true);
        }}
        hasObject={Boolean(selected || view.objects.length)}
      />
      {sidebarOpen && (
        <div className="atlas-modal-backdrop" onClick={closeDrawer}>
          <div
            className="atlas-drawer"
            id="atlas-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label={text.sidebar}
            ref={drawerRef}
            onClick={(event) => event.stopPropagation()}
          >
            <AtlasSidebar {...sidebarProps} />
          </div>
        </div>
      )}
      {aboutOpen && (
        <div className="atlas-modal-backdrop atlas-about-backdrop" onClick={closeAbout}>
          <section
            className="atlas-about-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="atlas-about-title"
            ref={aboutRef}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="atlas-icon-button" aria-label={text.close} onClick={closeAbout}>
              <AtlasIcon name="close" />
            </button>
            <span className="atlas-monogram" aria-hidden="true">
              Q
            </span>
            <p className="atlas-eyebrow">{text.prototype}</p>
            <h2 id="atlas-about-title">{text.aboutTitle}</h2>
            <p>{text.aboutBody}</p>
            <p>{text.aboutNext}</p>
            <button className="atlas-primary-button" onClick={closeAbout}>
              {text.start}
              <AtlasIcon name="arrow" />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
