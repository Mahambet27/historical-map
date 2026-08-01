export const createRouteJourneySession = () => ({
  index: 0,
  playing: false,
  speed: 1,
  progress: 0,
  completed: false,
});

export const routeJourneyReducer = (state, action) => {
  switch (action.type) {
    case "START":
    case "RESUME":
      return { ...state, playing: true, completed: false };
    case "PAUSE":
      return { ...state, playing: false };
    case "STOP":
      return createRouteJourneySession();
    case "SPEED":
      return { ...state, speed: action.speed };
    case "PROGRESS":
      return { ...state, progress: Math.max(0, Math.min(1, action.progress)) };
    case "NEXT":
      return {
        ...state,
        index: Math.min(action.lastIndex, state.index + 1),
        progress: 0,
      };
    case "PREVIOUS":
      return {
        ...state,
        index: Math.max(0, state.index - 1),
        progress: 0,
        completed: false,
      };
    case "COMPLETE":
      return { ...state, playing: false, progress: 1, completed: true };
    default:
      return state;
  }
};

export const shouldAnimateJourney = ({
  quality,
  reducedMotion,
  hidden,
}) => quality !== "light" && !reducedMotion && !hidden;

export const scheduleJourneyFrame = ({
  callback,
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
}) => {
  const frame = requestFrame(callback);
  return () => cancelFrame(frame);
};

export const scheduleJourneyStep = ({
  callback,
  delay,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) => {
  const timer = setTimer(callback, delay);
  return () => clearTimer(timer);
};

export const shouldPauseJourneyForVisibility = (hidden) => Boolean(hidden);

