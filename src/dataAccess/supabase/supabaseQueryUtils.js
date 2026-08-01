import {
  DATA_ACCESS_ERROR_CODES,
  DataAccessError,
  toDataAccessError,
} from "../errors/DataAccessError.js";

export const createTimeoutSignal = (parentSignal, timeoutMs = 4000) => {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromParent = () => controller.abort(parentSignal.reason);
  parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException("Timed out", "TimeoutError"));
  }, timeoutMs);
  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      parentSignal?.removeEventListener("abort", abortFromParent);
    },
  };
};

export const unwrapSupabaseResult = (result, { requireData = true } = {}) => {
  if (result?.error) {
    throw new DataAccessError(DATA_ACCESS_ERROR_CODES.RPC_ERROR, {
      safeDetail: result.error.code || "RPC_FAILED",
    });
  }
  if (requireData && (result == null || result.data == null)) {
    throw new DataAccessError(DATA_ACCESS_ERROR_CODES.INVALID_RESPONSE);
  }
  return result?.data ?? null;
};

export const runSupabaseQuery = async (
  queryFactory,
  { signal, timeoutMs = 4000, requireData = true } = {}
) => {
  if (signal?.aborted) {
    throw new DataAccessError(DATA_ACCESS_ERROR_CODES.ABORTED);
  }
  const timeout = createTimeoutSignal(signal, timeoutMs);
  try {
    const query = queryFactory();
    const result = await (
      typeof query?.abortSignal === "function"
        ? query.abortSignal(timeout.signal)
        : query
    );
    return unwrapSupabaseResult(result, { requireData });
  } catch (error) {
    if (timeout.didTimeOut()) {
      throw new DataAccessError(DATA_ACCESS_ERROR_CODES.TIMEOUT, { cause: error });
    }
    if (signal?.aborted || error?.name === "AbortError") {
      throw new DataAccessError(DATA_ACCESS_ERROR_CODES.ABORTED, { cause: error });
    }
    throw toDataAccessError(error);
  } finally {
    timeout.cleanup();
  }
};
