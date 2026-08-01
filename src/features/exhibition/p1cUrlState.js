const ARCHIVE_IDS = new Set([
  "qhm-evidence-overlay-demo",
  "future-institutional-archive-placeholder",
]);
const EVIDENCE_TYPES = new Set([
  "entity", "geometry", "event", "person", "place", "route",
  "environment", "hydrology", "story", "historical_change",
]);

export const parseEvidenceTarget = (value) => {
  const [subjectType, subjectId, ...rest] = String(value || "").split(":");
  return EVIDENCE_TYPES.has(subjectType) && subjectId && !rest.length
    ? { subjectType, subjectId }
    : null;
};

export const parseP1CUrlState = (search = window.location.search) => {
  try {
    const params = new URLSearchParams(search);
    const archiveMapValue = params.get("archiveMap");
    const opacity = Number(params.get("archiveOpacity"));
    return {
      archiveMap: ARCHIVE_IDS.has(archiveMapValue) ? archiveMapValue : null,
      archiveOpacity: Number.isFinite(opacity) && params.has("archiveOpacity")
        ? Math.min(100, Math.max(0, opacity)) / 100
        : null,
      evidence: parseEvidenceTarget(params.get("evidence")),
      review: params.get("review") === "true",
      story: params.get("story") === "historical-evidence" ? "historical-evidence" : null,
      compareArchive: params.get("compareArchive") === "true",
    };
  } catch {
    return {
      archiveMap: null,
      archiveOpacity: null,
      evidence: null,
      review: false,
      story: null,
      compareArchive: false,
    };
  }
};
