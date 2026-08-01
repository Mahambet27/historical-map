import { LOCAL_DATASET_VERSION } from "../datasetVersion.js";
import {
  normalizeRepositoryOptions,
  PUBLIC_VERIFICATION_STATUSES,
} from "../repositoryTypes.js";

const assertNotAborted = (signal) => {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
};

const activeAtYear = (record, year) =>
  (record.validFromYear == null || record.validFromYear <= year) &&
  (record.validToYear == null || record.validToYear >= year);

const coordinatesOf = (geometry, output = []) => {
  if (
    Array.isArray(geometry) &&
    geometry.length >= 2 &&
    Number.isFinite(geometry[0]) &&
    Number.isFinite(geometry[1])
  ) {
    output.push(geometry);
  } else if (Array.isArray(geometry)) {
    geometry.forEach((item) => coordinatesOf(item, output));
  }
  return output;
};

const intersectsBbox = (geometry, [west, south, east, north]) => {
  const coordinates = coordinatesOf(geometry?.coordinates);
  if (!coordinates.length) return false;
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  return (
    Math.max(...longitudes) >= west &&
    Math.min(...longitudes) <= east &&
    Math.max(...latitudes) >= south &&
    Math.min(...latitudes) <= north
  );
};

const statusAllowed = (record, statuses) =>
  !record.verificationStatus || statuses.includes(record.verificationStatus);

const safeArchiveMap = (map) => {
  if (!["restricted", "unknown"].includes(map.license?.status)) return map;
  return {
    ...map,
    imageUrl: null,
    coordinates: null,
  };
};

export default class LocalHistoricalRepository {
  constructor() {
    this.type = "local";
    this.datasetVersion = LOCAL_DATASET_VERSION;
  }

  async getSnapshot(options = {}) {
    const normalized = normalizeRepositoryOptions(options);
    assertNotAborted(normalized.signal);
    const [
      entitiesModule,
      geometriesModule,
      labelsModule,
      environmentModule,
      hydrologyModule,
      routesModule,
      segmentsModule,
      settlementsModule,
    ] = await Promise.all([
      import("../../data/exhibition/entities.js"),
      import("../../data/exhibition/entityGeometries.js"),
      import("../../data/exhibition/entityLabels.js"),
      import("../../data/exhibition/environmentSnapshots.js"),
      import("../../data/exhibition/hydrologySnapshots.js"),
      import("../../data/exhibition/historicalRoutes.js"),
      import("../../data/exhibition/routeSegments.js"),
      import("../../data/exhibition/historicalSettlements.js"),
    ]);
    assertNotAborted(normalized.signal);
    const geometries = geometriesModule.entityGeometries
      .filter(
        (record) =>
          activeAtYear(record, normalized.year) &&
          statusAllowed(record, normalized.verificationStatuses) &&
          intersectsBbox(record.geojson?.geometry, normalized.bbox)
      )
      .slice(0, normalized.limit);
    const entityIds = new Set(geometries.map((record) => record.entityId));
    const entities = entitiesModule.allHistoricalEntities.filter((record) =>
      entityIds.has(record.id)
    );
    const places = settlementsModule.historicalSettlements
      .filter(
        (record) =>
          activeAtYear(record, normalized.year) &&
          statusAllowed(record, normalized.verificationStatuses) &&
          intersectsBbox(
            { type: "Point", coordinates: record.coordinates },
            normalized.bbox
          )
      )
      .slice(0, normalized.limit);
    const routes = routesModule.historicalRoutes.filter(
      (record) =>
        activeAtYear(record, normalized.year) &&
        statusAllowed(record, normalized.verificationStatuses)
    );
    const routeIds = new Set(routes.map((record) => record.id));
    const routeSegments = segmentsModule.routeSegments.filter(
      (record) =>
        routeIds.has(record.routeId) &&
        activeAtYear(record, normalized.year) &&
        statusAllowed(record, normalized.verificationStatuses)
    );
    const environment = environmentModule.environmentSnapshots.filter(
      (record) =>
        activeAtYear(record, normalized.year) &&
        statusAllowed(record, normalized.verificationStatuses) &&
        intersectsBbox(record.geojson?.geometry, normalized.bbox)
    );
    const hydrology = hydrologyModule.hydrologySnapshots.filter(
      (record) =>
        activeAtYear(record, normalized.year) &&
        statusAllowed(record, normalized.verificationStatuses) &&
        intersectsBbox(record.geometry?.geometry, normalized.bbox)
    );
    return {
      datasetVersion: LOCAL_DATASET_VERSION,
      year: normalized.year,
      language: normalized.language,
      entities,
      geometries,
      places,
      routes: {
        routes,
        segments: routeSegments,
        places,
      },
      environment,
      hydrology,
      labels: labelsModule.getEntityLabelsAtYear(normalized.year),
    };
  }

