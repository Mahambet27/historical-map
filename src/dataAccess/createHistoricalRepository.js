import {
  HISTORICAL_DATA_SOURCE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  hasSupabaseConfig,
} from "../config/env.js";
import { recordExhibitionMetric } from "../features/exhibition/performanceTelemetry.js";
import { getSupabaseClient } from "../lib/supabaseClient.js";
import {
  buildHistoricalCacheKey,
  bucketBbox,
  historicalDataCache,
} from "./cache/historicalDataCache.js";
import { LOCAL_DATASET_VERSION } from "./datasetVersion.js";
import {
  DATA_ACCESS_ERROR_CODES,
  DataAccessError,
} from "./errors/DataAccessError.js";
import { assertHistoricalRepository } from "./repositoryTypes.js";
import { validateSupabaseConfiguration } from "./supabase/configValidator.js";

const listeners = new Set();
let repositoryPromise = null;
let repositoryMode = null;

const initialDiagnostics = () => ({
  configuredDataSource: HISTORICAL_DATA_SOURCE,
  activeRepository: "initializing",
  supabaseConfigured: hasSupabaseConfig,
  healthStatus: "not_checked",
  lastHealthDuration: null,
  fallbackReason: null,
  localDatasetVersion: LOCAL_DATASET_VERSION,
  serverDatasetVersion: null,
  versionMatch: null,
  cacheSize: 0,
  cacheHitCount: 0,
  cacheMissCount: 0,
  lastSnapshotDuration: null,
  lastBbox: null,
  recordsLoaded: 0,
  estimatedPayloadBytes: 0,
  abortedRequests: 0,
  repositoryErrors: 0,
  lastErrorCode: null,
});

let diagnostics = initialDiagnostics();

const runtimeTestConfiguration = () =>
  import.meta.env.DEV
    ? globalThis.__QHM_P2A_TEST_CONFIG__ || null
    : null;

const requestedDataSource = (explicit) =>
  explicit || runtimeTestConfiguration()?.dataSource || HISTORICAL_DATA_SOURCE;

const bboxAreaBucket = (bbox = []) => {
  if (!Array.isArray(bbox) || bbox.length !== 4) return "unknown";
  const area = Math.abs((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]));
  return `${Math.ceil(area / 250) * 250}-degree2`;
};

const publish = (patch) => {
  diagnostics = { ...diagnostics, ...patch };
  listeners.forEach((listener) => listener(diagnostics));
};

export const getHistoricalRepositoryDiagnostics = () => ({
  ...diagnostics,
  ...historicalDataCache.diagnostics(),
  cacheSize: historicalDataCache.diagnostics().size,
  cacheHitCount: historicalDataCache.diagnostics().hitCount,
  cacheMissCount: historicalDataCache.diagnostics().missCount,
});

export const subscribeHistoricalRepositoryDiagnostics = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const recordHistoricalRepositoryAbort = () => {
  publish({ abortedRequests: diagnostics.abortedRequests + 1 });
  recordExhibitionMetric("snapshot_request_aborted", 1);
};

export const recordHistoricalRepositoryError = (error) => {
  publish({
    repositoryErrors: diagnostics.repositoryErrors + 1,
    lastErrorCode: error?.code || "NETWORK_ERROR",
  });
};

class CachedHistoricalRepository {
  constructor(repository) {
    this.repository = repository;
    this.type = repository.type;
    this.datasetVersion = repository.datasetVersion || LOCAL_DATASET_VERSION;
  }

