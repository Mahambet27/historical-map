import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../app/i18n.jsx";
import { getExhibitionText } from "../../i18n/exhibitionText.js";
import {
  initialTimelineState,
  timelineStates,
} from "../../data/exhibition/timeline.js";
import { getEraById, historicalEras } from "../../data/exhibition/eras.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { getGeometriesAtYear } from "../../data/exhibition/entityGeometries.js";
import { historicalSources } from "../../data/exhibition/sources.js";
import { AGENT_ACTIONS } from "../agent/agentTypes.js";
import ExhibitionHero from "./ExhibitionHero.jsx";
import ExhibitionControls from "./ExhibitionControls.jsx";
import ExhibitionTimeline from "./ExhibitionTimeline.jsx";
import ExhibitionEraSelector from "./ExhibitionEraSelector.jsx";
import ExhibitionYearSlider from "./ExhibitionYearSlider.jsx";
import ExhibitionStoryPanel from "./ExhibitionStoryPanel.jsx";
import ExhibitionEntityPanel from "./ExhibitionEntityPanel.jsx";
import ExhibitionSourcePanel from "./ExhibitionSourcePanel.jsx";
import ExhibitionComparePanel from "./ExhibitionComparePanel.jsx";
import ExhibitionLessonPanel from "./ExhibitionLessonPanel.jsx";
import ExhibitionAccessibility from "./ExhibitionAccessibility.jsx";
import {
  EXHIBITION_RESET_MS,
  EXHIBITION_WARNING_MS,
  TOUR_STEP_MS,
  getKioskEnabled,
} from "./exhibitionScenario.js";
import { resolveEraSelection, resolveYearSelection } from "./historicalYearModel.js";
import { CLOSED_PANEL, closePanel, openPanel, setPanelMode } from "./panelState.js";
import {
  detectExhibitionQuality,
  readStoredQualityMode,
  storeQualityMode,
} from "./qualityMode.js";
import { getExhibitionShortcut } from "./keyboardShortcuts.js";
import {
  paletteToCssVariables,
  readStoredMapStyle,
  resolveMapPalette,
  storeMapStyle,
} from "./theme/mapPalettes.js";

const ExhibitionMap = lazy(() => import("./ExhibitionMap.jsx"));
const HistoricalAgent = lazy(() => import("../agent/HistoricalAgent.jsx"));
const ExhibitionThreeD = lazy(() => import("./ExhibitionThreeD.jsx"));

const entityById = new Map(allHistoricalEntities.map((entity) => [entity.id, entity]));

const getPrimaryEntity = (snapshot, year) => {
  const activeIds = new Set(getGeometriesAtYear(year).map((item) => item.entityId));
  const snapshotEntity = snapshot?.entityIds?.find((id) => activeIds.has(id));
  return entityById.get(snapshotEntity || [...activeIds][0]) || null;
};

