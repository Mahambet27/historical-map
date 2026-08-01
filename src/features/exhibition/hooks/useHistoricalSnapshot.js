import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getHistoricalRepository,
  retryHistoricalRepository,
} from "../../../dataAccess/createHistoricalRepository.js";
import {
  DEFAULT_HISTORICAL_BBOX,
  normalizeRepositoryOptions,
} from "../../../dataAccess/repositoryTypes.js";
import useHistoricalRepositoryStatus from "./useHistoricalRepositoryStatus.js";

export default function useHistoricalSnapshot({
  year,
  bbox = DEFAULT_HISTORICAL_BBOX,
  language,
  enabled = true,
  debounceMs = 250,
} = {}) {
  const repositoryStatus = useHistoricalRepositoryStatus();
  const [state, setState] = useState({
    data: null,
    loading: enabled,
    refreshing: false,
    error: null,
    stale: false,
  });
  const requestId = useRef(0);
  const [retryVersion, setRetryVersion] = useState(0);
  const bboxKey = useMemo(() => bbox.join(","), [bbox]);
  const retry = useCallback(async () => {
    try {
      await retryHistoricalRepository();
    } catch {
      // Explicit supabase mode keeps the visible error state without fallback.
    }
    setRetryVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      getHistoricalRepository().catch(() => {});
      setState((current) => ({ ...current, loading: false, refreshing: false }));
      return undefined;
    }
    const controller = new AbortController();
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    const timer = window.setTimeout(async () => {
      setState((current) => ({
        ...current,
        loading: !current.data,
        refreshing: Boolean(current.data),
        error: null,
        stale: Boolean(current.data),
      }));
      try {
        const repository = await getHistoricalRepository();
        const data = await repository.getSnapshot(
          normalizeRepositoryOptions({
            year,
            bbox,
            language,
            signal: controller.signal,
          })
        );
        if (controller.signal.aborted || requestId.current !== currentRequest) return;
        setState({
          data,
          loading: false,
          refreshing: false,
          error: null,
          stale: false,
        });
      } catch (error) {
        if (controller.signal.aborted || requestId.current !== currentRequest) return;
        setState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error,
          stale: Boolean(current.data),
        }));
      }
    }, debounceMs);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [bbox, bboxKey, debounceMs, enabled, language, retryVersion, year]);

  return {
    ...state,
    fallback: repositoryStatus.activeRepository === "local-fallback",
    activeRepository: repositoryStatus.activeRepository,
    retry,
  };
}
