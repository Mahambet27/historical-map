const normalizeLabel = (item) => {
  const value = item.labels || item.titles || item.names;
  if (Array.isArray(value)) {
    return Object.fromEntries(
      ["ru", "kk", "en"].map((language) => [
        language,
        value.find((name) => name.language === language)?.value ||
          value.find((name) => name.language === "ru")?.value ||
          item.id,
      ])
    );
  }
  return value || { ru: item.id, kk: item.id, en: item.id };
};

const queued = (itemType, item, reason) => ({
  itemType,
  itemId: item.id,
  label: normalizeLabel(item),
  reason,
  originalVerificationStatus: item.verificationStatus || "needs_review",
});

export const buildReviewQueue = ({
  claims = [],
  geometries = [],
  routes = [],
  places = [],
  hydrology = [],
  environment = [],
  archiveMaps = [],
  brokenSourceIds = [],
} = {}) => {
  const items = [
    ...claims.filter((item) => ["needs_review", "demo_only", "disputed"].includes(item.verificationStatus)).map((item) => queued("claim", item, "needs_review")),
    ...geometries.filter((item) => !item.sourceIds?.length).map((item) => queued("geometry", item, "missing_source")),
    ...routes.filter((item) => item.sourceIds?.length < 2).map((item) => queued("route", item, "insufficient_sources")),
    ...places.filter((item) => item.coordinatePrecision === "approximate").map((item) => queued("place", item, "approximate_coordinates")),
    ...hydrology.filter((item) => ["needs_review", "demo_only"].includes(item.verificationStatus)).map((item) => queued("hydrology", item, "demo_data")),
    ...environment.filter((item) => ["needs_review", "demo_only"].includes(item.verificationStatus)).map((item) => queued("environment", item, "demo_data")),
    ...archiveMaps.filter((item) => ["unknown", "restricted"].includes(item.license?.status)).map((item) => queued("archive_map", item, "license_restriction")),
    ...brokenSourceIds.map((id) => queued("source", { id }, "broken_reference")),
  ];
  return [...new Map(items.map((item) => [`${item.itemType}:${item.itemId}`, item])).values()];
};

export const mergeReviewState = (queue, reviews) => {
  const reviewByKey = new Map(reviews.map((review) => [`${review.itemType}:${review.itemId}`, review]));
  return queue.map((item) => ({
    ...item,
    localReview: reviewByKey.get(`${item.itemType}:${item.itemId}`) || null,
  }));
};
