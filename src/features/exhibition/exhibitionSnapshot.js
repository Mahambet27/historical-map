import { buildHistoricalSnapshot } from "../../domain/history/buildHistoricalSnapshot.js";
import { LOCAL_DATASET_VERSION } from "../../dataAccess/datasetVersion.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { entityGeometries } from "../../data/exhibition/entityGeometries.js";
import { entityLabels } from "../../data/exhibition/entityLabels.js";
import { eraRegistry } from "../../data/exhibition/eraRegistry.js";
import { historicalEvents } from "../../data/exhibition/events.js";
import { historicalPeople } from "../../data/exhibition/people.js";
import {
  buildEnvironmentCollection,
  buildHistoricalPlaceCollections,
  buildHydrologyCollection,
  buildRouteCollections,
} from "./p1bMapDataUtils.js";
import { isRecordAllowedInOfficialDemo } from "./officialDemoMode.js";

/** Existing fallback sources, collected at the feature/domain boundary. */
export const buildExhibitionSnapshot = (year, p1bData) => buildHistoricalSnapshot({
  year,
  datasetVersion: LOCAL_DATASET_VERSION,
  metadata: { source: "exhibition-fallback", supplementalData: p1bData ? "provided" : "absent" },
  data: {
    eras: eraRegistry,
    entities: allHistoricalEntities,
    territories: entityGeometries,
    // The existing SVG strokes these same polygon rings as its borders.
    borders: entityGeometries,
    labels: entityLabels,
    events: historicalEvents,
    people: historicalPeople,
    places: p1bData?.historicalSettlements,
    environment: p1bData?.environmentSnapshots,
    hydrology: p1bData?.hydrologySnapshots,
    routes: p1bData?.historicalRoutes,
    routeSegments: p1bData?.routeSegments,
  },
});

export const snapshotTerritories = (snapshot) => {
  const entityById = new Map(snapshot.entities.map((entity) => [entity.id, entity]));
  return snapshot.territories
    .map((geometry) => ({ geometry, entity: entityById.get(geometry.entityId) }))
    .filter((entry) => entry.entity);
};

/** Presentation only: preserve the existing SVG order, names and GeoJSON shape. */
export const createFallbackViewModel = (snapshot, { language, selectedEntityId, officialDemo = false }) => ({
  territories: snapshotTerritories(snapshot)
    .filter(({ geometry }) => !officialDemo || isRecordAllowedInOfficialDemo(geometry))
    .sort((a, b) => Number(a.entity.id === selectedEntityId) - Number(b.entity.id === selectedEntityId)),
  labels: snapshot.labels,
  entityById: new Map(snapshot.entities.map((entity) => [entity.id, entity])),
  environment: buildEnvironmentCollection(snapshot.environment, snapshot.year, language),
  hydrology: buildHydrologyCollection(snapshot.hydrology, snapshot.year, language),
  places: buildHistoricalPlaceCollections(snapshot.places, snapshot.year, language),
  routes: buildRouteCollections(snapshot.routes, snapshot.routeSegments, snapshot.year, language),
});
