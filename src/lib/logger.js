const TOKEN_PATTERNS = [
  /([?&]access_token=)[^&\s]+/gi,
  /\bpk\.[A-Za-z0-9._-]+/g,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
];

let sink = null;

export const redact = (value) => {
  if (typeof value !== "string") return value;
  return TOKEN_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, (match, prefix) => `${prefix || ""}[redacted]`),
    value
  );
};

const sanitize = (value) => {
  if (value instanceof Error) {
    return { name: value.name, message: redact(value.message), stack: redact(value.stack || "") };
  }
  if (typeof value === "string") return redact(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item)]));
  }
  return value;
};

const emit = (level, values) => {
  const safeValues = values.map(sanitize);
  sink?.({ level, values: safeValues, timestamp: Date.now() });
  if (import.meta.env.DEV) console[level]?.(...safeValues);
};

export const setLogSink = (nextSink) => {
  sink = typeof nextSink === "function" ? nextSink : null;
};

export const logger = {
  debug: (...values) => emit("debug", values),
  info: (...values) => emit("info", values),
  warn: (...values) => emit("warn", values),
  error: (...values) => emit("error", values),
};
