import {
  eraRegistry,
  getEraRegistryEntry,
  getEraRegistryEntryAtYear,
} from "./eraRegistry.js";

// Compatibility projection for existing exhibition consumers.
export const historicalEras = eraRegistry.map((era) => ({
  ...era,
  startYear: era.fromYear,
  endYear: era.toYear,
  title: era.names,
}));

export const getEraAtYear = (year) => {
  const era = getEraRegistryEntryAtYear(year);
  return era ? historicalEras.find((item) => item.id === era.id) : null;
};

export const getEraById = (id) => {
  const era = getEraRegistryEntry(id);
  return era ? historicalEras.find((item) => item.id === era.id) : null;
};
