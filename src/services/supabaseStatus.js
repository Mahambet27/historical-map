import supabaseClient from "../lib/supabaseClient.js";
import { hasSupabaseConfig } from "../config/env.js";

export async function checkSupabaseConnection() {
  if (!hasSupabaseConfig || !supabaseClient) {
    return {
      configured: false,
      connected: false,
      table: null,
      error: null,
    };
  }

  const probes = ["places", "eras"];
  let lastError = null;

  try {
    for (const table of probes) {
      const { error } = await supabaseClient
        .from(table)
        .select("id", { head: true, count: "exact" })
        .limit(1);

      if (!error) {
        return {
          configured: true,
          connected: true,
          table,
          error: null,
        };
      }

      lastError = error;
    }
  } catch (error) {
    lastError = error;
  }

  return {
    configured: true,
    connected: false,
    table: null,
    error: lastError?.message || "Supabase tables are not ready yet.",
  };
}
