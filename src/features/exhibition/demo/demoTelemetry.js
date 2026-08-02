import { OFFLINE_EXHIBITION } from "../../../config/releaseChannel.js";
import { recordExhibitionMetric } from "../performanceTelemetry.js";

export const DEMO_TELEMETRY_EVENTS = Object.freeze([
  "demo_boot_started",
  "demo_boot_completed",
  "demo_boot_degraded",
  "official_demo_started",
  "official_demo_reset",
  "operator_menu_opened",
  "offline_fallback_activated",
  "svg_fallback_activated",
  "cache_recovery_started",
  "cache_recovery_completed",
  "demo_health_check_completed",
  "device_profile_selected",
  "demo_integrity_failed",
  "recording_mode_started",
]);

const SAFE_DETAIL_KEYS = new Set([
  "status",
  "reason",
  "profile",
  "quality",
  "mode",
  "offline",
]);

export const sanitizeDemoTelemetryDetail = (detail = {}) =>
  Object.fromEntries(
    Object.entries(detail).filter(([key, value]) => {
      return (
        SAFE_DETAIL_KEYS.has(key) &&
        ["string", "number", "boolean"].includes(typeof value)
      );
    })
  );

export const recordDemoEvent = (name, detail = {}) => {
  if (!DEMO_TELEMETRY_EVENTS.includes(name)) return null;
  if (OFFLINE_EXHIBITION) {
    return recordExhibitionMetric(name, 1, {
      ...sanitizeDemoTelemetryDetail(detail),
      localOnly: true,
    });
  }
  return recordExhibitionMetric(
    name,
    1,
    sanitizeDemoTelemetryDetail(detail)
  );
};

