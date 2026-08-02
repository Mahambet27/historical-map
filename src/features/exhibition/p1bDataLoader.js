import { recordExhibitionMetric } from "./performanceTelemetry.js";

const cache = new Map();
const loadedDatasets = new Set();

const load = async (id, importer, signal) => {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  if (cache.has(id)) return cache.get(id);
  const started = performance.now();
  const promise = importer().then((module) => {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    loadedDatasets.add(id);
    recordExhibitionMetric(`${id}_data_loaded`, performance.now() - started, {
      unit: "ms",
    });
    return module;
  });
  cache.set(id, promise);
  try {
    return await promise;
  } catch (error) {
    cache.delete(id);
    throw error;
  }
};

export const loadEnvironmentData = (signal) =>
  load(
    "environment",
    () => import("../../data/exhibition/environmentSnapshots.js"),
    signal
  );

export const loadHydrologyData = (signal) =>
  load(
    "hydrology",
    () =>
      Promise.all([
        import("../../data/exhibition/hydrologySnapshots.js"),
        import("../../data/exhibition/historicalRiverSnapshots.js"),
      ]).then(([hydrology, rivers]) => ({
        ...hydrology,
        hydrologySnapshots: [
          ...hydrology.hydrologySnapshots,
          ...rivers.historicalRiverSnapshots,
        ],
      })),
    signal
  );

export const loadRouteData = (signal) =>
  load(
    "route",
    () =>
      Promise.all([
        import("../../data/exhibition/historicalRoutes.js"),
        import("../../data/exhibition/routeSegments.js"),
        import("../../data/exhibition/historicalSettlements.js"),
      ]).then(([routes, segments, settlements]) => ({
        ...routes,
        ...segments,
        ...settlements,
      })),
    signal
  );

export const getP1BDataDiagnostics = () => ({
  loadedDatasets: [...loadedDatasets],
  cachedDatasets: cache.size,
});

export const resetP1BDataLoaderForTests = () => {
  cache.clear();
  loadedDatasets.clear();
};
