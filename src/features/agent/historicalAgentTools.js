import { AGENT_ACTIONS } from "./agentTypes.js";

export const getMapAtYear = (year) => ({ type: AGENT_ACTIONS.SET_YEAR, payload: { year } });
export const compareYears = (firstYear, secondYear) => ({ type: AGENT_ACTIONS.COMPARE, payload: { firstYear, secondYear } });
export const selectHistoricalEntity = (entityId) => ({ type: AGENT_ACTIONS.SELECT_ENTITY, payload: { entityId } });
export const showHistoricalEvent = (eventId) => ({ type: AGENT_ACTIONS.SHOW_EVENT, payload: { eventId } });
export const showHistoricalPerson = (personId) => ({ type: AGENT_ACTIONS.SHOW_PERSON, payload: { personId } });
export const showSources = (targetType, targetId) => ({ type: AGENT_ACTIONS.SHOW_SOURCES, payload: { targetType, targetId } });
export const startLesson = (lessonId) => ({ type: AGENT_ACTIONS.START_LESSON, payload: { lessonId } });
export const startQuiz = (quizId) => ({ type: AGENT_ACTIONS.START_LESSON, payload: { lessonId: quizId } });
export const showHistoricalChange = (changeId, section = null) => ({
  type: AGENT_ACTIONS.SHOW_CHANGE,
  payload: { changeId, section },
});
export const startHistoricalStory = (storyId) => ({
  type: AGENT_ACTIONS.START_STORY,
  payload: { storyId },
});
export const openHistoricalComparison = (firstYear, secondYear, mode = "overlay") => ({
  type: AGENT_ACTIONS.OPEN_COMPARISON,
  payload: { firstYear, secondYear, mode },
});
export const toggleExhibitionLayer = (layerId, enabled) => ({
  type: AGENT_ACTIONS.TOGGLE_LAYER,
  payload: { layerId, enabled },
});
export const selectHistoricalRoute = (routeId) => ({
  type: AGENT_ACTIONS.SELECT_ROUTE,
  payload: { routeId },
});
export const startRouteJourney = (routeId) => ({
  type: AGENT_ACTIONS.START_ROUTE_JOURNEY,
  payload: { routeId },
});
export const selectHistoricalPlace = (placeId) => ({
  type: AGENT_ACTIONS.SELECT_PLACE,
  payload: { placeId },
});
export const showHistoricalGeography = (targetType, targetId) => ({
  type: AGENT_ACTIONS.SHOW_GEOGRAPHY,
  payload: { targetType, targetId },
});
export const startGeographyStory = (storyId = "silk-road-geography") => ({
  type: AGENT_ACTIONS.START_GEOGRAPHY_STORY,
  payload: { storyId },
});
export const showEvidence = (subjectType, subjectId) => ({
  type: AGENT_ACTIONS.SHOW_EVIDENCE,
  payload: { subjectType, subjectId },
});
export const showArchiveMaps = () => ({
  type: AGENT_ACTIONS.SHOW_ARCHIVE_MAPS,
  payload: {},
});
export const selectArchiveMap = (archiveMapId) => ({
  type: AGENT_ACTIONS.SELECT_ARCHIVE_MAP,
  payload: { archiveMapId },
});
export const startArchiveComparison = (archiveMapId) => ({
  type: AGENT_ACTIONS.START_ARCHIVE_COMPARISON,
  payload: { archiveMapId },
});
export const showReviewQueue = () => ({
  type: AGENT_ACTIONS.SHOW_REVIEW_QUEUE,
  payload: {},
});
export const showDispute = (disputeId) => ({
  type: AGENT_ACTIONS.SHOW_DISPUTE,
  payload: { disputeId },
});
export const startEvidenceStory = () => ({
  type: AGENT_ACTIONS.START_EVIDENCE_STORY,
  payload: { storyId: "historical-evidence" },
});
export const exportCitation = (sourceId) => ({
  type: AGENT_ACTIONS.EXPORT_CITATION,
  payload: { sourceId },
});
export const resetExhibition = () => ({ type: AGENT_ACTIONS.RESET, payload: {} });
