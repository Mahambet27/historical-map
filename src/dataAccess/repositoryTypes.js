export const HISTORICAL_REPOSITORY_METHODS = [
  "getSnapshot",
  "getEntity",
  "getPlaces",
  "getRoutes",
  "getEvidence",
  "getArchiveMaps",
  "getStory",
  "healthCheck",
];

export const DEFAULT_HISTORICAL_BBOX = [40, 35, 100, 75];
export const DEFAULT_HISTORICAL_LIMIT = 500;
export const PUBLIC_VERIFICATION_STATUSES = [
  "verified",
  "reviewed",
  "needs_review",
  "demo_only",
];

export const normalizeRepositoryOptions = ({
  year = 1465,
  bbox = DEFAULT_HISTORICAL_BBOX,
  language = "ru",
  signal,
  limit = DEFAULT_HISTORICAL_LIMIT,
  verificationStatuses = PUBLIC_VERIFICATION_STATUSES,
} = {}) => ({
  year: Number.isFinite(Number(year)) ? Number(year) : 1465,
  bbox:
    Array.isArray(bbox) && bbox.length === 4
      ? bbox.map(Number)
      : [...DEFAULT_HISTORICAL_BBOX],
  language: ["ru", "kk", "en"].includes(language) ? language : "ru",
  signal,
  limit: Math.min(Math.max(Number(limit) || DEFAULT_HISTORICAL_LIMIT, 1), 500),
  verificationStatuses: verificationStatuses.filter((status) =>
    PUBLIC_VERIFICATION_STATUSES.includes(status)
  ),
});

export const assertHistoricalRepository = (repository) => {
  const missing = HISTORICAL_REPOSITORY_METHODS.filter(
    (method) => typeof repository?.[method] !== "function"
  );
  if (missing.length) {
    throw new TypeError(`Historical repository is missing: ${missing.join(", ")}`);
  }
  return repository;
};
