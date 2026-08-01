const resultCache = new Map();
let turfPromise;

const loadTurf = () => {
  if (!turfPromise) {
    turfPromise = Promise.all([
      import("@turf/intersect"),
      import("@turf/difference"),
      import("@turf/union"),
      import("@turf/helpers"),
    ]).then(([intersectModule, differenceModule, unionModule, helpersModule]) => ({
      intersect: intersectModule.default,
      difference: differenceModule.default,
      union: unionModule.default,
      featureCollection: helpersModule.featureCollection,
    }));
  }
  return turfPromise;
};

const computeDifference = async ({ first, second }) => {
  const { intersect, difference, union, featureCollection } = await loadTurf();
  const pair = featureCollection([first, second]);
  const reversePair = featureCollection([second, first]);
  return {
    common: intersect(pair),
    added: difference(reversePair),
    lost: difference(pair),
    union: union(pair),
  };
};

self.onmessage = async ({ data }) => {
  const { requestId, cacheKey, payload } = data;
  const started = performance.now();
  try {
    if (resultCache.has(cacheKey)) {
      self.postMessage({
        requestId,
        ok: true,
        cached: true,
        durationMs: 0,
        result: resultCache.get(cacheKey),
      });
      return;
    }
    const result = await computeDifference(payload);
    resultCache.set(cacheKey, result);
    self.postMessage({
      requestId,
      ok: true,
      cached: false,
      durationMs: performance.now() - started,
      result,
    });
  } catch (error) {
    self.postMessage({
      requestId,
      ok: false,
      durationMs: performance.now() - started,
      error: error?.message || "Geometry difference failed",
    });
  }
};
