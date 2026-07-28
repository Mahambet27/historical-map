import { logger } from "./logger.js";

export async function initWebVitals(onMetric) {
  const report =
    onMetric ||
    ((metric) => {
      if (import.meta.env.DEV) logger.info("web-vital", metric);
    });

  try {
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import("web-vitals");
    [onCLS, onFCP, onINP, onLCP, onTTFB].forEach((subscribe) => subscribe(report));
  } catch (error) {
    logger.warn("web-vitals unavailable", error);
  }
}
