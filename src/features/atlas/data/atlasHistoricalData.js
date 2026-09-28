import { buildHistoricalSnapshot } from "../../../domain/history/buildHistoricalSnapshot.js";
import { LOCAL_DATASET_VERSION } from "../../../dataAccess/datasetVersion.js";
import { historicalSettlements } from "../../../data/exhibition/historicalSettlements.js";
import { eraRegistry } from "../../../data/exhibition/eraRegistry.js";
import { historicalSources } from "../../../data/exhibition/sources.js";
import { entityGeometries } from "../../../data/exhibition/entityGeometries.js";
import { allHistoricalEntities } from "../../../data/exhibition/entities.js";

// Local source boundary: no copied records and no changes to the domain contract.
export const atlasSourceData = {
  places: historicalSettlements,
  eras: eraRegistry,
  territories: entityGeometries,
  borders: entityGeometries,
  entities: allHistoricalEntities,
};
export const atlasEras = eraRegistry.map((era) => ({
  ...era,
  name: era.names,
  year: era.defaultYear,
}));
export const buildAtlasHistoricalSnapshot = (year) =>
  buildHistoricalSnapshot({
    year,
    datasetVersion: LOCAL_DATASET_VERSION,
    data: atlasSourceData,
    metadata: { source: "local-historical-settlements", sources: historicalSources },
  });
