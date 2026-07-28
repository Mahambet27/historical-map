import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../../app/i18n.jsx";
import { getExhibitionText } from "../../i18n/exhibitionText.js";
import { timelineStates, getTimelineStateAtYear, initialTimelineState } from "../../data/exhibition/timeline.js";
import { historicalEntities } from "../../data/exhibition/entities.js";
import { historicalSources } from "../../data/exhibition/sources.js";
import { AGENT_ACTIONS } from "../agent/agentTypes.js";
import ExhibitionHero from "./ExhibitionHero.jsx";
import ExhibitionControls from "./ExhibitionControls.jsx";
import ExhibitionTimeline from "./ExhibitionTimeline.jsx";
import ExhibitionStoryPanel from "./ExhibitionStoryPanel.jsx";
import ExhibitionEntityPanel from "./ExhibitionEntityPanel.jsx";
import ExhibitionSourcePanel from "./ExhibitionSourcePanel.jsx";
import ExhibitionComparePanel from "./ExhibitionComparePanel.jsx";
import ExhibitionLessonPanel from "./ExhibitionLessonPanel.jsx";
import ExhibitionAccessibility from "./ExhibitionAccessibility.jsx";
import { EXHIBITION_RESET_MS, EXHIBITION_WARNING_MS, TOUR_STEP_MS, getKioskEnabled } from "./exhibitionScenario.js";

const ExhibitionMap = lazy(() => import("./ExhibitionMap.jsx"));
const HistoricalAgent = lazy(() => import("../agent/HistoricalAgent.jsx"));
const ExhibitionThreeD = lazy(() => import("./ExhibitionThreeD.jsx"));

const getEntityForState = (state) =>
  historicalEntities.find((entity) => state.entityIds.includes(entity.id)) || null;

