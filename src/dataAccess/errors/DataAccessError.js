export const DATA_ACCESS_ERROR_CODES = {
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  ABORTED: "ABORTED",
  RPC_ERROR: "RPC_ERROR",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  VERSION_MISMATCH: "VERSION_MISMATCH",
  FALLBACK_ACTIVATED: "FALLBACK_ACTIVATED",
};

const messages = {
  ru: {
    CONFIGURATION_ERROR: "Серверный источник данных не настроен.",
    NETWORK_ERROR: "Не удалось получить исторические данные с сервера.",
    TIMEOUT: "Сервер данных не ответил вовремя.",
    ABORTED: "Запрос данных отменён.",
    RPC_ERROR: "Сервер не смог подготовить исторические данные.",
    INVALID_RESPONSE: "Сервер вернул неподдерживаемый формат данных.",
    VERSION_MISMATCH: "Версии локальных и серверных данных различаются.",
    FALLBACK_ACTIVATED: "Используется локальный резерв данных.",
  },
  kk: {
    CONFIGURATION_ERROR: "Серверлік дереккөз бапталмаған.",
    NETWORK_ERROR: "Тарихи деректерді серверден алу мүмкін болмады.",
    TIMEOUT: "Деректер сервері уақытында жауап бермеді.",
    ABORTED: "Деректер сұрауы тоқтатылды.",
    RPC_ERROR: "Сервер тарихи деректерді дайындай алмады.",
    INVALID_RESPONSE: "Сервер қолдау көрсетілмейтін деректер пішімін қайтарды.",
    VERSION_MISMATCH: "Жергілікті және серверлік деректер нұсқалары әртүрлі.",
    FALLBACK_ACTIVATED: "Жергілікті резервтік деректер қолданылуда.",
  },
  en: {
    CONFIGURATION_ERROR: "The server data source is not configured.",
    NETWORK_ERROR: "Historical data could not be loaded from the server.",
    TIMEOUT: "The data server did not respond in time.",
    ABORTED: "The data request was cancelled.",
    RPC_ERROR: "The server could not prepare historical data.",
    INVALID_RESPONSE: "The server returned an unsupported data format.",
    VERSION_MISMATCH: "Local and server dataset versions differ.",
    FALLBACK_ACTIVATED: "The local data fallback is active.",
  },
};

export class DataAccessError extends Error {
  constructor(code, { cause, safeDetail, language = "ru" } = {}) {
    super(messages[language]?.[code] || messages.ru[code] || messages.ru.NETWORK_ERROR, {
      cause,
    });
    this.name = "DataAccessError";
    this.code = code;
    this.safeDetail = safeDetail || null;
  }
}

export const toDataAccessError = (error, fallbackCode = "NETWORK_ERROR") => {
  if (error instanceof DataAccessError) return error;
  if (error?.name === "AbortError") {
    return new DataAccessError(DATA_ACCESS_ERROR_CODES.ABORTED, { cause: error });
  }
  return new DataAccessError(fallbackCode, { cause: error });
};