  async getSnapshot(options = {}) {
    const version = this.repository.datasetVersion || this.datasetVersion;
    historicalDataCache.configure({
      dataSource: this.type,
      datasetVersion: version,
    });
    const key = buildHistoricalCacheKey({
      dataSource: this.type,
      year: options.year,
      bbox: options.bbox,
      language: options.language,
      datasetVersion: version,
    });
    const cacheStarted = performance.now();
    const cached = historicalDataCache.get(key);
    if (cached) {
      recordExhibitionMetric(
        "snapshot_cache_hit",
        performance.now() - cacheStarted,
        { unit: "ms" }
      );
      publish(getHistoricalRepositoryDiagnostics());
      return cached;
    }
    recordExhibitionMetric(
      "snapshot_cache_miss",
      performance.now() - cacheStarted,
      { unit: "ms" }
    );
    recordExhibitionMetric("snapshot_request_started", 1, {
      year: options.year,
      bboxAreaBucket: bboxAreaBucket(options.bbox),
    });
    const started = performance.now();
    try {
      const result = await this.repository.getSnapshot(options);
      const duration = performance.now() - started;
      const payloadBytes = new TextEncoder().encode(JSON.stringify(result)).length;
      const recordsLoaded = [
        result.entities,
        result.geometries,
        result.places,
        result.environment,
        result.hydrology,
        result.routes?.routes,
        result.routes?.segments,
      ].reduce((total, records) => total + (records?.length || 0), 0);
      this.datasetVersion = result.datasetVersion || version;
      historicalDataCache.configure({
        dataSource: this.type,
        datasetVersion: this.datasetVersion,
      });
      historicalDataCache.set(
        buildHistoricalCacheKey({
          dataSource: this.type,
          year: options.year,
          bbox: options.bbox,
          language: options.language,
          datasetVersion: this.datasetVersion,
        }),
        result
      );
      const versionMatch =
        !result.datasetVersion ||
        result.datasetVersion === LOCAL_DATASET_VERSION;
      if (!versionMatch) {
        recordExhibitionMetric("dataset_version_mismatch", 1);
      }
      recordExhibitionMetric("snapshot_request_completed", duration, {
        unit: "ms",
        records: recordsLoaded,
        payloadBucketKb: Math.ceil(payloadBytes / 1024 / 10) * 10,
      });
      publish({
        lastSnapshotDuration: duration,
        lastBbox: bucketBbox(options.bbox, 5),
        recordsLoaded,
        estimatedPayloadBytes: payloadBytes,
        serverDatasetVersion:
          this.type === "supabase" ? result.datasetVersion || null : null,
        versionMatch,
        ...getHistoricalRepositoryDiagnostics(),
      });
      return result;
    } catch (error) {
      if (error?.code === DATA_ACCESS_ERROR_CODES.ABORTED) {
        recordHistoricalRepositoryAbort();
      } else {
        recordHistoricalRepositoryError(error);
      }
      throw error;
    }
  }

  getEntity(...args) {
    return this.repository.getEntity(...args);
  }
  getPlaces(...args) {
    return this.repository.getPlaces(...args);
  }
  getRoutes(...args) {
    return this.repository.getRoutes(...args);
  }
  getEvidence(...args) {
    return this.repository.getEvidence(...args);
  }
  getArchiveMaps(...args) {
    return this.repository.getArchiveMaps(...args);
  }
  getStory(...args) {
    return this.repository.getStory(...args);
  }
  healthCheck(...args) {
    return this.repository.healthCheck(...args);
  }
}

class AutoFallbackHistoricalRepository {
  constructor(primary) {
    this.primary = primary;
    this.active = primary;
    this.type = primary.type;
    this.datasetVersion = primary.datasetVersion;
    this.fallbackPromise = null;
  }

  async activateFallback(error) {
    if (error?.code === DATA_ACCESS_ERROR_CODES.ABORTED) throw error;
    if (!this.fallbackPromise) {
      const reason = error?.code || DATA_ACCESS_ERROR_CODES.INVALID_RESPONSE;
      recordExhibitionMetric("local_fallback_activated", 1, { reason });
      const started = performance.now();
      this.fallbackPromise = createLocal(reason).then((repository) => {
        recordExhibitionMetric(
          "local_fallback_activation_duration",
          performance.now() - started,
          { unit: "ms", reason }
        );
        return repository;
      });
    }
    this.active = await this.fallbackPromise;
    this.type = this.active.type;
    this.datasetVersion = this.active.datasetVersion;
    return this.active;
  }

  async run(method, args) {
    try {
      return await this.active[method](...args);
    } catch (error) {
      if (this.active !== this.primary) throw error;
      const fallback = await this.activateFallback(error);
      return fallback[method](...args);
    }
  }

  getSnapshot(...args) {
    return this.run("getSnapshot", args);
  }
  getEntity(...args) {
    return this.run("getEntity", args);
  }
  getPlaces(...args) {
    return this.run("getPlaces", args);
  }
  getRoutes(...args) {
    return this.run("getRoutes", args);
  }
  getEvidence(...args) {
    return this.run("getEvidence", args);
  }
  getArchiveMaps(...args) {
    return this.run("getArchiveMaps", args);
  }
  getStory(...args) {
    return this.run("getStory", args);
  }
  healthCheck(...args) {
    return this.run("healthCheck", args);
  }
}

