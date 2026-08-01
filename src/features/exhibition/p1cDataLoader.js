import { recordExhibitionMetric } from "./performanceTelemetry.js";

const cache = new Map();
const loaded = new Set();

const load = async (id, importer, signal) => {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  if (!cache.has(id)) {
    const started = performance.now();
    const promise = importer()
      .then((module) => {
        loaded.add(id);
        recordExhibitionMetric(
          `${id}_data_loaded`,
          performance.now() - started,
          { unit: "ms" }
        );
        return module;
      })
      .catch((error) => {
        cache.delete(id);
        throw error;
      });
    cache.set(id, promise);
  }
  try {
    const module = await cache.get(id);
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return module;
  } catch (error) {
    if (signal?.aborted && error?.name !== "AbortError") {
      throw new DOMException("Aborted", "AbortError");
    }
    throw error;
  }
};

export const loadEvidenceData = (signal) =>
  load("evidence", () =>
    Promise.all([
      import("../../data/exhibition/sourceClaims.js"),
      import("../../data/exhibition/sourceDisputes.js"),
    ]).then(([claims, disputes]) => ({ ...claims, ...disputes })), signal);

export const loadArchiveData = (signal) =>
  load("archive", () => import("../../data/exhibition/archiveMaps.js"), signal);

export const getP1CDataDiagnostics = () => ({
  loadedDatasets: [...loaded],
  cachedDatasets: cache.size,
});

export const resetP1CDataLoaderForTests = () => {
  cache.clear();
  loaded.clear();
};
