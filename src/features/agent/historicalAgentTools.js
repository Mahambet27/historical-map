import { AGENT_ACTIONS } from "./agentTypes.js";

export const getMapAtYear = (year) => ({ type: AGENT_ACTIONS.SET_YEAR, payload: { year } });
export const compareYears = (firstYear, secondYear) => ({ type: AGENT_ACTIONS.COMPARE, payload: { firstYear, secondYear } });
export const selectHistoricalEntity = (entityId) => ({ type: AGENT_ACTIONS.SELECT_ENTITY, payload: { entityId } });
export const showHistoricalEvent = (eventId) => ({ type: AGENT_ACTIONS.SHOW_EVENT, payload: { eventId } });
export const showHistoricalPerson = (personId) => ({ type: AGENT_ACTIONS.SHOW_PERSON, payload: { personId } });
export const showSources = (targetType, targetId) => ({ type: AGENT_ACTIONS.SHOW_SOURCES, payload: { targetType, targetId } });
export const startLesson = (lessonId) => ({ type: AGENT_ACTIONS.START_LESSON, payload: { lessonId } });
export const startQuiz = (quizId) => ({ type: AGENT_ACTIONS.START_LESSON, payload: { lessonId: quizId } });
export const resetExhibition = () => ({ type: AGENT_ACTIONS.RESET, payload: {} });
