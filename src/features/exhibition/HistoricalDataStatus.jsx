const copy = {
  ru: {
    local: "Данные: локальные",
    supabase: "Данные: сервер",
    fallback: "Данные: локальный резерв",
    initializing: "Данные: подключение",
    retry: "Повторить подключение",
  },
  kk: {
    local: "Деректер: жергілікті",
    supabase: "Деректер: сервер",
    fallback: "Деректер: жергілікті резерв",
    initializing: "Деректер: қосылу",
    retry: "Қайта қосылу",
  },
  en: {
    local: "Data: local",
    supabase: "Data: server",
    fallback: "Data: local fallback",
    initializing: "Data: connecting",
    retry: "Retry connection",
  },
};

export default function HistoricalDataStatus({
  activeRepository,
  fallbackReason,
  language = "ru",
  onRetry,
  compact = false,
}) {
  const text = copy[language] || copy.ru;
  const fallback = activeRepository === "local-fallback";
  const label =
    activeRepository === "supabase"
      ? text.supabase
      : fallback
        ? text.fallback
        : activeRepository === "local"
          ? text.local
          : text.initializing;
  return (
    <div
      className={`ex-data-status ${compact ? "is-compact" : ""}`}
      data-source={activeRepository}
      role="status"
      aria-live={fallback ? "polite" : "off"}
    >
      <span aria-hidden="true">
        {fallback ? "!" : activeRepository === "supabase" ? "↗" : "◆"}
      </span>
      <span>{label}</span>
      {fallback && onRetry && (
        <button type="button" onClick={onRetry} aria-label={text.retry}>
          ↻ {text.retry}
        </button>
      )}
      {fallbackReason && <span className="sr-only">{fallbackReason}</span>}
    </div>
  );
}
