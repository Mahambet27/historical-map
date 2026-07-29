import supabaseClient from "../lib/supabaseClient.js";
import { allHistoricalEntities, entityRelations } from "../data/exhibition/entities.js";
import { entityGeometries, getGeometriesAtYear } from "../data/exhibition/entityGeometries.js";
import { historicalEvents } from "../data/exhibition/events.js";
import { historicalPeople } from "../data/exhibition/people.js";
import { exhibitionPlaces } from "../data/exhibition/places.js";

const logFallback = (reason) => {
  if (import.meta.env.DEV) console.info("Exhibition data: local reviewed dataset", { reason });
};

const normalizedLocalData = {
  entities: allHistoricalEntities,
  geometries: entityGeometries,
  relations: entityRelations,
  events: historicalEvents,
  people: historicalPeople,
  places: exhibitionPlaces,
};

export async function getHistoricalData({ signal } = {}) {
  if (!supabaseClient) {
    logFallback("Supabase is not configured");
    return normalizedLocalData;
  }

  try {
    const result = await supabaseClient
      .from("historical_entities")
      .select("*")
      .eq("status", "published")
      .abortSignal(signal || new AbortController().signal);

    if (result.error || !Array.isArray(result.data) || result.data.length === 0) {
      logFallback(result.error?.message || "Published historical tables are empty");
      return normalizedLocalData;
    }

    // Until all normalized related tables are published together, the reviewed
    // local package remains atomic so an exhibition never mixes partial versions.
    logFallback("Remote entity package is incomplete; using atomic local release");
    return normalizedLocalData;
  } catch (error) {
    logFallback(error?.message || "Historical data request failed");
    return normalizedLocalData;
  }
}

export const getEntityById = (id) => allHistoricalEntities.find((item) => item.id === id) || null;
export const getEventById = (id) => historicalEvents.find((item) => item.id === id) || null;
export const getPersonById = (id) => historicalPeople.find((item) => item.id === id) || null;
export const getPlaceById = (id) => exhibitionPlaces.find((item) => item.id === id) || null;
export { getGeometriesAtYear };
