const metrics = new Map();
const now = () => globalThis.performance?.now?.() ?? Date.now();

export const recordExhibitionMetric = (name, value = now(), detail = {}) => {
  const metric = { name, value: Math.round(value * 100) / 100, ...detail };
  metrics.set(name, metric);
  return metric;
};

export const recordExhibitionMetricOnce = (name, value = now(), detail = {}) =>
  metrics.get(name) || recordExhibitionMetric(name, value, detail);

export const timeExhibitionWork = (name, work) => {
  const started = now();
  const result = work();
  recordExhibitionMetric(name, now() - started, { unit: "ms" });
  return result;
};

export const getExhibitionMetrics = () => Array.from(metrics.values());

export const resetExhibitionMetrics = () => metrics.clear();

export const sampleExhibitionFps = ({
  duration = 1200,
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
} = {}) => {
  const started = now();
  let frames = 0;
  let frame = 0;
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    frames += 1;
    const elapsed = now() - started;
    if (elapsed >= duration) {
      recordExhibitionMetric("fps-sample", (frames * 1000) / elapsed, { unit: "fps" });
      return;
    }
    frame = requestFrame(tick);
  };
  frame = requestFrame(tick);
  return () => {
    stopped = true;
    cancelFrame(frame);
  };
};
