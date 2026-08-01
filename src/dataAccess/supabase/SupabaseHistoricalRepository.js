import { LOCAL_DATASET_VERSION } from "../datasetVersion.js";
import { recordExhibitionMetric } from "../../features/exhibition/performanceTelemetry.js";
import {
  DATA_ACCESS_ERROR_CODES,
  DataAccessError,
} from "../errors/DataAccessError.js";
import { normalizeRepositoryOptions } from "../repositoryTypes.js";
import {
  mapSupabaseArchiveMap,
  mapSupabaseEntity,
  mapSupabaseEvidence,
  mapSupabasePlace,
  mapSupabaseSnapshot,
  mapSupabaseStory,
} from "./supabaseMappers.js";
import { runSupabaseQuery } from "./supabaseQueryUtils.js";

export default class SupabaseHistoricalRepository {
  constructor(client, { timeoutMs = 4000 } = {}) {
    if (!client) {
      throw new DataAccessError(DATA_ACCESS_ERROR_CODES.CONFIGURATION_ERROR);
    }
    this.client = client;
    this.type = "supabase";
    this.timeoutMs = timeoutMs;
    this.datasetVersion = null;
  }

  async getSnapshot(options = {}) {
    const normalized = normalizeRepositoryOptions(options);
    const [west, south, east, north] = normalized.bbox;
    const payload = await runSupabaseQuery(
      () =>
        this.client.rpc("get_exhibition_snapshot", {
          p_year: normalized.year,
          p_west: west,
          p_south: south,
          p_east: east,
          p_north: north,
          p_language: normalized.language,
        }),
      {
        signal: normalized.signal,
        timeoutMs: this.timeoutMs,
      }
    );
    const mappingStarted = performance.now();
    const snapshot = mapSupabaseSnapshot(payload);
    recordExhibitionMetric(
      "repository_response_mapping",
      performance.now() - mappingStarted,
      { unit: "ms", records: snapshot.geometries.length + snapshot.places.length }
    );
    this.datasetVersion = snapshot.datasetVersion;
    return snapshot;
  }

  async getEntity(id, options = {}) {
    const rows = await runSupabaseQuery(
      () =>
        this.client
          .from("historical_entities")
          .select(
            "id,entity_type,default_name,summary,valid_from_year,valid_to_year,confidence_level,verification_status,metadata"
          )
          .eq("id", id)
          .limit(1),
      { signal: options.signal, timeoutMs: this.timeoutMs }
    );
    return Array.isArray(rows) && rows[0] ? mapSupabaseEntity(rows[0]) : null;
  }

  async getPlaces(options = {}) {
    const normalized = normalizeRepositoryOptions(options);
    const [west, south, east, north] = normalized.bbox;
    const rows = await runSupabaseQuery(
      () =>
        this.client.rpc("get_historical_places", {
          p_year: normalized.year,
          p_west: west,
          p_south: south,
          p_east: east,
          p_north: north,
          p_place_types: null,
          p_limit: normalized.limit,
        }),
      { signal: normalized.signal, timeoutMs: this.timeoutMs }
    );
    if (!Array.isArray(rows)) {
      throw new DataAccessError(DATA_ACCESS_ERROR_CODES.INVALID_RESPONSE);
    }
    return rows.map(mapSupabasePlace);
  }

  async getRoutes(options = {}) {
    const normalized = normalizeRepositoryOptions(options);
    const payload = await runSupabaseQuery(
      () =>
        this.client.rpc("get_historical_routes", {
          p_year: normalized.year,
        }),
      { signal: normalized.signal, timeoutMs: this.timeoutMs }
    );
    const snapshot = mapSupabaseSnapshot({
      datasetVersion: this.datasetVersion,
      year: normalized.year,
      language: normalized.language,
      entities: [],
      geometries: [],
      places: [],
      routes: payload,
      environment: [],
      hydrology: [],
      labels: [],
    });
    return snapshot.routes;
  }

  async getEvidence(subjectType, subjectId, options = {}) {
    const payload = await runSupabaseQuery(
      () =>
        this.client.rpc("get_subject_evidence", {
          p_subject_type: subjectType,
          p_subject_id: subjectId,
        }),
      { signal: options.signal, timeoutMs: this.timeoutMs }
    );
    return mapSupabaseEvidence(payload);
  }

  async getArchiveMaps(options = {}) {
    const rows = await runSupabaseQuery(
      () =>
        this.client
          .from("p2a_public_archive_maps")
          .select(
            "id,titles,descriptions,map_date,map_date_precision,source_id,institution,author,publisher,image_url,thumbnail_url,georeference_type,georeference_data,default_opacity,license,verification_status,metadata"
          )
          .limit(200),
      { signal: options.signal, timeoutMs: this.timeoutMs }
    );
    if (!Array.isArray(rows)) {
      throw new DataAccessError(DATA_ACCESS_ERROR_CODES.INVALID_RESPONSE);
    }
    return rows.map(mapSupabaseArchiveMap);
  }

  async getStory(id, options = {}) {
    const payload = await runSupabaseQuery(
      () =>
        this.client.rpc("get_educational_story", {
          p_story_id: id,
        }),
      { signal: options.signal, timeoutMs: this.timeoutMs }
    );
    return mapSupabaseStory(payload);
  }

  async healthCheck({ signal } = {}) {
    const started = performance.now();
    const payload = await runSupabaseQuery(
      () => this.client.rpc("get_p2a_dataset_status"),
      { signal, timeoutMs: this.timeoutMs }
    );
    const datasetVersion =
      payload?.datasetVersion || payload?.dataset_version || null;
    if (!datasetVersion) {
      throw new DataAccessError(DATA_ACCESS_ERROR_CODES.INVALID_RESPONSE);
    }
    this.datasetVersion = datasetVersion;
    return {
      ok: true,
      source: "supabase",
      datasetVersion,
      localDatasetVersion: LOCAL_DATASET_VERSION,
      durationMs: performance.now() - started,
    };
  }
}
