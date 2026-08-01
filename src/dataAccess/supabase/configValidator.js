import {
  HISTORICAL_DATA_SOURCES,
  SUPABASE_ANON_KEY_PLACEHOLDER,
  SUPABASE_URL_PLACEHOLDER,
} from "../../config/env.js";

const publicAnonKeyPattern =
  /^(eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+|sb_publishable_[a-zA-Z0-9_-]+)$/;

export const validateSupabaseConfiguration = ({
  dataSource,
  url,
  anonKey,
  serviceRoleKey,
} = {}) => {
  const errors = [];
  if (!HISTORICAL_DATA_SOURCES.includes(dataSource)) {
    errors.push("INVALID_DATA_SOURCE");
  }
  if (serviceRoleKey) errors.push("SERVICE_ROLE_FORBIDDEN");
  if (dataSource !== "local") {
    if (!url || url === SUPABASE_URL_PLACEHOLDER) {
      errors.push("SUPABASE_URL_MISSING");
    } else {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" || !parsed.hostname) {
          errors.push("SUPABASE_URL_INVALID");
        }
      } catch {
        errors.push("SUPABASE_URL_INVALID");
      }
    }
    if (!anonKey || anonKey === SUPABASE_ANON_KEY_PLACEHOLDER) {
      errors.push("SUPABASE_ANON_KEY_MISSING");
    } else if (!publicAnonKeyPattern.test(anonKey)) {
      errors.push("SUPABASE_ANON_KEY_INVALID");
    }
  }
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const redactSupabaseUrl = (value) => {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname.slice(0, 4)}…`;
  } catch {
    return "";
  }
};
