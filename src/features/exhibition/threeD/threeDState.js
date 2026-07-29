export const THREE_D_STATES = [
  "idle",
  "loading-viewer",
  "loading-model",
  "ready",
  "error",
  "timeout",
];

export const initialThreeDState = {
  status: "idle",
  error: null,
  startedAt: 0,
};

export const threeDReducer = (state, action) => {
  switch (action.type) {
    case "START":
      return { status: "loading-viewer", error: null, startedAt: action.startedAt || 0 };
    case "VIEWER_READY":
      return { ...state, status: "loading-model" };
    case "MODEL_READY":
      return { ...state, status: "ready", error: null };
    case "ERROR":
      return {
        ...state,
        status: "error",
        error: action.error?.message || String(action.error || "3D model unavailable"),
      };
    case "TIMEOUT":
      return { ...state, status: "timeout", error: "3D loading timed out" };
    case "RETRY":
      return initialThreeDState;
    default:
      return state;
  }
};

export const shouldAutoLoadThreeD = ({ effectiveQuality, saveData = false } = {}) =>
  effectiveQuality === "high" && !saveData;
