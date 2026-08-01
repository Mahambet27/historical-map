const clone = (value) =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const removeUnsafeValues = (value) => {
  if (Array.isArray(value)) return value.map(removeUnsafeValues);
  if (!value || typeof value !== "object") return value;
  const licenseStatus =
    value.license?.status || value.licenseStatus || value.license_status;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => {
        const normalized = key.toLowerCase();
        return ![
          "reviewnote",
          "reviewnotes",
          "reviewedby",
          "reviewed_by",
          "servicerole",
          "servicerolekey",
          "service_role",
          "service_role_key",
          "access_token",
          "accesstoken",
          "refreshtoken",
          "refresh_token",
          "anonkey",
          "anon_key",
        ].includes(normalized);
      })
      .map(([key, nested]) => {
        if (
          ["imageUrl", "image_url"].includes(key) &&
          ["restricted", "unknown"].includes(licenseStatus)
        ) {
          return [key, null];
        }
        return [key, removeUnsafeValues(nested)];
      })
  );
};

export const bucketBbox = (bbox = [], precision = 1) =>
  bbox
    .map((coordinate) => Math.round(Number(coordinate) / precision) * precision)
    .join(",");

export const buildHistoricalCacheKey = ({
  dataSource,
  year,
  bbox,
  language,
  datasetVersion,
}) =>
  `${dataSource}:${year}:${bucketBbox(bbox)}:${language}:${datasetVersion}`;

export class HistoricalDataCache {
  constructor({ maxEntries = 8, ttlMs = 5 * 60 * 1000, now = Date.now } = {}) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.now = now;
    this.entries = new Map();
    this.hits = 0;
    this.misses = 0;
    this.datasetVersion = null;
    this.dataSource = null;
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry || this.now() - entry.createdAt > this.ttlMs) {
      if (entry) this.entries.delete(key);
      this.misses += 1;
      return null;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.hits += 1;
    return clone(entry.value);
  }

  set(key, value) {
    this.entries.delete(key);
    this.entries.set(key, {
      createdAt: this.now(),
      value: removeUnsafeValues(clone(value)),
    });
    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value);
    }
  }

  configure({ dataSource, datasetVersion }) {
    if (
      (this.dataSource && this.dataSource !== dataSource) ||
      (this.datasetVersion && this.datasetVersion !== datasetVersion)
    ) {
      this.clear();
    }
    this.dataSource = dataSource;
    this.datasetVersion = datasetVersion;
  }

  clear() {
    this.entries.clear();
  }

  diagnostics() {
    return {
      size: this.entries.size,
      hitCount: this.hits,
      missCount: this.misses,
      datasetVersion: this.datasetVersion,
      dataSource: this.dataSource,
    };
  }
}

export const historicalDataCache = new HistoricalDataCache();
