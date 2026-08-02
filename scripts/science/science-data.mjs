import { allHistoricalEntities } from "../../src/data/exhibition/entities.js";
import { entityGeometries } from "../../src/data/exhibition/entityGeometries.js";
import { entityLabels } from "../../src/data/exhibition/entityLabels.js";
import { historicalEvents } from "../../src/data/exhibition/events.js";
import { historicalPeople } from "../../src/data/exhibition/people.js";
import { historicalSettlements } from "../../src/data/exhibition/historicalSettlements.js";
import { historicalRoutes } from "../../src/data/exhibition/historicalRoutes.js";
import { routeSegments } from "../../src/data/exhibition/routeSegments.js";
import { environmentSnapshots } from "../../src/data/exhibition/environmentSnapshots.js";
import { hydrologySnapshots } from "../../src/data/exhibition/hydrologySnapshots.js";
import { historicalRiverSnapshots } from "../../src/data/exhibition/historicalRiverSnapshots.js";
import { archiveMaps } from "../../src/data/exhibition/archiveMaps.js";
import { sourceClaims } from "../../src/data/exhibition/sourceClaims.js";
import { sourceDisputes } from "../../src/data/exhibition/sourceDisputes.js";
import { historicalSources } from "../../src/data/exhibition/sources.js";
import { historicalChanges } from "../../src/data/exhibition/historicalChanges.js";
import {
  historicalStories,
  storyQuestions,
} from "../../src/data/exhibition/stories.js";

export const scienceDatasets = Object.freeze({
  entities: allHistoricalEntities,
  geometries: entityGeometries,
  labels: entityLabels,
  events: historicalEvents,
  people: historicalPeople,
  places: historicalSettlements,
  routes: historicalRoutes,
  routeSegments,
  environment: environmentSnapshots,
  hydrology: hydrologySnapshots,
  rivers: historicalRiverSnapshots,
  archiveMaps,
  claims: sourceClaims,
  disputes: sourceDisputes,
  sources: historicalSources,
  historicalChanges,
  stories: historicalStories,
  questions: storyQuestions,
});

export const allScienceRecords = () =>
  Object.entries(scienceDatasets).flatMap(([recordType, records]) =>
    records.map((record) => ({ recordType, record }))
  );

export const sourceIdsFor = (record) =>
  record?.sourceIds || (record?.sourceId ? [record.sourceId] : []);

export const localizedName = (record, language = "ru") => {
  const value =
    record?.names ||
    record?.titles ||
    record?.labels ||
    record?.prompts ||
    record?.name;
  if (Array.isArray(value)) {
    return (
      value.find((entry) => entry.language === language)?.value ||
      value.find((entry) => entry.language === "ru")?.value ||
      record.id
    );
  }
  return value?.[language] || value?.ru || String(value || record?.id || "");
};

