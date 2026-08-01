import { useCallback, useEffect, useRef, useState } from "react";
import {
  getHistoricalRepository,
  retryHistoricalRepository,
} from "../../../dataAccess/createHistoricalRepository.js";

export default function useHistoricalEvidence({
  subjectType,
  subjectId,
  language = "ru",
  enabled = true,
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
      await retryHistoricalRepository();
    } catch {
      // The hook exposes the safe repository error state below.
    }
    setRetryVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !subjectType || !subjectId) return undefined;
    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    getHistoricalRepository()
      .then((repository) => {
        setState((current) => ({
          ...current,
          loading: !current.data,
          refreshing: Boolean(current.data),
          stale: Boolean(current.data),
          error: null,
        }));
        return repository.getEvidence(subjectType, subjectId, {
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
  }, [enabled, language, retryVersion, subjectId, subjectType]);

  return { ...state, retry };
}
