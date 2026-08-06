const within = (value, from, to) =>
  (from == null || value >= from) && (to == null || value <= to);

export const getCanonicalPlaceId = (record) =>
  record.canonicalPlaceId ||
  (record.wikidataId ? `wikidata:${record.wikidataId}` : null) ||
  (record.pleiadesId ? `pleiades:${record.pleiadesId}` : null) ||
  `${record.sourceId}:${record.sourceRecordId}`;

export const getHistoricalNames = (place) =>
  (place.names || []).filter(
    (name) => name.nameType === "historical" || name.historical === true
  );

export const getPlaceNameAtYear = (place, year, language = "ru") =>
  getHistoricalNames(place)
    .filter((name) => within(year, name.validFromYear, name.validToYear))
    .find((name) => name.language === language)?.value || null;

export const getCoordinatesWithPrecision = (place) =>
  place.coordinates
    ? {
        coordinates: place.coordinates,
        spatialPrecision: place.spatialPrecision || "unknown",
        sourceIds: place.coordinateSourceIds || place.sourceIds || [],
      }
    : null;

export const getPlaceSourceConflicts = (place) => {
  const assertions = place.coordinateAssertions || [];
  if (assertions.length < 2) return [];
  const first = JSON.stringify(assertions[0].coordinates);
  return assertions
    .slice(1)
    .filter((item) => JSON.stringify(item.coordinates) !== first)
    .map((item) => ({
      type: "coordinate_conflict",
      sourceIds: [assertions[0].sourceId, item.sourceId],
    }));
};

const duplicateKey = (record) =>
  record.wikidataId ||
  record.pleiadesId ||
  `${record.type || "place"}:${(record.names || [])
    .map((item) => item.value?.toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|")}`;

export const mergeOpenPlaceRecords = (records) => {
  const groups = new Map();
  for (const record of records) {
    const key = duplicateKey(record);
    const current = groups.get(key) || [];
    current.push(record);
    groups.set(key, current);
  }
  return [...groups.values()].map((group) => ({
    ...group[0],
    canonicalPlaceId: getCanonicalPlaceId(group[0]),
    sourceIds: [...new Set(group.flatMap((item) => item.sourceIds || []))],
    sourceRecordIds: [
      ...new Set(group.flatMap((item) => item.sourceRecordIds || [])),
    ],
    names: group.flatMap((item) => item.names || []),
    verificationStatus: "needs_review",
    possibleDuplicateCount: group.length,
  }));
};
