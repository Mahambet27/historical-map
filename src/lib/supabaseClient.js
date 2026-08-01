import {
  HISTORICAL_DATA_SOURCE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  hasSupabaseConfig,
} from "../config/env.js";

let clientPromise = null;

export const getSupabaseClient = async ({
  allowInLocalMode = false,
  url = SUPABASE_URL,
  anonKey = SUPABASE_ANON_KEY,
} = {}) => {
  const configured =
    Boolean(url) &&
    Boolean(anonKey) &&
    url !== "your_supabase_project_url" &&
    anonKey !== "your_supabase_anon_key";
  if (
    (!hasSupabaseConfig && !configured) ||
    (HISTORICAL_DATA_SOURCE === "local" && !allowInLocalMode)
  ) {
    return null;
  }
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js")
      .then(({ createClient }) =>
        createClient(url, anonKey, {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
        })
      )
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }
  return clientPromise;
};

export const resetSupabaseClientForTests = () => {
  clientPromise = null;
};
