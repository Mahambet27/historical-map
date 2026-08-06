import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../app/i18n.jsx";
import { HISTORICAL_DATA_SOURCE } from "../../config/env.js";
import { getHistoricalRepository } from "../../dataAccess/createHistoricalRepository.js";
import { getExhibitionText } from "../../i18n/exhibitionText.js";
import {
  initialTimelineState,
  timelineStates,
} from "../../data/exhibition/timeline.js";
import { getEraById, historicalEras } from "../../data/exhibition/eras.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { getGeometriesAtYear } from "../../data/exhibition/entityGeometries.js";
import { entityGeometries } from "../../data/exhibition/entityGeometries.js";
import { historicalEvents } from "../../data/exhibition/events.js";
import { historicalPeople } from "../../data/exhibition/people.js";
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
import HistoricalChangeLegend from "./HistoricalChangeLegend.jsx";
import {
  EXHIBITION_RESET_MS,
  EXHIBITION_WARNING_MS,
  TOUR_STEP_MS,
  getKioskEnabled,
} from "./exhibitionScenario.js";
import {
  resolveEraSelection,
  resolveTimelineUrlState,
  resolveYearSelection,
  writeTimelineUrlState,
} from "./historicalYearModel.js";
import {
  getNextHistoricalYear,
  getPreviousHistoricalYear,
} from "./timeline/historicalYear.js";
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
import {
  getAvailableComparisons,
  getChangeById,
  getHistoricalChange,
  shouldShowChangePrompt,
} from "./historicalChangeModel.js";
import { recordExhibitionMetric } from "./performanceTelemetry.js";
import {
  readLayerState,
  resetLayerState,
  storeLayerState,
  toggleLayerState,
} from "./layerState.js";
import {
  applyHistoricalMapPreset,
  DEFAULT_HISTORICAL_MAP_PRESET,
} from "./historicalMapPresets.js";
import {
  loadEnvironmentData,
  loadHydrologyData,
  loadRouteData,
} from "./p1bDataLoader.js";
import { parseP1BUrlState } from "./p1bUrlState.js";
import { parseP1CUrlState } from "./p1cUrlState.js";
import { loadArchiveData, loadEvidenceData } from "./p1cDataLoader.js";
import { canDisplayFullArchiveMap } from "./archiveMapRights.js";
import { buildReviewQueue } from "./review/reviewQueueModel.js";
import { readLocalReviews } from "./review/localReviewStore.js";
import HistoricalDataStatus from "./HistoricalDataStatus.jsx";
import useHistoricalSnapshot from "./hooks/useHistoricalSnapshot.js";
import useHistoricalRoutes from "./hooks/useHistoricalRoutes.js";
import useHistoricalEvidence from "./hooks/useHistoricalEvidence.js";
import {
  filterOfficialDemoRecords,
  isOfficialDemoRequested,
  isStoryAllowedInOfficialDemo,
  isTransitionAllowedInOfficialDemo,
} from "./officialDemoMode.js";
import { EXHIBITION_RELEASE } from "../../config/exhibitionRelease.js";
import { RELEASE_CHANNEL_POLICY } from "../../config/releaseChannel.js";
import ExhibitionOperatorMenu from "./demo/ExhibitionOperatorMenu.jsx";
import { runDemoHealthCheck } from "./demo/demoHealthCheck.js";
import { recordDemoEvent } from "./demo/demoTelemetry.js";

const ExhibitionMap = lazy(() => import("./ExhibitionMap.jsx"));
const HistoricalAgent = lazy(() => import("../agent/HistoricalAgent.jsx"));
const ExhibitionThreeD = lazy(() => import("./ExhibitionThreeD.jsx"));
const HistoricalChangePanel = lazy(() => import("./HistoricalChangePanel.jsx"));
const HistoricalStoryPlayer = lazy(() =>
  import("./story/HistoricalStoryPlayer.jsx")
);
const ExhibitionLayerPanel = lazy(() => import("./ExhibitionLayerPanel.jsx"));
const ExhibitionRoutePanel = lazy(() => import("./ExhibitionRoutePanel.jsx"));
const RouteJourneyPlayer = lazy(() => import("./RouteJourneyPlayer.jsx"));
const HistoricalGeographyPanel = lazy(() =>
  import("./HistoricalGeographyPanel.jsx")
);
const ExhibitionAtmosphere = lazy(() =>
  import("./atmosphere/ExhibitionAtmosphere.jsx")
);
const ArchiveMapPanel = lazy(() => import("./ArchiveMapPanel.jsx"));
const ArchiveMapCompare = lazy(() => import("./ArchiveMapCompare.jsx"));
const EvidencePanel = lazy(() => import("./EvidencePanel.jsx"));
const CitationExportPanel = lazy(() => import("./CitationExportPanel.jsx"));
const ReviewQueuePanel = lazy(() => import("./review/ReviewQueuePanel.jsx"));
const ScientificReviewPanel = lazy(() => import("./ScientificReviewPanel.jsx"));

const entityById = new Map(allHistoricalEntities.map((entity) => [entity.id, entity]));

const getPrimaryEntity = (snapshot, year) => {
  const activeIds = new Set(getGeometriesAtYear(year).map((item) => item.entityId));
  const snapshotEntity = snapshot?.entityIds?.find((id) => activeIds.has(id));
  return entityById.get(snapshotEntity || [...activeIds][0]) || null;
};