const createLocal = async (reason = null) => {
  const started = performance.now();
  const { default: LocalHistoricalRepository } = await import(
    "./local/LocalHistoricalRepository.js"
  );
  const repository = new CachedHistoricalRepository(
    assertHistoricalRepository(new LocalHistoricalRepository())
  );
  recordExhibitionMetric(
    "data_repository_initialized",
    performance.now() - started,
    { unit: "ms", repository: reason ? "local-fallback" : "local" }
  );
  publish({
    activeRepository: reason ? "local-fallback" : "local",
    fallbackReason: reason,
    healthStatus: reason ? "failed" : "local",
    serverDatasetVersion: null,
    versionMatch: reason ? null : true,
  });
  return repository;
};

const createSupabase = async ({
  clientFactory,
  timeoutMs,
  signal,
  configuration,
}) => {
  const validation = validateSupabaseConfiguration(configuration);
  if (!validation.valid) {
    throw new DataAccessError(DATA_ACCESS_ERROR_CODES.CONFIGURATION_ERROR, {
      safeDetail: validation.errors[0],
    });
  }
  const started = performance.now();
  const client = await clientFactory();
  if (!client) {
    throw new DataAccessError(DATA_ACCESS_ERROR_CODES.CONFIGURATION_ERROR);
  }
  const { default: SupabaseHistoricalRepository } = await import(
    "./supabase/SupabaseHistoricalRepository.js"
  );
  const rawRepository = assertHistoricalRepository(
    new SupabaseHistoricalRepository(client, { timeoutMs })
  );
  const health = await rawRepository.healthCheck({ signal });
  recordExhibitionMetric("supabase_health_success", health.durationMs, {
    unit: "ms",
  });
  recordExhibitionMetric(
    "data_repository_initialized",
    performance.now() - started,
    { unit: "ms", repository: "supabase" }
  );
  publish({
    activeRepository: "supabase",
    healthStatus: "ok",
    lastHealthDuration: health.durationMs,
    fallbackReason: null,
    serverDatasetVersion: health.datasetVersion,
    versionMatch: health.datasetVersion === LOCAL_DATASET_VERSION,
  });
  return new CachedHistoricalRepository(rawRepository);
};

export const createHistoricalRepository = async ({
  dataSource,
  timeoutMs = 4000,
  signal,
  clientFactory,
  config,
} = {}) => {
  const effectiveDataSource = requestedDataSource(dataSource);
  const testConfiguration = runtimeTestConfiguration();
  const configuration = config || testConfiguration || {
    dataSource: effectiveDataSource,
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  };
  const effectiveClientFactory =
    clientFactory ||
    (() =>
      getSupabaseClient({
        allowInLocalMode: true,
        url: configuration.url,
        anonKey: configuration.anonKey,
      }));
  publish({
    configuredDataSource: effectiveDataSource,
    supabaseConfigured: Boolean(configuration.url && configuration.anonKey),
    activeRepository: "initializing",
  });
  if (effectiveDataSource === "local") return createLocal();
  if (effectiveDataSource === "supabase") {
    return createSupabase({
      clientFactory: effectiveClientFactory,
      timeoutMs,
      signal,
      configuration,
    });
  }
  try {
    const primary = await createSupabase({
      clientFactory: effectiveClientFactory,
      timeoutMs,
      signal,
      configuration: { ...configuration, dataSource: "auto" },
    });
    return new AutoFallbackHistoricalRepository(primary);
  } catch (error) {
    if (signal?.aborted || error?.code === DATA_ACCESS_ERROR_CODES.ABORTED) {
      throw error;
    }
    const reason = error?.code || DATA_ACCESS_ERROR_CODES.NETWORK_ERROR;
    recordExhibitionMetric("supabase_health_failed", 1, { reason });
    recordExhibitionMetric("local_fallback_activated", 1, { reason });
    const started = performance.now();
    const repository = await createLocal(reason);
    recordExhibitionMetric(
      "local_fallback_activation_duration",
      performance.now() - started,
      { unit: "ms", reason }
    );
    return repository;
  }
};

export const getHistoricalRepository = (options = {}) => {
  const mode = requestedDataSource(options.dataSource);
  if (!repositoryPromise || repositoryMode !== mode || options.force) {
    repositoryMode = mode;
    repositoryPromise = createHistoricalRepository(options).catch((error) => {
      repositoryPromise = null;
      recordHistoricalRepositoryError(error);
      throw error;
    });
  }
  return repositoryPromise;
};

export const retryHistoricalRepository = (options = {}) => {
  recordExhibitionMetric("repository_retry", 1);
  return getHistoricalRepository({ ...options, force: true });
};

export const resetHistoricalRepositoryForTests = () => {
  repositoryPromise = null;
  repositoryMode = null;
  historicalDataCache.clear();
  diagnostics = initialDiagnostics();
};