  async getEntity(id, options = {}) {
    assertNotAborted(options.signal);
    const { allHistoricalEntities } = await import(
      "../../data/exhibition/entities.js"
    );
    assertNotAborted(options.signal);
    return allHistoricalEntities.find((record) => record.id === id) || null;
  }

  async getPlaces(options = {}) {
    const normalized = normalizeRepositoryOptions(options);
    const [{ historicalSettlements }, { exhibitionPlaces }] = await Promise.all([
      import("../../data/exhibition/historicalSettlements.js"),
      import("../../data/exhibition/places.js"),
    ]);
    assertNotAborted(normalized.signal);
    const richIds = new Set(historicalSettlements.map((record) => record.id));
    return [
      ...historicalSettlements.filter(
        (record) =>
          activeAtYear(record, normalized.year) &&
          statusAllowed(record, normalized.verificationStatuses) &&
          intersectsBbox(
            { type: "Point", coordinates: record.coordinates },
            normalized.bbox
          )
      ),
      ...exhibitionPlaces
        .filter((record) => !richIds.has(record.id))
        .map((record) => ({
          ...record,
          coordinates: record.coords,
          coordinatePrecision: "approximate",
          verificationStatus: "needs_review",
          sourceIds: [],
        }))
        .filter((record) =>
          intersectsBbox(
            { type: "Point", coordinates: record.coordinates },
            normalized.bbox
          )
        ),
    ].slice(0, normalized.limit);
  }

  async getRoutes(options = {}) {
    const normalized = normalizeRepositoryOptions(options);
    const [{ historicalRoutes }, { routeSegments }, { historicalSettlements }] =
      await Promise.all([
        import("../../data/exhibition/historicalRoutes.js"),
        import("../../data/exhibition/routeSegments.js"),
        import("../../data/exhibition/historicalSettlements.js"),
      ]);
    assertNotAborted(normalized.signal);
    const routes = historicalRoutes.filter(
      (record) =>
        activeAtYear(record, normalized.year) &&
        statusAllowed(record, normalized.verificationStatuses)
    );
    const routeIds = new Set(routes.map((record) => record.id));
    return {
      routes,
      segments: routeSegments.filter(
        (record) =>
          routeIds.has(record.routeId) &&
          activeAtYear(record, normalized.year) &&
          statusAllowed(record, normalized.verificationStatuses)
      ),
      places: historicalSettlements.filter((record) =>
        record.routeIds.some((id) => routeIds.has(id))
      ),
    };
  }

  async getEvidence(subjectType, subjectId, options = {}) {
    assertNotAborted(options.signal);
    const [{ sourceClaims }, { historicalSources }, { archiveMaps }] =
      await Promise.all([
        import("../../data/exhibition/sourceClaims.js"),
        import("../../data/exhibition/sources.js"),
        import("../../data/exhibition/archiveMaps.js"),
      ]);
    assertNotAborted(options.signal);
    const claims = sourceClaims.filter(
      (claim) =>
        claim.subjectType === subjectType && claim.subjectId === subjectId
    );
    const sourceIds = new Set(claims.flatMap((claim) => claim.sourceIds));
    return {
      subjectType,
      subjectId,
      claims,
      sources: historicalSources.filter((source) => sourceIds.has(source.id)),
      archiveMaps: archiveMaps
        .filter((map) => map.sourceIds.some((sourceId) => sourceIds.has(sourceId)))
        .map(safeArchiveMap),
    };
  }

  async getArchiveMaps(options = {}) {
    assertNotAborted(options.signal);
    const { archiveMaps } = await import("../../data/exhibition/archiveMaps.js");
    assertNotAborted(options.signal);
    return archiveMaps.map(safeArchiveMap);
  }

  async getStory(id, options = {}) {
    assertNotAborted(options.signal);
    const { historicalStoryById, storyQuestionById } = await import(
      "../../data/exhibition/stories.js"
    );
    assertNotAborted(options.signal);
    const story = historicalStoryById.get(id) || null;
    if (!story) return null;
    return {
      ...story,
      questions: story.questionIds
        .map((questionId) => storyQuestionById.get(questionId))
        .filter(Boolean),
    };
  }

  async healthCheck({ signal } = {}) {
    assertNotAborted(signal);
    return {
      ok: true,
      source: "local",
      datasetVersion: LOCAL_DATASET_VERSION,
      durationMs: 0,
    };
  }
}