export default function ExhibitionPage({
  forceOfficialDemo = false,
  demoBoot = null,
  initialForceSvgFallback = false,
  recordingMode = false,
  kioskMode = false,
  projectorMode = false,
  onOpenRecovery,
} = {}) {
  const [officialDemo] = useState(
    () =>
      forceOfficialDemo ||
      RELEASE_CHANNEL_POLICY.defaultOfficialDemo ||
      isOfficialDemoRequested()
  );
  const [scientificReviewEnabled] = useState(() => {
    const requested =
      new URLSearchParams(window.location.search).get("scientificReview") ===
      "true";
    return (
      !forceOfficialDemo &&
      !RELEASE_CHANNEL_POLICY.defaultOfficialDemo &&
      RELEASE_CHANNEL_POLICY.showScientificReview &&
      !isOfficialDemoRequested() &&
      (import.meta.env.DEV || requested)
    );
  });
  const [p1bUrlState] = useState(() => parseP1BUrlState());
  const [p1cUrlState] = useState(() => parseP1CUrlState());
  const [forceSvgFallback, setForceSvgFallback] = useState(
    () =>
      initialForceSvgFallback ||
      new URLSearchParams(window.location.search).get("fallback") === "svg"
  );
  const { language, setLanguage } = useI18n();
  const text = getExhibitionText(language);
  const cleanHistorical =
    initialForceSvgFallback &&
    new URLSearchParams(window.location.search).get("legacyUi") !== "true";
  const [initialTimelineSelection] = useState(resolveTimelineUrlState);
  const [started, setStarted] = useState(
    () =>
      p1bUrlState.layers.length > 0 ||
      officialDemo ||
      Boolean(
        p1bUrlState.route ||
          p1bUrlState.place ||
          p1bUrlState.story ||
          p1cUrlState.archiveMap ||
          p1cUrlState.evidence ||
          p1cUrlState.review ||
          p1cUrlState.story
      )
  );
  const [selectedYear, setSelectedYear] = useState(
    initialTimelineSelection.selectedYear
  );
  const [selectedEraId, setSelectedEraId] = useState(
    initialTimelineSelection.selectedEraId
  );
  const [activeSnapshot, setActiveSnapshot] = useState(
    initialTimelineSelection.activeSnapshot || initialTimelineState
  );
  const activeEra = getEraById(selectedEraId);
  const [tour, setTour] = useState({
    active: false,
    index: 2,
    playing: false,
    total: timelineStates.length,
  });
  const [speed, setSpeed] = useState(1);
  const [panel, setPanel] = useState(CLOSED_PANEL);
  const [selectedEntity, setSelectedEntity] = useState(() =>
    getPrimaryEntity(
      initialTimelineSelection.activeSnapshot || initialTimelineState,
      initialTimelineSelection.selectedYear
    )
  );
  const [comparison, setComparison] = useState(null);
  const [activeChange, setActiveChange] = useState(null);
  const [activeChangeSection, setActiveChangeSection] = useState(null);
  const [changePrompt, setChangePrompt] = useState(null);
  const [storyId, setStoryId] = useState(null);
  const [storyStep, setStoryStep] = useState(null);
  const [repositoryStory, setRepositoryStory] = useState(null);
  const [sourceContextIds, setSourceContextIds] = useState(null);
  const [selectedReference, setSelectedReference] = useState(null);
  const [settings, setSettings] = useState({ scale: 1, contrast: false, simple: false });
  const [mapStyleMode, setMapStyleMode] = useState(readStoredMapStyle);
  const [historicalMapPreset, setHistoricalMapPreset] = useState(
    DEFAULT_HISTORICAL_MAP_PRESET
  );
  const [qualityMode, setQualityMode] = useState(readStoredQualityMode);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [layerState, setLayerState] = useState(() => {
    const initial = readLayerState();
    const withUrlLayers = p1bUrlState.layers.reduce(
      (state, layerId) => toggleLayerState(state, layerId, true),
      initial
    );
    return officialDemo
      ? applyHistoricalMapPreset(
          withUrlLayers,
          DEFAULT_HISTORICAL_MAP_PRESET,
          "auto"
        )
      : withUrlLayers;
  });
  const [loadedP1BData, setP1BData] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(
    () => (officialDemo ? null : p1bUrlState.route)
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState(
    () => p1bUrlState.place
  );
  const [routeJourneyActive, setRouteJourneyActive] = useState(false);
  const [routeCamera, setRouteCamera] = useState(null);
  const [atmosphereAnimating, setAtmosphereAnimating] = useState(false);
  const [performanceDegraded, setPerformanceDegraded] = useState(false);
  const [operatorMenuOpen, setOperatorMenuOpen] = useState(false);
  const [demoHealth, setDemoHealth] = useState(demoBoot?.health || null);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [loadedP1CData, setP1CData] = useState(null);
  const [evidenceTarget, setEvidenceTarget] = useState(
    () => p1cUrlState.evidence || null
  );
  const [selectedArchiveMapId, setSelectedArchiveMapId] = useState(
    () => p1cUrlState.archiveMap
  );
  const [archiveOpacity, setArchiveOpacity] = useState(
    () => p1cUrlState.archiveOpacity ?? 0.65
  );
  const [archiveOverlayEnabled, setArchiveOverlayEnabled] = useState(false);
  const [archiveAboveReconstruction, setArchiveAboveReconstruction] = useState(false);
  const [citationSource, setCitationSource] = useState(null);
  const [localReviews, setLocalReviews] = useState(readLocalReviews);
  const warningTimer = useRef(null);
  const resetTimer = useRef(null);
  const changePromptTimer = useRef(null);
  const selectedYearRef = useRef(initialTimelineSelection.selectedYear);
  const shownChangePromptsRef = useRef(new Set());
  const storyStartedAtRef = useRef(0);
  const panelBackdropRef = useRef(null);
  const p1bUrlAppliedRef = useRef(false);
  const p1cUrlAppliedRef = useRef(false);
  const hydrologySnapshotRef = useRef(null);
  const historicalPlaceSnapshotRef = useRef(null);
  const operatorPressTimerRef = useRef(null);
  const kiosk = kioskMode || getKioskEnabled();
  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const effectiveQuality = detectExhibitionQuality({
    requested: qualityMode,
    reducedMotion,
  });

  useEffect(() => {
    if (officialDemo && started) {
      recordDemoEvent("official_demo_started", {
        mode: recordingMode ? "recording" : kiosk ? "kiosk" : "standard",
      });
    }
  }, [kiosk, officialDemo, recordingMode, started]);
  const effectiveLayerState = useMemo(
    () =>
      effectiveQuality === "light" || mapStyleMode === "high-contrast"
        ? { ...layerState, atmosphere: false, "3dObjects": false, terrain: false }
        : recordingMode
          ? { ...layerState, atmosphere: false }
          : layerState,
    [effectiveQuality, layerState, mapStyleMode, recordingMode]
  );
  const repositoryDataSource = officialDemo ? "local" : undefined;
  const repositorySnapshot = useHistoricalSnapshot({
    year: selectedYear,
    language,
    enabled: started,
    dataSource: repositoryDataSource,
  });
  const needsRepositoryRoutes =
    layerState.tradeRoutes ||
    layerState.nomadicRoutes ||
    layerState.militaryRoutes ||
    layerState.historicalPlaces ||
    Boolean(selectedRouteId || selectedPlaceId || p1bUrlState.story);
  const repositoryRoutes = useHistoricalRoutes({
    year: selectedYear,
    language,
    enabled: needsRepositoryRoutes,
    dataSource: repositoryDataSource,
  });
  const repositoryEvidence = useHistoricalEvidence({
    subjectType: evidenceTarget?.subjectType,
    subjectId: evidenceTarget?.subjectId,
    language,
    enabled:
      ["evidence", "scientific"].includes(panel.type) &&
      Boolean(evidenceTarget),
    dataSource: repositoryDataSource,
  });
  const p1bData = useMemo(() => {
    const snapshot = repositorySnapshot.data;
    const routes = repositoryRoutes.data || snapshot?.routes;
    const temporalHydrology = [
      ...(snapshot?.hydrology || []),
      ...(loadedP1BData?.hydrologySnapshots || []),
    ];
    const combined = {
      ...(loadedP1BData || {}),
      ...(snapshot
        ? {
            environmentSnapshots: snapshot.environment || [],
            hydrologySnapshots: snapshot.hydrology || [],
            historicalRoutes: routes?.routes || [],
            routeSegments: routes?.segments || [],
            historicalSettlements: routes?.places?.length
              ? routes.places
              : snapshot.places || [],
          }
        : {}),
      ...(repositoryRoutes.data
        ? {
            historicalRoutes: repositoryRoutes.data.routes || [],
            routeSegments: repositoryRoutes.data.segments || [],
            historicalSettlements: repositoryRoutes.data.places || [],
          }
        : {}),
      hydrologySnapshots: [
        ...new Map(
          temporalHydrology.map((item) => [item.id, item])
        ).values(),
      ],
    };
    if (!officialDemo) return combined;
    const allowedRoutes = filterOfficialDemoRecords(
      combined.historicalRoutes || []
    ).filter((record) => EXHIBITION_RELEASE.allowedRoutes.includes(record.id));
    const allowedRouteIds = new Set(allowedRoutes.map((record) => record.id));
    return {
      ...combined,
      historicalRoutes: allowedRoutes,
      routeSegments: (combined.routeSegments || []).filter((record) =>
        allowedRouteIds.has(record.routeId)
      ),
      historicalSettlements: filterOfficialDemoRecords(
        combined.historicalSettlements || []
      ),
      environmentSnapshots: filterOfficialDemoRecords(
        combined.environmentSnapshots || []
      ),
      hydrologySnapshots: filterOfficialDemoRecords(
        combined.hydrologySnapshots || []
      ),
    };
  }, [loadedP1BData, officialDemo, repositoryRoutes.data, repositorySnapshot.data]);
  const p1cData = useMemo(
    () => ({
      ...(loadedP1CData || {}),
      ...(repositoryEvidence.data
        ? {
            sourceClaims: repositoryEvidence.data.claims || [],
            archiveMaps: repositoryEvidence.data.archiveMaps?.length
              ? repositoryEvidence.data.archiveMaps
              : loadedP1CData?.archiveMaps || [],
          }
        : {}),
    }),
    [loadedP1CData, repositoryEvidence.data]
  );
  const palette = useMemo(
    () => resolveMapPalette({ mode: mapStyleMode, eraId: selectedEraId, year: selectedYear }),
    [mapStyleMode, selectedEraId, selectedYear]
  );
  const showPanel = useCallback((type, mode = "expanded") => {
    setPanel(openPanel(type, mode));
  }, []);
  const hidePanel = useCallback(() => setPanel(closePanel()), []);
  const openComparison = useCallback((firstYear, secondYear, mode = "overlay") => {
    if (
      officialDemo &&
      !isTransitionAllowedInOfficialDemo(firstYear, secondYear)
    ) {
      return;
    }
    setComparison({ firstYear, secondYear, mode, geometryResult: null });
    showPanel("compare");
  }, [officialDemo, showPanel]);
  const toggleLayer = useCallback((layerId, enabled) => {
    setLayerState((current) => {
      const next =
        layerId === "__reset__"
          ? resetLayerState(effectiveQuality)
          : toggleLayerState(current, layerId, enabled);
      recordExhibitionMetric("layer_toggled", enabled === false ? 0 : 1, {
        layerId,
      });
      if (layerId === "atmosphere") {
        recordExhibitionMetric(
          enabled ? "atmosphere_enabled" : "atmosphere_disabled",
          1
        );
      }
      if (layerId === "terrain") {
        recordExhibitionMetric("terrain_context_changed", enabled === false ? 0 : 1, {
          mode: enabled === false ? "off" : "subtle",
        });
      }
      return next;
    });
  }, [effectiveQuality]);

  const changeHistoricalMapPreset = useCallback(
    (presetId) => {
      setHistoricalMapPreset(presetId);
      setLayerState((current) =>
        applyHistoricalMapPreset(current, presetId, effectiveQuality)
      );
      recordExhibitionMetric("historical_map_preset_changed", 1, { presetId });
    },
    [effectiveQuality]
  );

  useEffect(() => {
    storeLayerState(layerState);
  }, [layerState]);

  useEffect(() => {
    if (!storyId) return undefined;
    const controller = new AbortController();
    getHistoricalRepository({ dataSource: repositoryDataSource })
      .then((repository) =>
        repository.getStory(storyId, {
          language,
          signal: controller.signal,
        })
      )
      .then((story) => {
        if (!controller.signal.aborted) setRepositoryStory(story);
      })
      .catch((error) => {
        if (error?.name !== "AbortError" && error?.code !== "ABORTED") {
          recordExhibitionMetric("repository_story_failed", 1, {
            reason: error?.code || "INVALID_RESPONSE",
          });
        }
      });
    return () => controller.abort();
  }, [language, repositoryDataSource, storyId]);

  useEffect(() => {
    const needsEnvironment =
      layerState.environment || Boolean(p1bUrlState.story) || panel.type === "review";
    const needsHydrology =
      layerState.hydrology || Boolean(p1bUrlState.story) || panel.type === "review";
    const needsRoutes =
      layerState.tradeRoutes ||
      layerState.nomadicRoutes ||
      layerState.militaryRoutes ||
      layerState.historicalPlaces ||
      layerState.archaeology ||
      selectedRouteId ||
      selectedPlaceId ||
      p1bUrlState.story ||
      panel.type === "review";
    const localLoaderAllowed =
      HISTORICAL_DATA_SOURCE !== "supabase" &&
      repositorySnapshot.activeRepository !== "supabase";
    if (
      !localLoaderAllowed ||
      (!needsEnvironment && !needsHydrology && !needsRoutes)
    ) {
      return undefined;
    }
    const controller = new AbortController();
    const tasks = [];
    if (needsEnvironment) {
      tasks.push(
        loadEnvironmentData(controller.signal).then((module) =>
          setP1BData((current) => ({
            ...(current || {}),
            environmentSnapshots: module.environmentSnapshots,
          }))
        )
      );
    }
    if (needsHydrology) {
      tasks.push(
        loadHydrologyData(controller.signal).then((module) =>
          setP1BData((current) => ({
            ...(current || {}),
            hydrologySnapshots: module.hydrologySnapshots,
          }))
        )
      );
    }
    if (needsRoutes) {
      tasks.push(
        loadRouteData(controller.signal).then((module) =>
          setP1BData((current) => ({
            ...(current || {}),
            historicalRoutes: module.historicalRoutes,
            routeSegments: module.routeSegments,
            historicalSettlements: module.historicalSettlements,
          }))
        )
      );
    }
    Promise.all(tasks).catch((error) => {
      if (error?.name !== "AbortError") {
        recordExhibitionMetric("p1b_data_load_failed", 1, {
          reason: error?.message || "unknown",
        });
      }
    });
    return () => controller.abort();
  }, [
    layerState.archaeology,
    layerState.environment,
    layerState.historicalPlaces,
    layerState.hydrology,
    layerState.militaryRoutes,
    layerState.nomadicRoutes,
    layerState.tradeRoutes,
    selectedPlaceId,
    selectedRouteId,
    p1bUrlState.story,
    panel.type,
    repositorySnapshot.activeRepository,
    repositoryDataSource,
  ]);

  useEffect(() => {
    const needsArchive =
      layerState.archiveMaps ||
      ["archive", "archiveCompare", "review"].includes(panel.type) ||
      Boolean(p1cUrlState.archiveMap || p1cUrlState.compareArchive || p1cUrlState.story) ||
      storyId === "historical-evidence";
    const needsEvidence =
      ["evidence", "review", "scientific"].includes(panel.type) ||
      Boolean(p1cUrlState.evidence || p1cUrlState.review || p1cUrlState.story) ||
      storyId === "historical-evidence";
    if (!needsArchive && !needsEvidence) return undefined;
    const controller = new AbortController();
    const tasks = [];
    if (needsArchive) {
      if (repositorySnapshot.activeRepository === "supabase") {
        tasks.push(
          getHistoricalRepository({ dataSource: repositoryDataSource })
            .then((repository) =>
              repository.getArchiveMaps({ signal: controller.signal })
            )
            .then((maps) =>
              setP1CData((current) => ({
                ...(current || {}),
                archiveMaps: maps,
              }))
            )
        );
      } else {
        tasks.push(loadArchiveData(controller.signal).then((module) =>
          setP1CData((current) => ({ ...(current || {}), archiveMaps: module.archiveMaps }))
        ));
      }
    }
    if (
      needsEvidence &&
      (repositorySnapshot.activeRepository !== "supabase" ||
        panel.type === "review")
    ) {
      tasks.push(loadEvidenceData(controller.signal).then((module) =>
        setP1CData((current) => ({
          ...(current || {}),
          sourceClaims: module.sourceClaims,
          sourceDisputes: module.sourceDisputes,
        }))
      ));
    }
    Promise.all(tasks).catch((error) => {
      if (error?.name !== "AbortError") {
        recordExhibitionMetric("evidence_validation_failed", 1, {
          reason: error?.message || "unknown",
        });
      }
    });
    return () => controller.abort();
  }, [
    layerState.archiveMaps,
    p1cUrlState.archiveMap,
    p1cUrlState.compareArchive,
    p1cUrlState.evidence,
    p1cUrlState.review,
    p1cUrlState.story,
    panel.type,
    repositorySnapshot.activeRepository,
    repositoryDataSource,
    storyId,
  ]);

  useEffect(() => {
    if (!layerState.hydrology || !p1bData?.hydrologySnapshots) return;
    const snapshot = p1bData.hydrologySnapshots
      .filter(
        (item) =>
          item.validFromYear <= selectedYear &&
          (item.validToYear === null || item.validToYear >= selectedYear)
      )
      .sort((a, b) => b.validFromYear - a.validFromYear)[0];
    if (!snapshot) {
      recordExhibitionMetric("historical_geography_unavailable", selectedYear, {
        featureType: "hydrology",
      });
      return;
    }
    if (snapshot.id === hydrologySnapshotRef.current) return;
    hydrologySnapshotRef.current = snapshot.id;
    recordExhibitionMetric("historical_hydrology_snapshot_changed", selectedYear, {
      snapshotId: snapshot.id,
    });
  }, [layerState.hydrology, p1bData, selectedYear]);

  useEffect(() => {
    if (!selectedPlaceId) return;
    const signature = `${selectedPlaceId}:${selectedYear}`;
    if (historicalPlaceSnapshotRef.current === signature) return;
    historicalPlaceSnapshotRef.current = signature;
    recordExhibitionMetric("historical_place_snapshot_changed", selectedYear, {
      placeId: selectedPlaceId,
    });
  }, [selectedPlaceId, selectedYear]);

  useEffect(() => {
    if (selectedEraId) writeTimelineUrlState(selectedEraId, selectedYear);
  }, [selectedEraId, selectedYear]);

  const handleYearChange = useCallback((year) => {
    const selection = resolveYearSelection(year);
    const { selectedYear: exactYear, selectedEraId: eraId, activeSnapshot: snapshot } = selection;
    setChangePrompt(null);
    const promptCandidate = shouldShowChangePrompt({
      fromYear: selectedYearRef.current,
      toYear: exactYear,
      kioskAutoplay: tour.playing || Boolean(storyId),
      alreadyShown: shownChangePromptsRef.current,
    });
    const prompt =
      officialDemo &&
      promptCandidate &&
      !isTransitionAllowedInOfficialDemo(
        promptCandidate.change.fromYear,
        promptCandidate.change.toYear
      )
        ? null
        : promptCandidate;
    if (prompt) {
      shownChangePromptsRef.current.add(prompt.signature);
      setChangePrompt(prompt);
      recordExhibitionMetric("historical_change_prompt_shown", 1, {
        changeId: prompt.change.id,
        fromYear: selectedYearRef.current,
        toYear: exactYear,
      });
    }
    selectedYearRef.current = exactYear;
    setSelectedYear(exactYear);
    setActiveSnapshot(snapshot);
    setSelectedEraId(eraId);
    setSelectedEntity(getPrimaryEntity(snapshot, exactYear));
    const tourIndex = timelineStates.findIndex((item) => item.id === snapshot.id);
    setTour((current) => ({ ...current, index: Math.max(0, tourIndex) }));
  }, [officialDemo, storyId, tour.playing]);

  const handleEraChange = useCallback((eraId) => {
    const selection = resolveEraSelection(eraId);
    if (!selection) return;
    const { selectedYear: defaultYear, selectedEraId: nextEraId, activeSnapshot: snapshot } = selection;
    setSelectedEraId(nextEraId);
    setSelectedYear(defaultYear);
    selectedYearRef.current = defaultYear;
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
    setStarted(officialDemo);
    setSelectedYear(1465);
    setSelectedEraId("kazakh-khanate");
    setActiveSnapshot(initialTimelineState);
    setSelectedEntity(null);
    setTour({ active: false, index: 2, playing: false, total: timelineStates.length });
    setPanel(closePanel());
    setComparison(null);
    setActiveChange(null);
    setActiveChangeSection(null);
    setChangePrompt(null);
    setStoryId(null);
    setStoryStep(null);
    setSourceContextIds(null);
    setSelectedReference(null);
    setLayerState(
      applyHistoricalMapPreset(
        resetLayerState(effectiveQuality),
        DEFAULT_HISTORICAL_MAP_PRESET,
        effectiveQuality
      )
    );
    setHistoricalMapPreset(DEFAULT_HISTORICAL_MAP_PRESET);
    setSelectedRouteId(null);
    setSelectedPlaceId(null);
    setRouteJourneyActive(false);
    setRouteCamera(null);
    selectedYearRef.current = 1465;
    shownChangePromptsRef.current.clear();
    setInactivityWarning(false);
    setAtmosphereAnimating(false);
    setOperatorMenuOpen(false);
    try {
      sessionStorage.setItem("qhm.demo.lastReset", new Date().toISOString());
    } catch {
      // Session storage is optional in kiosk/privacy modes.
    }
    if (officialDemo) recordDemoEvent("official_demo_reset");
  }, [effectiveQuality, officialDemo]);

  useEffect(() => {
    storeMapStyle(mapStyleMode);
  }, [mapStyleMode]);

  useEffect(() => {
    storeQualityMode(qualityMode);
  }, [qualityMode]);

  useEffect(() => {
    window.clearTimeout(changePromptTimer.current);
    if (!changePrompt) return undefined;
    changePromptTimer.current = window.setTimeout(
      () => setChangePrompt(null),
      reducedMotion ? 24_000 : 20_000
    );
    return () => window.clearTimeout(changePromptTimer.current);
  }, [changePrompt, reducedMotion]);

  useEffect(() => {
    const container = panelBackdropRef.current;
    if (!panel.type || panel.mode !== "expanded" || !container) return undefined;
    const selector =
      'button:not([disabled]), a[href], select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => [...container.querySelectorAll(selector)];
    focusable()[0]?.focus();
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    container.addEventListener("keydown", trapFocus);
    return () => container.removeEventListener("keydown", trapFocus);
  }, [panel.mode, panel.type]);

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
      if (
        officialDemo &&
        ((event.ctrlKey &&
          event.shiftKey &&
          event.key.toLowerCase() === "o") ||
          (kiosk && event.key === "Escape"))
      ) {
        event.preventDefault();
        setOperatorMenuOpen(true);
        recordDemoEvent("operator_menu_opened");
        return;
      }
      const action = getExhibitionShortcut(event);
      if (!action) return;
      if (
        officialDemo &&
        ["lesson", "agent", "review-queue"].includes(action)
      ) {
        return;
      }
      event.preventDefault();
      if (action === "toggle-play") {
        setTour((current) => ({ ...current, playing: !current.playing }));
      } else if (action === "previous-year") {
        handleYearChange(getPreviousHistoricalYear(selectedYear));
      } else if (action === "next-year") {
        handleYearChange(getNextHistoricalYear(selectedYear));
      } else if (action === "lesson") {
        showPanel("lesson");
      } else if (action === "agent") {
        showPanel("agent");
      } else if (action === "compare") {
        openComparison(1465, 1511);
      } else if (action === "routes") {
        toggleLayer("tradeRoutes");
      } else if (action === "environment") {
        toggleLayer("environment");
      } else if (action === "hydrology") {
        toggleLayer("hydrology");
      } else if (action === "historical-places") {
        toggleLayer("historicalPlaces");
      } else if (action === "route-journey") {
        if (selectedRouteId && !routeJourneyActive) setRouteJourneyActive(true);
      } else if (action === "evidence") {
        setEvidenceTarget({ subjectType: "entity", subjectId: selectedEntity?.id || "kazakh-khanate" });
        showPanel("evidence");
      } else if (action === "archive-maps") {
        toggleLayer("archiveMaps", true);
        showPanel("archive");
      } else if (action === "archive-compare") {
        showPanel(selectedArchiveMapId ? "archiveCompare" : "archive");
      } else if (action === "review-queue") {
        showPanel("review");
      } else if (action === "close-panel") {
        hidePanel();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [
    started,
    selectedYear,
    selectedRouteId,
    selectedArchiveMapId,
    selectedEntity,
    routeJourneyActive,
    handleYearChange,
    showPanel,
    hidePanel,
    openComparison,
    toggleLayer,
    officialDemo,
    kiosk,
  ]);

  useEffect(() => {
    if (!tour.playing || !started) return undefined;
    const timer = window.setTimeout(() => {
      let nextYear = selectedYear;
      for (let index = 0; index < speed; index += 1) {
        nextYear = getNextHistoricalYear(nextYear);
      }
      if (!activeEra || nextYear > activeEra.toYear) {
        setTour((current) => ({ ...current, playing: false }));
        return;
      }
      handleYearChange(nextYear);
    }, Math.min(1000, TOUR_STEP_MS));
    return () => window.clearTimeout(timer);
  }, [tour.playing, started, speed, selectedYear, activeEra, handleYearChange]);

  useEffect(() => {
    if (!kiosk || !started || recordingMode) return undefined;
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
  }, [kiosk, recordingMode, started, reset]);

  useEffect(() => {
    if (!kiosk || recordingMode) return undefined;
    let timer;
    const showCursor = () => {
      setCursorHidden(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setCursorHidden(true), 4000);
    };
    window.addEventListener("pointermove", showCursor, { passive: true });
    showCursor();
    return () => {
      window.removeEventListener("pointermove", showCursor);
      window.clearTimeout(timer);
    };
  }, [kiosk, recordingMode]);

  const startTour = () => {
    setStarted(true);
    hidePanel();
    handleYearChange(timelineStates[0].year);
    setTour({ active: true, index: 0, playing: true, total: timelineStates.length });
  };

  const openSources = useCallback((sourceIds = null) => {
    setSourceContextIds(sourceIds);
    showPanel("sources");
  }, [showPanel]);

  const openEvidence = useCallback((subjectType, subjectId) => {
    setEvidenceTarget({ subjectType, subjectId });
    showPanel("evidence");
    recordExhibitionMetric("evidence_panel_opened", 1, { subjectType, subjectId });
  }, [showPanel]);

  const openArchiveMaps = useCallback(() => {
    setLayerState((current) => ({ ...current, archiveMaps: true }));
    showPanel("archive");
    recordExhibitionMetric("archive_panel_opened", 1);
  }, [showPanel]);

  const selectArchiveMap = useCallback((archiveMap, opacityOverride = null) => {
    if (!canDisplayFullArchiveMap(archiveMap)) {
      recordExhibitionMetric("restricted_archive_blocked", 1, {
        archiveMapId: archiveMap?.id || "unknown",
        licenseStatus: archiveMap?.license?.status || "unknown",
      });
      return false;
    }
    const image = new Image();
    const startedAt = performance.now();
    image.src = archiveMap.imageUrl;
    Promise.resolve(image.decode?.()).then(() => {
      setSelectedArchiveMapId(archiveMap.id);
      setArchiveOpacity(opacityOverride ?? archiveMap.defaultOpacity ?? 0.65);
      setArchiveOverlayEnabled(true);
      setLayerState((current) => ({ ...current, archiveMaps: true }));
      recordExhibitionMetric("archive_map_selected", 1, { archiveMapId: archiveMap.id });
      recordExhibitionMetric("archive_overlay_enabled", 1, { archiveMapId: archiveMap.id });
      recordExhibitionMetric("archive_overlay_decode_time", performance.now() - startedAt, {
        archiveMapId: archiveMap.id,
        unit: "ms",
      });
    }).catch(() => {
      recordExhibitionMetric("evidence_validation_failed", 1, {
        reason: "archive_image_decode_failed",
        archiveMapId: archiveMap.id,
      });
    });
    return true;
  }, []);

  const openArchiveComparison = useCallback((archiveMap, opacityOverride = null) => {
    if (!selectArchiveMap(archiveMap, opacityOverride)) return;
    showPanel("archiveCompare");
    recordExhibitionMetric("archive_comparison_started", 1, { archiveMapId: archiveMap.id });
  }, [selectArchiveMap, showPanel]);

  const openCitation = useCallback((source) => {
    if (!source) return;
    setCitationSource(source);
    showPanel("citation");
  }, [showPanel]);

  const openReviewQueue = useCallback(() => {
    showPanel("review");
    recordExhibitionMetric("review_queue_opened", 1);
  }, [showPanel]);

  const openRoute = useCallback((routeId, startJourney = false) => {
    if (
      officialDemo &&
      !EXHIBITION_RELEASE.allowedRoutes.includes(routeId)
    ) {
      return;
    }
    setSelectedRouteId(routeId);
    setLayerState((current) => ({
      ...current,
      tradeRoutes: true,
      historicalPlaces: true,
    }));
    recordExhibitionMetric("route_selected", 1, { routeId });
    if (startJourney) {
      setRouteJourneyActive(true);
      hidePanel();
    } else {
      showPanel("route");
    }
  }, [hidePanel, officialDemo, showPanel]);

  const openPlace = useCallback((placeId, geography = true) => {
    setSelectedPlaceId(placeId);
    setLayerState((current) => ({ ...current, historicalPlaces: true }));
    if (geography) showPanel("geography");
  }, [showPanel]);

  const handleRouteStopChange = useCallback((place) => {
    setSelectedPlaceId(place.id);
    setRouteCamera({
      center: place.coordinates,
      zoom: 6.4,
      pitch: effectiveQuality === "light" ? 0 : 22,
      bearing: 0,
      duration: performanceDegraded ? 0 : undefined,
    });
  }, [effectiveQuality, performanceDegraded]);

  const openHistoricalChange = useCallback((changeOrId, section = null) => {
    const base =
      typeof changeOrId === "string" ? getChangeById(changeOrId) : changeOrId;
    if (!base) return;
    const displayChange =
      base.displayFromYear !== undefined
        ? base
        : getHistoricalChange(base.fromYear, base.toYear);
    setActiveChange(displayChange);
    setActiveChangeSection(section);
    if (section === "sources") {
      setSourceContextIds(base.sourceIds);
      showPanel("sources");
      recordExhibitionMetric("historical_change_source_opened", 1, {
        changeId: base.id,
        sourceCount: base.sourceIds.length,
      });
    } else {
      showPanel("change");
    }
    recordExhibitionMetric("historical_change_opened", 1, {
      changeId: base.id,
    });
  }, [showPanel]);

  const handleGeometryResult = useCallback((geometryResult, geometryMeta = null) => {
    setComparison((current) =>
      current ? { ...current, geometryResult, geometryMeta } : current
    );
  }, []);

  const startHistoricalStory = useCallback((nextStoryId) => {
    if (officialDemo && !isStoryAllowedInOfficialDemo(nextStoryId)) return;
    storyStartedAtRef.current = performance.now();
    setStoryId(nextStoryId);
    setStoryStep(null);
    setComparison(null);
    hidePanel();
    setTour((current) => ({ ...current, playing: false }));
    recordExhibitionMetric("story_started", 1, { storyId: nextStoryId });
    if (nextStoryId === "silk-road-geography") {
      recordExhibitionMetric("geography_story_started", 1, {
        storyId: nextStoryId,
      });
    }
    if (nextStoryId === "historical-evidence") {
      recordExhibitionMetric("evidence_story_started", 1, {
        storyId: nextStoryId,
      });
    }
  }, [hidePanel, officialDemo]);

  const handleStoryStepChange = useCallback((step) => {
    setStoryStep(step);
    handleYearChange(step.year);
    if (step.entityIds?.[0]) selectEntity(step.entityIds[0], false);
    if (step.selectedRouteId) setSelectedRouteId(step.selectedRouteId);
    if (step.selectedPlaceId) setSelectedPlaceId(step.selectedPlaceId);
    if (step.archiveMapId) {
      const archiveMap = p1cData?.archiveMaps?.find((item) => item.id === step.archiveMapId);
      if (archiveMap) selectArchiveMap(archiveMap);
    }
    if (
      step.activeLayers?.includes("comparison") &&
      step.action?.type === "comparison"
    ) {
      setComparison({
        firstYear: step.action.fromYear,
        secondYear: step.action.toYear,
        mode: "overlay",
        geometryResult: null,
        storyControlled: true,
      });
    } else {
      setComparison((current) => current?.storyControlled ? null : current);
    }
    if (storyStartedAtRef.current) {
      recordExhibitionMetric(
        "story-start-duration",
        performance.now() - storyStartedAtRef.current,
        { unit: "ms" }
      );
      storyStartedAtRef.current = 0;
    }
  }, [handleYearChange, p1cData, selectArchiveMap, selectEntity]);

  useEffect(() => {
    const url = p1bUrlState;
    if (p1bUrlAppliedRef.current || !p1bData?.historicalRoutes) return;
    const timer = window.setTimeout(() => {
      p1bUrlAppliedRef.current = true;
      if (url.route) openRoute(url.route);
      if (url.place) openPlace(url.place);
      if (url.atmosphere !== null) toggleLayer("atmosphere", url.atmosphere);
      if (url.story) startHistoricalStory(url.story);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [openPlace, openRoute, p1bData, p1bUrlState, startHistoricalStory, toggleLayer]);

  useEffect(() => {
    if (
      p1cUrlAppliedRef.current ||
      (!p1cData?.archiveMaps && !p1cData?.sourceClaims)
    ) return;
    const timer = window.setTimeout(() => {
      p1cUrlAppliedRef.current = true;
      const archiveMap = p1cData?.archiveMaps?.find(
        (item) => item.id === p1cUrlState.archiveMap
      );
      if (archiveMap) {
        if (p1cUrlState.compareArchive) {
          openArchiveComparison(archiveMap, p1cUrlState.archiveOpacity);
        } else if (canDisplayFullArchiveMap(archiveMap)) {
          selectArchiveMap(archiveMap, p1cUrlState.archiveOpacity);
        } else if (!canDisplayFullArchiveMap(archiveMap)) {
          selectArchiveMap(archiveMap);
          openArchiveMaps();
        }
      }
      if (p1cUrlState.evidence) {
        openEvidence(
          p1cUrlState.evidence.subjectType,
          p1cUrlState.evidence.subjectId
        );
      }
      if (p1cUrlState.review) openReviewQueue();
      if (p1cUrlState.story) startHistoricalStory(p1cUrlState.story);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    openArchiveComparison,
    openArchiveMaps,
    openEvidence,
    openReviewQueue,
    p1cData,
    p1cUrlState,
    selectArchiveMap,
    startHistoricalStory,
  ]);

  const sourceIdsForPanel = sourceContextIds || activeSnapshot.sourceIds;
  const sourcesForCurrent = historicalSources.filter((source) =>
    sourceIdsForPanel.includes(source.id)
  );
  const availableChanges = getAvailableComparisons(selectedYear);
  const currentAvailableChange = availableChanges[0]
    ? getHistoricalChange(selectedYear, availableChanges[0].toYear)
    : null;
  const comparisonFirstYear = comparison?.firstYear;
  const comparisonSecondYear = comparison?.secondYear;
  const comparisonChange = useMemo(
    () =>
      comparisonFirstYear !== undefined && comparisonSecondYear !== undefined
        ? getHistoricalChange(comparisonFirstYear, comparisonSecondYear)
        : null,
    [comparisonFirstYear, comparisonSecondYear]
  );
  const referenceItem = selectedReference?.type === "person"
    ? historicalPeople.find((item) => item.id === selectedReference.id)
    : historicalEvents.find((item) => item.id === selectedReference?.id);
  const selectedRoute =
    p1bData?.historicalRoutes?.find((route) => route.id === selectedRouteId) ||
    null;
  const selectedHistoricalPlace =
    p1bData?.historicalSettlements?.find(
      (place) => place.id === selectedPlaceId
    ) || null;
  const selectedRoutePlaces = selectedRoute
    ? selectedRoute.placeIds
        .map((id) =>
          p1bData?.historicalSettlements?.find((place) => place.id === id)
        )
        .filter(Boolean)
    : [];
  const selectedArchiveMap =
    p1cData?.archiveMaps?.find((map) => map.id === selectedArchiveMapId) || null;
  const reviewQueue = buildReviewQueue({
    claims: p1cData?.sourceClaims || [],
    geometries: entityGeometries,
    routes: p1bData?.historicalRoutes || [],
    places: p1bData?.historicalSettlements || [],
    hydrology: p1bData?.hydrologySnapshots || [],
    environment: p1bData?.environmentSnapshots || [],
    archiveMaps: p1cData?.archiveMaps || [],
  });
  const environmentScreenReaderText = effectiveLayerState.environment
    ? (p1bData?.environmentSnapshots || [])
        .filter(
          (item) =>
            item.validFromYear <= selectedYear &&
            (item.validToYear === null || item.validToYear >= selectedYear)
        )
        .map(
          (item) =>
            item.screenReaderDescriptions?.[language] ||
            item.screenReaderDescriptions?.ru
        )
        .filter(Boolean)
        .join(" ")
    : "";
  const geographyUnavailable =
    effectiveLayerState.hydrology &&
    Boolean(p1bData?.hydrologySnapshots) &&
    !(p1bData?.hydrologySnapshots || []).some(
      (item) =>
        item.validFromYear <= selectedYear &&
        (item.validToYear == null || item.validToYear >= selectedYear)
    );

  const handleAgentAction = (action) => {
    switch (action.type) {
      case AGENT_ACTIONS.SET_YEAR:
        handleYearChange(action.payload.year);
        break;
      case AGENT_ACTIONS.COMPARE:
        openComparison(action.payload.firstYear, action.payload.secondYear);
        break;
      case AGENT_ACTIONS.OPEN_COMPARISON:
        openComparison(
          action.payload.firstYear,
          action.payload.secondYear,
          action.payload.mode
        );
        break;
      case AGENT_ACTIONS.SELECT_ENTITY:
        selectEntity(action.payload.entityId);
        break;
      case AGENT_ACTIONS.SHOW_SOURCES:
        openSources();
        break;
      case AGENT_ACTIONS.START_LESSON:
        showPanel("lesson");
        break;
      case AGENT_ACTIONS.SHOW_CHANGE:
        openHistoricalChange(action.payload.changeId, action.payload.section);
        break;
      case AGENT_ACTIONS.START_STORY:
        startHistoricalStory(action.payload.storyId);
        break;
      case AGENT_ACTIONS.TOGGLE_LAYER:
        toggleLayer(action.payload.layerId, action.payload.enabled);
        break;
      case AGENT_ACTIONS.SELECT_ROUTE:
        openRoute(action.payload.routeId);
        break;
      case AGENT_ACTIONS.START_ROUTE_JOURNEY:
        openRoute(action.payload.routeId, true);
        break;
      case AGENT_ACTIONS.SELECT_PLACE:
        openPlace(action.payload.placeId, false);
        break;
      case AGENT_ACTIONS.SHOW_GEOGRAPHY:
        if (action.payload.targetType === "place") {
          openPlace(action.payload.targetId, true);
        } else {
          showPanel("geography");
        }
        break;
      case AGENT_ACTIONS.START_GEOGRAPHY_STORY:
        startHistoricalStory(action.payload.storyId);
        break;
      case AGENT_ACTIONS.SHOW_EVIDENCE:
        openEvidence(action.payload.subjectType, action.payload.subjectId);
        break;
      case AGENT_ACTIONS.SHOW_ARCHIVE_MAPS:
        openArchiveMaps();
        break;
      case AGENT_ACTIONS.SELECT_ARCHIVE_MAP: {
        const archiveMap = p1cData?.archiveMaps?.find(
          (item) => item.id === action.payload.archiveMapId
        );
        if (archiveMap) selectArchiveMap(archiveMap);
        break;
      }
      case AGENT_ACTIONS.START_ARCHIVE_COMPARISON: {
        const archiveMap = p1cData?.archiveMaps?.find(
          (item) => item.id === action.payload.archiveMapId
        );
        if (archiveMap) openArchiveComparison(archiveMap);
        else openArchiveMaps();
        break;
      }
      case AGENT_ACTIONS.SHOW_REVIEW_QUEUE:
        openReviewQueue();
        break;
      case AGENT_ACTIONS.SHOW_DISPUTE:
        setEvidenceTarget({ subjectType: "geometry", subjectId: "demo-only" });
        showPanel("evidence");
        break;
      case AGENT_ACTIONS.START_EVIDENCE_STORY:
        startHistoricalStory(action.payload.storyId);
        break;
      case AGENT_ACTIONS.EXPORT_CITATION: {
        const source = historicalSources.find(
          (item) => item.id === action.payload.sourceId
        );
        openCitation(source);
        break;
      }
      case AGENT_ACTIONS.SHOW_EVENT:
        setSelectedReference({ type: "event", id: action.payload.eventId });
        showPanel("reference");
        break;
      case AGENT_ACTIONS.SHOW_PERSON:
        setSelectedReference({ type: "person", id: action.payload.personId });
        showPanel("reference");
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
      } ${pageVisible ? "" : "is-hidden"} ${
        cursorHidden ? "is-cursor-hidden" : ""
      } ${kiosk ? "is-kiosk" : ""} ${recordingMode ? "is-recording" : ""} ${
        projectorMode ? "is-projector" : ""
      } ${cleanHistorical ? "is-clean-historical" : ""}`}
      style={{ "--ex-scale": settings.scale, ...paletteToCssVariables(palette) }}
      data-theme={palette.id}
      data-quality={effectiveQuality}
      data-official-demo={officialDemo ? "true" : "false"}
      data-projector={projectorMode ? "true" : "false"}
      data-atmosphere-animation={atmosphereAnimating ? "running" : "idle"}
    >
      {cleanHistorical ? (
        <header className="ex-clean-header">
          <button
            className="ex-wordmark"
            onClick={reset}
            aria-label="Qazaq Heritage Map"
          >
            <span>Q</span>
            <strong>Qazaq Heritage Map</strong>
          </button>
          <div className="ex-clean-header__actions">
            <div className="ex-language" aria-label="Language">
              {["kk", "ru", "en"].map((code) => (
                <button
                  key={code}
                  className={language === code ? "is-active" : ""}
                  onClick={() => setLanguage(code)}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="ex-clean-fullscreen"
              onClick={() => document.documentElement.requestFullscreen?.()}
            >
              <span aria-hidden="true">⛶</span>
              {language === "en"
                ? "Fullscreen"
                : language === "kk"
                  ? "Толық экран"
                  : "Полный экран"}
            </button>
          </div>
        </header>
      ) : (
        <ExhibitionControls
          {...{ text, language, setLanguage, officialDemo }}
          onHome={reset}
          onAgent={() => showPanel("agent")}
          onSources={() => openSources()}
          onCompare={() => {
            openComparison(1465, 1511);
          }}
          onLesson={() => showPanel("lesson")}
          onLayers={() => showPanel("layers")}
          onStory={() =>
            startHistoricalStory("formation-and-consolidation-kazakh-khanate")
          }
          onThreeD={() => showPanel("3d")}
          onAccess={() => showPanel("access")}
        />
      )}
      {kiosk && !recordingMode && !document.fullscreenElement && (
        <button
          type="button"
          className="ex-fullscreen-prompt"
          onClick={() => document.documentElement.requestFullscreen?.()}
        >
          {language === "en"
            ? "Open fullscreen"
            : language === "kk"
              ? "Толық экранды ашу"
              : "Открыть полный экран"}
        </button>
      )}
      {officialDemo && (
        <button
          type="button"
          className="ex-operator-hotspot"
          aria-label="Operator menu hotspot"
          onPointerDown={() => {
            window.clearTimeout(operatorPressTimerRef.current);
            operatorPressTimerRef.current = window.setTimeout(() => {
              setOperatorMenuOpen(true);
              recordDemoEvent("operator_menu_opened");
            }, 1400);
          }}
          onPointerUp={() =>
            window.clearTimeout(operatorPressTimerRef.current)
          }
          onPointerLeave={() =>
            window.clearTimeout(operatorPressTimerRef.current)
          }
        />
      )}
      {!officialDemo && (repositorySnapshot.fallback || import.meta.env.DEV) && (
        <HistoricalDataStatus
          language={language}
          activeRepository={repositorySnapshot.activeRepository}
          fallbackReason={
            repositorySnapshot.fallback ? "FALLBACK_ACTIVATED" : null
          }
          onRetry={repositorySnapshot.retry}
        />
      )}
      <section className="ex-stage">
        {!cleanHistorical && officialDemo &&
          getGeometriesAtYear(selectedYear).some(
            (record) => record.verificationStatus === "needs_review"
          ) && (
            <div className="ex-official-demo-warning" role="status">
              {language === "en"
                ? "Educational reconstruction — scientific review remains required."
                : language === "kk"
                  ? "Оқу реконструкциясы — ғылыми тексеру әлі қажет."
                  : "Образовательная реконструкция — требуется научная проверка."}
            </div>
          )}
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
            activeLayers={storyStep?.activeLayers || null}
            officialDemo={officialDemo}
            performanceDegraded={performanceDegraded}
            cameraOverride={routeCamera || storyStep?.camera || null}
            selectedEntityId={selectedEntity?.id || null}
            {...{
              layerState: effectiveLayerState,
              p1bData,
              selectedRouteId,
              selectedPlaceId,
              archiveMap: selectedArchiveMap,
              archiveOverlayEnabled:
                effectiveLayerState.archiveMaps && archiveOverlayEnabled,
              archiveOpacity,
              archiveAboveReconstruction,
              forceFallback: forceSvgFallback,
            }}
            onSelectEntity={selectEntity}
            onSelectRoute={(routeId) => openRoute(routeId)}
            onSelectPlace={(placeId) => openPlace(placeId)}
          />
        </Suspense>
        <Suspense fallback={null}>
          <ExhibitionAtmosphere
            enabled={effectiveLayerState.atmosphere}
            eraId={selectedEraId}
            year={selectedYear}
            quality={effectiveQuality}
            reducedMotion={reducedMotion}
            onAnimationState={setAtmosphereAnimating}
          />
        </Suspense>
        {!cleanHistorical && <div className="ex-stage__wash" />}
        {environmentScreenReaderText && (
          <div className="sr-only" aria-live="polite">
            {environmentScreenReaderText}
          </div>
        )}
        {!cleanHistorical && comparison && (
          <HistoricalChangeLegend
            language={language}
            mode={comparison.mode || "overlay"}
            compact
          />
        )}
        {!cleanHistorical && currentAvailableChange && !storyId && (
          <button
            type="button"
            className="ex-change-button"
            onClick={() => openHistoricalChange(currentAvailableChange)}
          >
            ? {language === "en"
              ? "Why did the map change?"
              : language === "kk"
                ? "Карта неге өзгерді?"
                : "Почему изменилась карта?"}
          </button>
        )}
        {!cleanHistorical && scientificReviewEnabled && !storyId && (
          <button
            type="button"
            className="ex-scientific-review-button"
            aria-label="Research audit"
            onClick={() => showPanel("scientific")}
          >
            ◉ Scientific review
          </button>
        )}
        {!cleanHistorical && effectiveLayerState.tradeRoutes &&
          p1bData?.historicalRoutes?.[0] &&
          !storyId && (
            <button
              type="button"
              className="ex-route-button"
              onClick={() => openRoute(p1bData.historicalRoutes[0].id)}
            >
              ⇢ {language === "en"
                ? "Silk Road"
                : language === "kk"
                  ? "Ұлы Жібек жолы"
                  : "Великий Шёлковый путь"}
            </button>
          )}
        {cleanHistorical && selectedEntity && (
          <aside className="ex-clean-selection">
            <span className="ex-kicker">
              {language === "en"
                ? "Selected historical state"
                : language === "kk"
                  ? "Таңдалған тарихи мемлекет"
                  : "Выбранное историческое государство"}
            </span>
            <h2>{selectedEntity.names?.[language] || selectedEntity.names?.ru}</h2>
            <p>
              {selectedEntity.descriptions?.[language] ||
                selectedEntity.descriptions?.ru}
            </p>
          </aside>
        )}
        {!cleanHistorical && <ExhibitionStoryPanel
          state={displayedSnapshot}
          {...{ language, text, tour }}
          onPrevious={() =>
            handleYearChange(timelineStates[Math.max(0, tour.index - 1)].year)
          }
          onNext={() => {
            if (tour.index >= timelineStates.length - 1) {
              setTour((current) => ({ ...current, active: false, playing: false }));
            } else {
              handleYearChange(timelineStates[tour.index + 1].year);
            }
          }}
          onReplay={() => handleYearChange(selectedYear)}
          onExit={() =>
            setTour((current) => ({ ...current, active: false, playing: false }))
          }
          onEntity={() => selectedEntity && showPanel("entity")}
          onSources={() => openSources()}
        />}
        {!cleanHistorical && (
          <div className="ex-disclaimer ex-disclaimer--map">ⓘ {text.disclaimer}</div>
        )}
        {!cleanHistorical && geographyUnavailable && (
          <div className="ex-geography-unavailable" role="status">
            {language === "en"
              ? "No verified geographic snapshot is available for the selected period."
              : language === "kk"
                ? "Таңдалған кезең үшін расталған географиялық кескін жоқ."
                : "Для выбранного периода отсутствует подтверждённый географический срез."}
          </div>
        )}
      </section>

      {storyId && (
        <Suspense fallback={<div className="ex-story-loading" role="status"><i /></div>}>
          <HistoricalStoryPlayer
            {...{ storyId, language, reducedMotion }}
            story={repositoryStory?.id === storyId ? repositoryStory : null}
            officialDemo={officialDemo}
            onStepChange={handleStoryStepChange}
            onExit={() => {
              setStoryId(null);
              setStoryStep(null);
              setComparison((current) =>
                current?.storyControlled ? null : current
              );
            }}
            onOpenEntity={(entityId) => selectEntity(entityId)}
            onOpenSources={openSources}
            onOpenComparison={({ fromYear, toYear }) =>
              openComparison(fromYear, toYear)
            }
            onShowChange={openHistoricalChange}
          />
        </Suspense>
      )}
      {routeJourneyActive && selectedRoute && selectedRoutePlaces.length > 0 && (
        <Suspense fallback={<div className="ex-story-loading" role="status"><i /></div>}>
          <RouteJourneyPlayer
            route={selectedRoute}
            stops={selectedRoutePlaces}
            selectedYear={selectedYear}
            language={language}
            quality={effectiveQuality}
            reducedMotion={reducedMotion}
            onStopChange={handleRouteStopChange}
            onOpenPlace={(place) => openPlace(place.id)}
            onOpenSources={openSources}
            onClose={() => {
              setRouteJourneyActive(false);
              setRouteCamera(null);
            }}
            officialDemo={officialDemo}
            onDegradedMode={(guard) => {
              setPerformanceDegraded(true);
              if (guard.disableAtmosphere) toggleLayer("atmosphere", false);
            }}
          />
        </Suspense>
      )}

      <div className="ex-time-dock">
        <ExhibitionEraSelector
          eras={historicalEras}
          {...{ selectedEraId, language, text }}
          onSelect={handleEraChange}
        />
        <ExhibitionYearSlider
          {...{ selectedYear, language, text, activeEra }}
          onChange={handleYearChange}
          playing={tour.playing}
          onTogglePlay={() =>
            setTour((current) => ({ ...current, playing: !current.playing }))
          }
          playbackStep={speed}
          onPlaybackStepChange={setSpeed}
        />
        {cleanHistorical ? (
          <button
            type="button"
            className="ex-clean-play"
            onClick={() =>
              setTour((current) => ({ ...current, playing: !current.playing }))
            }
            aria-label={tour.playing ? text.pause : text.play}
          >
            <span aria-hidden="true">{tour.playing ? "Ⅱ" : "▶"}</span>
            {tour.playing ? text.pause : text.play}
          </button>
        ) : (
          <ExhibitionTimeline
            {...{ text, speed }}
            playing={tour.playing}
            onTogglePlay={() =>
              setTour((current) => ({ ...current, playing: !current.playing }))
            }
            onSpeed={setSpeed}
          />
        )}
      </div>

      {panel.type && (
        <div
          ref={panelBackdropRef}
          className={`ex-panel-backdrop ex-panel-backdrop--${panel.mode}`}
          role="dialog"
          aria-modal={panel.mode === "expanded"}
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
                openComparison(1465, 1511);
              }}
              onLesson={() => showPanel("lesson")}
              onSources={() => openSources(selectedEntity?.sourceIds || null)}
              onEvidence={() => openEvidence("entity", selectedEntity?.id)}
            />
          )}
          {panel.type === "sources" && (
            <ExhibitionSourcePanel
              sources={sourcesForCurrent.length ? sourcesForCurrent : historicalSources}
              {...{ language, text }}
              onClose={() => {
                setSourceContextIds(null);
                hidePanel();
              }}
              onCitation={openCitation}
            />
          )}
          {panel.type === "compare" && (
            <ExhibitionComparePanel
              comparison={comparison || { firstYear: 1465, secondYear: 1511, mode: "overlay" }}
              change={comparisonChange}
              {...{ language, text }}
              onChange={setComparison}
              onGeometryResult={handleGeometryResult}
              onClose={() => {
                hidePanel();
                setComparison(null);
              }}
            />
          )}
          {panel.type === "change" && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <HistoricalChangePanel
                change={activeChange}
                focusSection={activeChangeSection}
                mode={panel.mode}
                {...{ language, text }}
                onClose={hidePanel}
                onSources={openSources}
                onComparison={(change) =>
                  openComparison(
                    change.displayFromYear,
                    change.displayToYear,
                    "overlay"
                  )
                }
                onPerson={(person) => {
                  setSelectedReference({ type: "person", id: person.id });
                  showPanel("reference");
                }}
                onEvent={(event) => {
                  setSelectedReference({ type: "event", id: event.id });
                  showPanel("reference");
                }}
                onEvidence={() =>
                  openEvidence("historical_change", activeChange?.id)
                }
              />
            </Suspense>
          )}
          {panel.type === "layers" && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <ExhibitionLayerPanel
                language={language}
                text={text}
                state={effectiveLayerState}
                quality={effectiveQuality}
                onToggle={toggleLayer}
                preset={historicalMapPreset}
                onPreset={changeHistoricalMapPreset}
                onReset={() => {
                  setHistoricalMapPreset(DEFAULT_HISTORICAL_MAP_PRESET);
                  setLayerState(
                    applyHistoricalMapPreset(
                      resetLayerState(effectiveQuality),
                      DEFAULT_HISTORICAL_MAP_PRESET,
                      effectiveQuality
                    )
                  );
                }}
                onOpenArchive={openArchiveMaps}
                dataStatus={{
                  activeRepository: repositorySnapshot.activeRepository,
                  fallbackReason: repositorySnapshot.fallback
                    ? "FALLBACK_ACTIVATED"
                    : null,
                }}
                onRetryData={repositorySnapshot.retry}
                onClose={hidePanel}
              />
            </Suspense>
          )}
          {panel.type === "scientific" && scientificReviewEnabled && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <ScientificReviewPanel
                year={selectedYear}
                records={getGeometriesAtYear(selectedYear)}
                claims={p1cData?.sourceClaims || []}
                language={language}
                onEvidence={openEvidence}
                onClose={hidePanel}
              />
            </Suspense>
          )}
          {panel.type === "archive" && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <ArchiveMapPanel
                maps={p1cData?.archiveMaps || []}
                selectedMapId={selectedArchiveMapId}
                opacity={archiveOpacity}
                overlayEnabled={archiveOverlayEnabled}
                aboveReconstruction={archiveAboveReconstruction}
                language={language}
                text={text}
                onSelect={selectArchiveMap}
                onToggleOverlay={(enabled) => {
                  setArchiveOverlayEnabled(enabled);
                  recordExhibitionMetric(
                    enabled ? "archive_overlay_enabled" : "archive_overlay_disabled",
                    1,
                    { archiveMapId: selectedArchiveMapId }
                  );
                }}
                onOpacity={(value) => {
                  setArchiveOpacity(value);
                  recordExhibitionMetric("archive_opacity_changed", Math.round(value * 100), {
                    archiveMapId: selectedArchiveMapId,
                  });
                }}
                onOrder={setArchiveAboveReconstruction}
                onCompare={() => selectedArchiveMap && openArchiveComparison(selectedArchiveMap)}
                onSource={openSources}
                onReset={() => {
                  setArchiveOverlayEnabled(false);
                  setSelectedArchiveMapId(null);
                  setArchiveOpacity(0.65);
                }}
                onClose={hidePanel}
              />
            </Suspense>
          )}
          {panel.type === "archiveCompare" && selectedArchiveMap && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <ArchiveMapCompare
                archiveMap={selectedArchiveMap}
                language={language}
                text={text}
                reducedMotion={reducedMotion}
                onClose={hidePanel}
              />
            </Suspense>
          )}
          {panel.type === "evidence" && evidenceTarget && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <EvidencePanel
                subjectType={evidenceTarget.subjectType}
                subjectId={evidenceTarget.subjectId}
                claims={p1cData?.sourceClaims || []}
                sources={historicalSources}
                archiveMaps={p1cData?.archiveMaps || []}
                disputes={p1cData?.sourceDisputes || []}
                language={language}
                text={text}
                onSource={openSources}
                onArchive={(archiveMap) => {
                  selectArchiveMap(archiveMap);
                  showPanel("archive");
                }}
                onCitation={openCitation}
                onReview={openReviewQueue}
                onClose={hidePanel}
              />
            </Suspense>
          )}
          {panel.type === "citation" && citationSource && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <CitationExportPanel
                source={citationSource}
                language={language}
                text={text}
                onClose={hidePanel}
              />
            </Suspense>
          )}
          {panel.type === "review" && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <ReviewQueuePanel
                queue={reviewQueue}
                initialReviews={localReviews}
                language={language}
                text={text}
                onReviews={setLocalReviews}
                onClose={hidePanel}
              />
            </Suspense>
          )}
          {panel.type === "route" && selectedRoute && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <ExhibitionRoutePanel
                route={selectedRoute}
                places={selectedRoutePlaces}
                year={selectedYear}
                language={language}
                text={text}
                onClose={hidePanel}
                onShowAll={() => {
                  setRouteCamera({ center: [68.5, 43], zoom: 4.7, pitch: 12, bearing: 0 });
                  hidePanel();
                }}
                onJourney={() => {
                  setRouteJourneyActive(true);
                  hidePanel();
                }}
                onStory={() => startHistoricalStory("silk-road-geography")}
                onPlace={(place) => openPlace(place.id)}
                onSources={openSources}
                onEvidence={() => openEvidence("route", selectedRoute.id)}
                onHide={() => {
                  toggleLayer("tradeRoutes", false);
                  setSelectedRouteId(null);
                  hidePanel();
                }}
              />
            </Suspense>
          )}
          {panel.type === "geography" && (selectedHistoricalPlace || selectedRoute) && (
            <Suspense fallback={<div className="ex-panel ex-panel-loading"><i /></div>}>
              <HistoricalGeographyPanel
                subject={selectedHistoricalPlace}
                route={selectedRoute}
                year={selectedYear}
                language={language}
                text={text}
                onSources={openSources}
                onEvidence={() =>
                  openEvidence(
                    selectedHistoricalPlace ? "place" : "route",
                    selectedHistoricalPlace?.id || selectedRoute?.id
                  )
                }
                onClose={hidePanel}
              />
            </Suspense>
          )}
          {["route", "geography"].includes(panel.type) &&
            !selectedRoute &&
            !selectedHistoricalPlace && (
              <div className="ex-panel ex-panel-loading" role="status"><i /></div>
            )}
          {panel.type === "reference" && referenceItem && (
            <section className="ex-panel ex-reference-panel">
              <header className="ex-panel__header">
                <div>
                  <span className="ex-kicker">
                    {selectedReference.type === "person"
                      ? language === "en" ? "Person" : language === "kk" ? "Тұлға" : "Личность"
                      : language === "en" ? "Event" : language === "kk" ? "Оқиға" : "Событие"}
                  </span>
                  <h2>
                    {(referenceItem.names || referenceItem.titles)?.[language] ||
                      (referenceItem.names || referenceItem.titles)?.ru}
                  </h2>
                </div>
                <button className="ex-icon-button" onClick={hidePanel} aria-label={text.close}>×</button>
              </header>
              <p className="ex-panel__lead">
                {referenceItem.descriptions?.[language] ||
                  referenceItem.descriptions?.ru}
              </p>
              <button
                className="ex-source-link"
                onClick={() => openSources(referenceItem.sourceIds)}
              >
                ▤ {text.sources}
              </button>
              <button
                className="ex-source-link"
                onClick={() =>
                  openEvidence(selectedReference.type, referenceItem.id)
                }
              >
                ◇ {language === "en" ? "Show evidence" : language === "kk" ? "Дәлелдерді көрсету" : "Показать доказательства"}
              </button>
            </section>
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
      {changePrompt && (
        <div
          className={`ex-change-prompt ${reducedMotion ? "is-reduced-motion" : ""}`}
          role="status"
        >
          <div>
            <strong>
              {language === "en"
                ? "The map changed"
                : language === "kk"
                  ? "Карта өзгерді"
                  : "Карта изменилась"}
            </strong>
            <span>
              {changePrompt.change.displayFromYear} → {changePrompt.change.displayToYear}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              openHistoricalChange(changePrompt.change);
              setChangePrompt(null);
            }}
          >
            {language === "en"
              ? "View explanation"
              : language === "kk"
                ? "Түсіндірмені көру"
                : "Посмотреть объяснение"}
          </button>
          <button
            type="button"
            className="ex-icon-button"
            onClick={() => setChangePrompt(null)}
            aria-label={text.close}
          >
            ×
          </button>
        </div>
      )}
      <div className="sr-only" aria-live="polite">
        {selectedYear}: {activeSnapshot.title[language] || activeSnapshot.title.ru}
      </div>
      <ExhibitionOperatorMenu
        open={operatorMenuOpen}
        language={language}
        quality={qualityMode}
        forceSvg={forceSvgFallback}
        health={demoHealth}
        onClose={() => setOperatorMenuOpen(false)}
        onStory={() => {
          setOperatorMenuOpen(false);
          startHistoricalStory(EXHIBITION_RELEASE.officialDemoStoryId);
        }}
        onPause={() => {
          setTour((current) => ({ ...current, playing: false }));
          setRouteJourneyActive(false);
          setAtmosphereAnimating(false);
        }}
        onReset={reset}
        onLanguage={setLanguage}
        onQuality={setQualityMode}
        onForceSvg={(value) => {
          setForceSvgFallback(value);
          if (value) recordDemoEvent("svg_fallback_activated");
        }}
        onThreeD={() => {
          setOperatorMenuOpen(false);
          showPanel("3d");
        }}
        onHealth={async () => setDemoHealth(await runDemoHealthCheck())}
        onRecovery={() => {
          setOperatorMenuOpen(false);
          onOpenRecovery?.();
        }}
      />
    </main>
  );
}
