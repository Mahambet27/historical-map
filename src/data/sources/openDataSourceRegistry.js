import openDataSources from "../../../data-sources/open-data-sources.json";

export const openDataSourceRegistry = Object.freeze(openDataSources);

export const getOpenDataSource = (sourceId) =>
  openDataSourceRegistry.find((source) => source.id === sourceId) || null;

export const getEnabledOpenDataSources = () =>
  openDataSourceRegistry.filter((source) => source.enabled);
