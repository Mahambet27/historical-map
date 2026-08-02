import { EXHIBITION_RELEASE } from "../../config/exhibitionRelease.js";
import {
  canUseInOfficialDemo,
  getScientificReadiness,
} from "./scientificReadiness.js";

export const isOfficialDemoRequested = (search = window.location.search) =>
  new URLSearchParams(search).get("officialDemo") === "true";

export const isRecordAllowedInOfficialDemo = (
  record,
  { allowDisputed = false } = {}
) => {
  if (!record || EXHIBITION_RELEASE.blockedRecordIds.includes(record.id)) {
    return false;
  }
  const readiness = getScientificReadiness(record);
  if (readiness === "disputed") return allowDisputed;
  return canUseInOfficialDemo(record);
};

export const filterOfficialDemoRecords = (records = [], options) =>
  records.filter((record) => isRecordAllowedInOfficialDemo(record, options));

export const isTransitionAllowedInOfficialDemo = (fromYear, toYear) =>
  EXHIBITION_RELEASE.allowedTransitions.some(
    ([from, to]) => from === fromYear && to === toYear
  );

export const isStoryAllowedInOfficialDemo = (storyId) =>
  EXHIBITION_RELEASE.allowedStories.includes(storyId);

export const filterOfficialStorySteps = (story) => {
  if (!story || !isStoryAllowedInOfficialDemo(story.id)) return [];
  return story.steps.filter((step) => {
    if (step.year === 1521) return false;
    if (
      step.comparison?.firstYear != null &&
      step.comparison?.secondYear != null &&
      !isTransitionAllowedInOfficialDemo(
        step.comparison.firstYear,
        step.comparison.secondYear
      )
    ) {
      return false;
    }
    return ![
      step.selectedRouteId,
      step.archiveMapId,
      ...(step.recordIds || []),
    ]
      .filter(Boolean)
      .some((id) => EXHIBITION_RELEASE.blockedRecordIds.includes(id));
  });
};