export default function ExhibitionPage() {
  const { language, setLanguage } = useI18n();
  const text = getExhibitionText(language);
  const [started, setStarted] = useState(false);
  const [selectedYear, setSelectedYear] = useState(1465);
  const [selectedEraId, setSelectedEraId] = useState("kazakh-khanate");
  const [activeSnapshot, setActiveSnapshot] = useState(initialTimelineState);
  const [tour, setTour] = useState({ active: false, index: 2, playing: false });
  const [speed, setSpeed] = useState(1);
  const [panel, setPanel] = useState(CLOSED_PANEL);
  const [selectedEntity, setSelectedEntity] = useState(() =>
    getPrimaryEntity(initialTimelineState, 1465)
  );
  const [comparison, setComparison] = useState(null);
  const [settings, setSettings] = useState({ scale: 1, contrast: false, simple: false });
  const [mapStyleMode, setMapStyleMode] = useState(readStoredMapStyle);
  const [qualityMode, setQualityMode] = useState(readStoredQualityMode);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const warningTimer = useRef(null);
  const resetTimer = useRef(null);
  const kiosk = getKioskEnabled();
  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const effectiveQuality = detectExhibitionQuality({
    requested: qualityMode,
    reducedMotion,
  });
  const palette = useMemo(
    () => resolveMapPalette({ mode: mapStyleMode, eraId: selectedEraId, year: selectedYear }),
    [mapStyleMode, selectedEraId, selectedYear]
  );
  const showPanel = useCallback((type, mode = "expanded") => {
    setPanel(openPanel(type, mode));
  }, []);
  const hidePanel = useCallback(() => setPanel(closePanel()), []);

  const handleYearChange = useCallback((year) => {
    const selection = resolveYearSelection(year);
    const { selectedYear: exactYear, selectedEraId: eraId, activeSnapshot: snapshot } = selection;
    setSelectedYear(exactYear);
    setActiveSnapshot(snapshot);
    setSelectedEraId(eraId);
    setSelectedEntity(getPrimaryEntity(snapshot, exactYear));
    const tourIndex = timelineStates.findIndex((item) => item.id === snapshot.id);
    setTour((current) => ({ ...current, index: Math.max(0, tourIndex) }));
  }, []);

  const handleEraChange = useCallback((eraId) => {
    const selection = resolveEraSelection(eraId);
    if (!selection) return;
    const { selectedYear: defaultYear, selectedEraId: nextEraId, activeSnapshot: snapshot } = selection;
    setSelectedEraId(nextEraId);
    setSelectedYear(defaultYear);
    setActiveSnapshot(snapshot);
    setSelectedEntity(getPrimaryEntity(snapshot, defaultYear));
    const tourIndex = timelineStates.findIndex((item) => item.id === snapshot.id);
    setTour((current) => ({ ...current, index: Math.max(0, tourIndex) }));
  }, []);

  const selectEntity = useCallback((entityId, openPanel = true) => {
    const entity = entityById.get(entityId) || null;
    setSelectedEntity(entity);
    if (entity && openPanel) showPanel("entity");
  }, [showPanel]);

  const reset = useCallback(() => {
    setStarted(false);
    setSelectedYear(1465);
    setSelectedEraId("kazakh-khanate");
    setActiveSnapshot(initialTimelineState);
    setSelectedEntity(getPrimaryEntity(initialTimelineState, 1465));
    setTour({ active: false, index: 2, playing: false });
    setPanel(closePanel());
    setComparison(null);
    setInactivityWarning(false);
    setLanguage("ru");
  }, [setLanguage]);

  useEffect(() => {
    storeMapStyle(mapStyleMode);
  }, [mapStyleMode]);

  useEffect(() => {
    storeQualityMode(qualityMode);
  }, [qualityMode]);

  useEffect(() => {
    const handleVisibility = () => {
      const visible = !document.hidden;
      setPageVisible(visible);
      if (!visible) setTour((current) => ({ ...current, playing: false }));
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!started) return undefined;
    const handleShortcut = (event) => {
      const action = getExhibitionShortcut(event);
      if (!action) return;
      event.preventDefault();
      if (action === "toggle-play") {
        setTour((current) => ({ ...current, playing: !current.playing }));
      } else if (action === "previous-year") {
        handleYearChange(Math.max(-3000, selectedYear - 1));
      } else if (action === "next-year") {
        handleYearChange(Math.min(2026, selectedYear + 1));
      } else if (action === "lesson") {
        showPanel("lesson");
      } else if (action === "agent") {
        showPanel("agent");
      } else if (action === "compare") {
        setComparison({ firstYear: 1465, secondYear: 1511 });
        showPanel("compare");
      } else if (action === "close-panel") {
        hidePanel();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [started, selectedYear, handleYearChange, showPanel, hidePanel]);

  useEffect(() => {
    if (!tour.playing || !started) return undefined;
    const timer = window.setTimeout(() => {
      const nextIndex = tour.index + 1;
      if (nextIndex >= timelineStates.length) {
        setTour((current) => ({ ...current, playing: false }));
        return;
      }
      handleYearChange(timelineStates[nextIndex].year);
    }, TOUR_STEP_MS / speed);
    return () => window.clearTimeout(timer);
  }, [tour.playing, tour.index, started, speed, handleYearChange]);

  useEffect(() => {
    if (!kiosk || !started) return undefined;
    const armTimers = () => {
      window.clearTimeout(warningTimer.current);
      window.clearTimeout(resetTimer.current);
      setInactivityWarning(false);
      warningTimer.current = window.setTimeout(
        () => setInactivityWarning(true),
        EXHIBITION_WARNING_MS
      );
      resetTimer.current = window.setTimeout(reset, EXHIBITION_RESET_MS);
    };
    const events = ["pointerdown", "pointermove", "keydown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, armTimers, { passive: true }));
    armTimers();
    return () => {
      events.forEach((event) => window.removeEventListener(event, armTimers));
      window.clearTimeout(warningTimer.current);
      window.clearTimeout(resetTimer.current);
    };
  }, [kiosk, started, reset]);

  const startTour = () => {
    setStarted(true);
    hidePanel();
    handleYearChange(timelineStates[0].year);
    setTour({ active: true, index: 0, playing: true });
  };

  const sourcesForCurrent = historicalSources.filter((source) =>
    activeSnapshot.sourceIds.includes(source.id)
  );
  const activeEra = getEraById(selectedEraId);

  const handleAgentAction = (action) => {
    switch (action.type) {
      case AGENT_ACTIONS.SET_YEAR:
        handleYearChange(action.payload.year);
        break;
      case AGENT_ACTIONS.COMPARE:
        setComparison(action.payload);
        showPanel("compare");
        break;
      case AGENT_ACTIONS.SELECT_ENTITY:
        selectEntity(action.payload.entityId);
        break;
      case AGENT_ACTIONS.SHOW_SOURCES:
        showPanel("sources");
        break;
      case AGENT_ACTIONS.START_LESSON:
        showPanel("lesson");
        break;
      case AGENT_ACTIONS.RESET:
        reset();
        break;
      default:
        break;
    }
  };

  if (!started) {
    return (
      <ExhibitionHero
        {...{ language, setLanguage, text }}
        onStart={startTour}
        onExplore={() => setStarted(true)}
      />
    );
  }

  const displayedSnapshot = {
    ...activeSnapshot,
    year: selectedYear,
    description: settings.simple
      ? activeSnapshot.simpleDescription || activeSnapshot.description
      : activeSnapshot.description,
  };

  return (
    <main
      className={`exhibition ${
        settings.contrast || mapStyleMode === "high-contrast" ? "is-contrast" : ""
      } ${pageVisible ? "" : "is-hidden"}`}
      style={{ "--ex-scale": settings.scale, ...paletteToCssVariables(palette) }}
      data-theme={palette.id}
      data-quality={effectiveQuality}
    >
      <ExhibitionControls
        {...{ text, language, setLanguage }}
        onHome={reset}
        onAgent={() => showPanel("agent")}
        onSources={() => showPanel("sources")}
        onCompare={() => {
          setComparison({ firstYear: 1465, secondYear: 1511 });
          showPanel("compare");
        }}
        onLesson={() => showPanel("lesson")}
        onThreeD={() => showPanel("3d")}
        onAccess={() => showPanel("access")}
      />
      <section className="ex-stage">
        <Suspense fallback={<div className="ex-map-loading"><i />{text.mapLabel}</div>}>
          <ExhibitionMap
            {...{
              selectedYear,
              activeSnapshot,
              activeEra,
              language,
              text,
              comparison,
              reducedMotion,
              palette,
              effectiveQuality,
            }}
            selectedEntityId={selectedEntity?.id || null}
            onSelectEntity={selectEntity}
          />
        </Suspense>
        <div className="ex-stage__wash" />
        <ExhibitionStoryPanel
          state={displayedSnapshot}
          {...{ language, text, tour }}
          onPrevious={() =>
            handleYearChange(timelineStates[Math.max(0, tour.index - 1)].year)
          }
          onNext={() => {
            if (tour.index >= timelineStates.length - 1) {
              setTour({ active: false, index: tour.index, playing: false });
            } else {
              handleYearChange(timelineStates[tour.index + 1].year);
            }
          }}
          onReplay={() => handleYearChange(selectedYear)}
          onExit={() =>
            setTour((current) => ({ ...current, active: false, playing: false }))
          }
          onEntity={() => selectedEntity && showPanel("entity")}
          onSources={() => showPanel("sources")}
        />
        <div className="ex-disclaimer ex-disclaimer--map">ⓘ {text.disclaimer}</div>
      </section>

      <div className="ex-time-dock">
        <ExhibitionEraSelector
          eras={historicalEras}
          {...{ selectedEraId, language, text }}
          onSelect={handleEraChange}
        />
        <ExhibitionYearSlider
          {...{ selectedYear, language, text }}
          onChange={handleYearChange}
        />
        <ExhibitionTimeline
          {...{ text, speed }}
          playing={tour.playing}
          onTogglePlay={() =>
            setTour((current) => ({ ...current, playing: !current.playing }))
          }
          onSpeed={setSpeed}
        />
      </div>

      {panel.type && (
        <div
          className={`ex-panel-backdrop ex-panel-backdrop--${panel.mode}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) hidePanel();
          }}
        >
          <div className="ex-panel-mode-switch" aria-label="Panel size">
            <button
              type="button"
              className={panel.mode === "compact" ? "is-active" : ""}
              onClick={() => setPanel(setPanelMode(panel, "compact"))}
              aria-label="Compact panel"
            >▱</button>
            <button
              type="button"
              className={panel.mode === "expanded" ? "is-active" : ""}
              onClick={() => setPanel(setPanelMode(panel, "expanded"))}
              aria-label="Expanded panel"
            >□</button>
          </div>
          {panel.type === "entity" && (
            <ExhibitionEntityPanel
              entity={selectedEntity}
              {...{ language, text }}
              onClose={hidePanel}
              onCompare={() => {
                setComparison({ firstYear: 1465, secondYear: 1511 });
                showPanel("compare");
              }}
              onLesson={() => showPanel("lesson")}
              onSources={() => showPanel("sources")}
            />
          )}
          {panel.type === "sources" && (
            <ExhibitionSourcePanel
              sources={sourcesForCurrent.length ? sourcesForCurrent : historicalSources}
              {...{ language, text }}
              onClose={hidePanel}
            />
          )}
          {panel.type === "compare" && (
            <ExhibitionComparePanel
              comparison={comparison || { firstYear: 1465, secondYear: 1511 }}
              {...{ language, text }}
              onChange={setComparison}
              onClose={() => {
                hidePanel();
                setComparison(null);
              }}
            />
          )}
          {panel.type === "lesson" && (
            <ExhibitionLessonPanel
              {...{ language, text }}
              onClose={hidePanel}
              onState={(id) => {
                const target = timelineStates.find((item) => item.id === id);
                if (target) handleYearChange(target.year);
              }}
            />
          )}
          {panel.type === "access" && (
            <ExhibitionAccessibility
              {...{ language, text, settings }}
              onChange={setSettings}
              onClose={hidePanel}
              {...{ mapStyleMode, qualityMode, effectiveQuality }}
              onMapStyleMode={setMapStyleMode}
              onQualityMode={setQualityMode}
            />
          )}
          {panel.type === "agent" && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <HistoricalAgent
                {...{ language, text }}
                onAction={handleAgentAction}
                onClose={hidePanel}
              />
            </Suspense>
          )}
          {panel.type === "3d" && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <ExhibitionThreeD
                {...{ language, text, effectiveQuality }}
                onClose={hidePanel}
              />
            </Suspense>
          )}
        </div>
      )}
      {inactivityWarning && (
        <div className="ex-toast" role="status">
          <span>◷</span><p>{text.inactivityWarning}</p>
          <button onClick={() => setInactivityWarning(false)}>{text.continue}</button>
        </div>
      )}
      <div className="sr-only" aria-live="polite">
        {selectedYear}: {activeSnapshot.title[language] || activeSnapshot.title.ru}
      </div>
    </main>
  );
}