export default function ExhibitionPage() {
  const { language, setLanguage } = useI18n();
  const text = getExhibitionText(language);
  const [started, setStarted] = useState(false);
  const [state, setState] = useState(initialTimelineState);
  const [tour, setTour] = useState({ active: false, index: 2, playing: false });
  const [speed, setSpeed] = useState(1);
  const [panel, setPanel] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(() => getEntityForState(initialTimelineState));
  const [comparison, setComparison] = useState(null);
  const [settings, setSettings] = useState({ scale: 1, contrast: false, simple: false });
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const warningTimer = useRef(null);
  const resetTimer = useRef(null);
  const kiosk = getKioskEnabled();
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const chooseState = useCallback((yearOrState) => {
    const next = typeof yearOrState === "number" ? getTimelineStateAtYear(yearOrState) : yearOrState;
    setState(next);
    setSelectedEntity(getEntityForState(next));
    setTour((current) => ({ ...current, index: timelineStates.findIndex((item) => item.id === next.id) }));
  }, []);

  const reset = useCallback(() => {
    setStarted(false);
    setState(initialTimelineState);
    setSelectedEntity(getEntityForState(initialTimelineState));
    setTour({ active: false, index: 2, playing: false });
    setPanel(null);
    setComparison(null);
    setInactivityWarning(false);
    setLanguage("ru");
  }, [setLanguage]);

  useEffect(() => {
    if (!tour.playing || !started) return undefined;
    const timer = window.setTimeout(() => {
      const nextIndex = tour.index + 1;
      if (nextIndex >= timelineStates.length) {
        setTour((current) => ({ ...current, playing: false }));
        return;
      }
      chooseState(timelineStates[nextIndex]);
    }, TOUR_STEP_MS / speed);
    return () => window.clearTimeout(timer);
  }, [tour.playing, tour.index, started, speed, chooseState]);

  useEffect(() => {
    if (!kiosk || !started) return undefined;
    const armTimers = () => {
      window.clearTimeout(warningTimer.current);
      window.clearTimeout(resetTimer.current);
      setInactivityWarning(false);
      warningTimer.current = window.setTimeout(() => setInactivityWarning(true), EXHIBITION_WARNING_MS);
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
    setPanel(null);
    chooseState(timelineStates[0]);
    setTour({ active: true, index: 0, playing: true });
  };

  const sourcesForCurrent = historicalSources.filter((source) => state.sourceIds.includes(source.id));

  const handleAgentAction = (action) => {
    switch (action.type) {
      case AGENT_ACTIONS.SET_YEAR:
        chooseState(action.payload.year);
        break;
      case AGENT_ACTIONS.COMPARE:
        setComparison(action.payload);
        setPanel("compare");
        break;
      case AGENT_ACTIONS.SELECT_ENTITY:
        setSelectedEntity(historicalEntities.find((item) => item.id === action.payload.entityId) || null);
        setPanel("entity");
        break;
      case AGENT_ACTIONS.SHOW_SOURCES:
        setPanel("sources");
        break;
      case AGENT_ACTIONS.START_LESSON:
        setPanel("lesson");
        break;
      case AGENT_ACTIONS.RESET:
        reset();
        break;
      default:
        break;
    }
  };

  if (!started) return <ExhibitionHero {...{ language, setLanguage, text }} onStart={startTour} onExplore={() => setStarted(true)} />;

  const displayedState = settings.simple
    ? { ...state, description: state.simpleDescription || state.description }
    : state;

  return (
    <main className={`exhibition ${settings.contrast ? "is-contrast" : ""}`} style={{ "--ex-scale": settings.scale }}>
      <ExhibitionControls
        {...{ text, language, setLanguage }}
        onHome={reset}
        onAgent={() => setPanel("agent")}
        onSources={() => setPanel("sources")}
        onCompare={() => { setComparison({ firstYear: 1465, secondYear: 1511 }); setPanel("compare"); }}
        onLesson={() => setPanel("lesson")}
        onThreeD={() => setPanel("3d")}
        onAccess={() => setPanel("access")}
      />
      <section className="ex-stage">
        <Suspense fallback={<div className="ex-map-loading"><i />{text.mapLabel}</div>}>
          <ExhibitionMap state={state} {...{ language, text, comparison, reducedMotion }} />
        </Suspense>
        <div className="ex-stage__wash" />
        <ExhibitionStoryPanel
          state={displayedState}
          {...{ language, text, tour }}
          onPrevious={() => chooseState(timelineStates[Math.max(0, tour.index - 1)])}
          onNext={() => {
            if (tour.index >= timelineStates.length - 1) setTour({ active: false, index: tour.index, playing: false });
            else chooseState(timelineStates[tour.index + 1]);
          }}
          onReplay={() => chooseState(state)}
          onExit={() => setTour((current) => ({ ...current, active: false, playing: false }))}
          onEntity={() => { setSelectedEntity(getEntityForState(state)); setPanel("entity"); }}
          onSources={() => setPanel("sources")}
        />
        <div className="ex-disclaimer ex-disclaimer--map">ⓘ {text.disclaimer}</div>
      </section>
      <ExhibitionTimeline
        states={timelineStates}
        current={state}
        {...{ language, text, speed }}
        playing={tour.playing}
        onSelect={chooseState}
        onTogglePlay={() => setTour((current) => ({ ...current, playing: !current.playing }))}
        onSpeed={setSpeed}
      />
      {panel && <div className="ex-panel-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
        {panel === "entity" && <ExhibitionEntityPanel entity={selectedEntity} {...{ language, text }} onClose={() => setPanel(null)} onCompare={() => { setComparison({ firstYear: 1465, secondYear: 1511 }); setPanel("compare"); }} onLesson={() => setPanel("lesson")} onSources={() => setPanel("sources")} />}
        {panel === "sources" && <ExhibitionSourcePanel sources={sourcesForCurrent.length ? sourcesForCurrent : historicalSources} {...{ language, text }} onClose={() => setPanel(null)} />}
        {panel === "compare" && <ExhibitionComparePanel comparison={comparison || { firstYear: 1465, secondYear: 1511 }} {...{ language, text }} onChange={setComparison} onClose={() => { setPanel(null); setComparison(null); }} />}
        {panel === "lesson" && <ExhibitionLessonPanel {...{ language, text }} onClose={() => setPanel(null)} onState={(id) => { const target = timelineStates.find((item) => item.id === id); if (target) chooseState(target); }} />}
        {panel === "access" && <ExhibitionAccessibility {...{ language, text, settings }} onChange={setSettings} onClose={() => setPanel(null)} />}
        {panel === "agent" && <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}><HistoricalAgent {...{ language, text }} onAction={handleAgentAction} onClose={() => setPanel(null)} /></Suspense>}
        {panel === "3d" && <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}><ExhibitionThreeD {...{ language, text }} onClose={() => setPanel(null)} /></Suspense>}
      </div>}
      {inactivityWarning && <div className="ex-toast" role="status"><span>◷</span><p>{text.inactivityWarning}</p><button onClick={() => setInactivityWarning(false)}>{text.continue}</button></div>}
      <div className="sr-only" aria-live="polite">{state.title[language] || state.title.ru}</div>
    </main>
  );
}
