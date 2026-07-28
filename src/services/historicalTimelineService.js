import { timelineStates, getTimelineStateAtYear } from "../data/exhibition/timeline.js";

const isValidState = (state) =>
  Boolean(
    state?.id &&
      Number.isFinite(state.year) &&
      state.title?.ru &&
      Array.isArray(state.camera?.center) &&
      state.camera.center.length === 2
  );

export const getHistoricalTimeline = async () => timelineStates.filter(isValidState);

export { getTimelineStateAtYear };

export const formatHistoricalYear = (year, language = "ru") => {
  const absolute = Math.abs(year);
  if (year < 0) {
    if (language === "kk") return `б.з.д. ${absolute} ж.`;
    if (language === "en") return `${absolute} BCE`;
    return `${absolute} г. до н. э.`;
  }
  if (language === "kk") return `${absolute} ж.`;
  if (language === "en") return `${absolute} CE`;
  return `${absolute} г.`;
};
