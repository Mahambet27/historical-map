import { historicalSources } from "../data/exhibition/sources.js";

export const getHistoricalSources = async () => historicalSources;

export const getSourcesByIds = (ids = []) => {
  const requested = new Set(ids);
  return historicalSources.filter((source) => requested.has(source.id));
};

export const getVerifiedSourceCount = (ids = []) =>
  getSourcesByIds(ids).filter((source) =>
    ["reviewed", "verified"].includes(source.verificationStatus)
  ).length;
