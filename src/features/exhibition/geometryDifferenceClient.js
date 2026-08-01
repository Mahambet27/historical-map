const comparisonCache = new Map();
let requestSequence = 0;
let turfLazyStatus = "idle";

const defaultWorkerFactory = () =>
  new Worker(new URL("./workers/geometryDifference.worker.js", import.meta.url), {
    type: "module",
    name: "qhm-geometry-difference",
  });

export const getComparisonCacheKey = ({ fromYear, toYear, entityId }) =>
  `${fromYear}:${toYear}:${entityId}`;

export class GeometryDifferenceController {
  constructor(workerFactory = defaultWorkerFactory) {
    this.workerFactory = workerFactory;
    this.worker = null;
    this.pending = new Map();
  }

  ensureWorker() {
    if (this.worker) return this.worker;
    this.worker = this.workerFactory();
    this.worker.onmessage = ({ data }) => {
      const pending = this.pending.get(data.requestId);
      if (!pending) return;
      this.pending.delete(data.requestId);
      if (!data.ok) {
        pending.reject(new Error(data.error || "Geometry difference failed"));
        return;
      }
      comparisonCache.set(pending.cacheKey, data);
      turfLazyStatus = "ready";
      pending.resolve(data);
    };
    this.worker.onerror = (event) => {
      turfLazyStatus = "error";
      const error = new Error(event?.message || "Geometry worker failed");
      this.pending.forEach(({ reject }) => reject(error));
      this.pending.clear();
    };
    return this.worker;
  }

  calculate({ fromYear, toYear, entityId, first, second }) {
    const cacheKey = getComparisonCacheKey({ fromYear, toYear, entityId });
    const cached = comparisonCache.get(cacheKey);
    if (cached) return Promise.resolve({ ...cached, cached: true });

    turfLazyStatus = "loading";
    const worker = this.ensureWorker();
    const requestId = `geometry-${++requestSequence}`;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject, cacheKey });
      worker.postMessage({
        requestId,
        cacheKey,
        payload: { first, second },
      });
    });
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.forEach(({ reject }) =>
      reject(new Error("Geometry comparison closed"))
    );
    this.pending.clear();
  }
}

export const getGeometryComparisonDiagnostics = () => ({
  workerSupported: typeof Worker !== "undefined",
  turfLazyStatus,
  cachedComparisons: comparisonCache.size,
});

export const resetGeometryComparisonCacheForTests = () => {
  comparisonCache.clear();
  turfLazyStatus = "idle";
  requestSequence = 0;
};

