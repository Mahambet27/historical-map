import {
  historicalStoryById,
  storyQuestionById,
} from "../../../data/exhibition/stories.js";

export const getHistoricalStory = (storyId) =>
  historicalStoryById.get(storyId) || null;

export const getStoryQuestion = (questionId) =>
  storyQuestionById.get(questionId) || null;

export const isLocalized = (value) =>
  Boolean(value?.ru && value?.kk && value?.en);

export const validateHistoricalStory = (story) =>
  Boolean(
    story?.id &&
      isLocalized(story.titles) &&
      Array.isArray(story.steps) &&
      story.steps.length > 0 &&
      story.steps.every(
        (step) =>
          step.id &&
          Number.isFinite(step.year) &&
          isLocalized(step.titles) &&
          isLocalized(step.narration) &&
          isLocalized(step.simpleNarration) &&
          Array.isArray(step.sourceIds)
      )
  );

export const createStorySession = () => ({
  index: 0,
  playing: false,
  speed: 1,
  simple: false,
  subtitles: true,
  sourceMode: false,
  answers: {},
  completed: false,
});

export const historicalStoryReducer = (state, action) => {
  switch (action.type) {
    case "PLAY":
      return { ...state, playing: true, completed: false };
    case "PAUSE":
      return { ...state, playing: false };
    case "NEXT":
      return {
        ...state,
        index: Math.min(action.lastIndex, state.index + 1),
        sourceMode: false,
      };
    case "PREVIOUS":
      return {
        ...state,
        index: Math.max(0, state.index - 1),
        sourceMode: false,
        completed: false,
      };
    case "GOTO":
      return {
        ...state,
        index: Math.max(0, Math.min(action.lastIndex, action.index)),
        sourceMode: false,
      };
    case "REPLAY":
      return { ...state, playing: false };
    case "SPEED":
      return { ...state, speed: action.speed };
    case "TOGGLE_SIMPLE":
      return { ...state, simple: !state.simple };
    case "TOGGLE_SUBTITLES":
      return { ...state, subtitles: !state.subtitles };
    case "TOGGLE_SOURCES":
      return { ...state, sourceMode: !state.sourceMode };
    case "ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: {
            optionId: action.optionId,
            correct: action.correct,
          },
        },
      };
    case "COMPLETE":
      return { ...state, playing: false, completed: true };
    case "RETRY_QUESTIONS":
      return { ...state, answers: {}, completed: false, index: 0 };
    default:
      return state;
  }
};

export const getStoryStepDelay = (step, speed = 1) =>
  Math.max(1000, Math.round((step?.durationMs || 10_000) / speed));

export const scheduleStoryAdvance = ({
  callback,
  delay,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) => {
  const timer = setTimer(callback, delay);
  return () => clearTimer(timer);
};

export const shouldPauseStoryForVisibility = (hidden) => Boolean(hidden);

export const getStoryScore = (story, answers) => {
  const questionIds = [...new Set(story.questionIds)];
  const correct = questionIds.filter((id) => answers[id]?.correct).length;
  return { correct, total: questionIds.length };
};

