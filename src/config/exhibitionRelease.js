import { LOCAL_DATASET_VERSION } from "../dataAccess/datasetVersion.js";

export const EXHIBITION_RELEASE = Object.freeze({
  version: "2026.08-stable1",
  previousReleaseVersion: "2026.08-rc1",
  releaseChannel: "exhibition-stable",
  datasetVersion: LOCAL_DATASET_VERSION,
  buildDate: "2026-08-02",
  officialDemoDefaultYear: 1465,
  officialDemoStoryId: "formation-and-consolidation-kazakh-khanate",
  allowedTransitions: [
    [-550, 552],
    [1465, 1511],
    [1936, 1991],
  ],
  allowedStories: [
    "formation-and-consolidation-kazakh-khanate",
    "historical-evidence",
  ],
  allowedRoutes: ["silk-road-southern-kazakhstan"],
  allowedArchiveMaps: ["qhm-evidence-overlay-demo"],
  blockedRecordIds: [
    "nomadic-seasonal-cycle-demo",
    "aral-sea-circa-1960-demo",
    "tian-shan-foothills-medieval-demo",
    "future-institutional-archive-placeholder",
    "demo-geometry-interpretation-structure",
  ],
  scientificWarningCount: 116,
});
