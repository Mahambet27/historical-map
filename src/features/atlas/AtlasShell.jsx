import { useCallback, useEffect, useRef, useState } from "react";
import AtlasHeader from "./components/AtlasHeader.jsx";
import AtlasSidebar from "./components/AtlasSidebar.jsx";
import AtlasCanvas from "./components/AtlasCanvas.jsx";
import AtlasTimeline from "./components/AtlasTimeline.jsx";
import AtlasObjectCard from "./components/AtlasObjectCard.jsx";
import AtlasMobileToolbar from "./components/AtlasMobileToolbar.jsx";
import AtlasIcon from "./components/AtlasIcon.jsx";
import {
  atlasCategories,
  atlasDemoObjects,
  atlasEraAtYear,
  atlasLayers,
  filterAtlasObjects,
} from "./data/atlasDemoData.js";
import { atlasText } from "./data/atlasText.js";

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
  const [year, setYear] = useState(1465);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState(() =>
    atlasCategories.map((category) => category.id)
  );
  const [layers, setLayers] = useState(() =>
    Object.fromEntries(atlasLayers.map((layer) => [layer.id, layer.on]))
  );
  const [selectedId, setSelectedId] = useState("otrar");
  const [cardOpen, setCardOpen] = useState(true);
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
  const era = atlasEraAtYear(year);
  const objects = filterAtlasObjects(query, categories);
  const selected = objects.find((object) => object.id === selectedId);

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
    setCategories(atlasCategories.map((category) => category.id));
  };
  const select = (id) => {
    setSelectedId(id);
    setCardOpen(true);
    setSidebarOpen(false);
    setLayers((current) => ({ ...current, settlements: true }));
  };
  const closeCard = () => {
    setCardOpen(false);
    document.getElementById(`atlas-marker-${selectedId}`)?.focus();
  };
  const sidebarProps = {
    currentEra: era,
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
          <AtlasCanvas
            objects={objects}
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
          if (!selected && atlasDemoObjects[0]) {
            resetFilters();
            select(atlasDemoObjects[0].id);
          } else setCardOpen(true);
        }}
        hasObject={Boolean(selected || atlasDemoObjects.length)}
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
