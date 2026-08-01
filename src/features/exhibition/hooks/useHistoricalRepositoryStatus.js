import { useCallback, useEffect, useState } from "react";
import {
  getHistoricalRepositoryDiagnostics,
  retryHistoricalRepository,
  subscribeHistoricalRepositoryDiagnostics,
} from "../../../dataAccess/createHistoricalRepository.js";

export default function useHistoricalRepositoryStatus() {
  const [status, setStatus] = useState(getHistoricalRepositoryDiagnostics);
  useEffect(
    () => subscribeHistoricalRepositoryDiagnostics(setStatus),
    []
  );
  const retry = useCallback(
    () =>
      retryHistoricalRepository()
        .then(() => true)
        .catch(() => false)
        .finally(() => setStatus(getHistoricalRepositoryDiagnostics())),
    []
  );
  return { ...status, retry };
}
