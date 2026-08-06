import { useCallback, useEffect, useRef, useState } from "react";
import {
  getHistoricalRepository,
  retryHistoricalRepository,
} from "../../../dataAccess/createHistoricalRepository.js";

export default function useHistoricalRoutes({
  year,
  language = "ru",
  enabled = false,
  dataSource,
} = {}) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    refreshing: false,
    error: null,
    stale: false,
  });
  const requestId = useRef(0);
  const [retryVersion, setRetryVersion] = useState(0);
  const retry = useCallback(async () => {
    try {
      await retryHistoricalRepository({ dataSource });
    } catch {
      // The hook exposes the safe repository error state below.
    }
    setRetryVersion((value) => value + 1);
  }, [dataSource]);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    getHistoricalRepository({ dataSource })
      .then((repository) => {
        setState((current) => ({
          ...current,
          loading: !current.data,
          refreshing: Boolean(current.data),
          stale: Boolean(current.data),
          error: null,
        }));
        return repository.getRoutes({
          year,
          language,
          signal: controller.signal,
        });
      })
      .then((data) => {
        if (controller.signal.aborted || requestId.current !== currentRequest) return;
        setState({
          data,
          loading: false,
          refreshing: false,
          error: null,
          stale: false,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted || requestId.current !== currentRequest) return;
        setState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error,
          stale: Boolean(current.data),
        }));
      });
    return () => controller.abort();
  }, [dataSource, enabled, language, retryVersion, year]);

  return { ...state, retry };
}
