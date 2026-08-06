import {
  timelineStates,
  getTimelineStateAtYear,
} from "../data/exhibition/timeline.js";
import { formatHistoricalYear } from "../features/exhibition/timeline/historicalYear.js";

const isValidState = (state) =>
  Boolean(
    state?.id &&
      Number.isFinite(state.year) &&
      state.title?.ru &&
      Array.isArray(state.camera?.center) &&
      state.camera.center.length === 2
  );

export const getHistoricalTimeline = async () =>
  timelineStates.filter(isValidState);

export { getTimelineStateAtYear, formatHistoricalYear };
