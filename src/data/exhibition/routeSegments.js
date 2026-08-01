const line = (coordinates) => ({
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates },
});

const segment = (id, order, fromPlaceId, toPlaceId, coordinates) => ({
  id,
  routeId: "silk-road-southern-kazakhstan",
  order,
  fromPlaceId,
  toPlaceId,
  validFromYear: 700,
  validToYear: 1500,
  mode: "caravan",
  season: "all",
  geometry: line(coordinates),
  estimatedDurationDays: null,
  durationStatus: "unknown",
  sourceIds: ["unesco-silk-roads"],
  confidenceLevel: "low",
  verificationStatus: "needs_review",
});

export const routeSegments = [
  segment("silk-sayram-taraz", 1, "sayram", "taraz", [[69.76, 42.3], [70.5, 42.55], [71.37, 42.9]]),
  segment("silk-taraz-otrar", 2, "taraz", "otrar", [[71.37, 42.9], [70.2, 42.6], [69.2, 42.65], [68.3, 42.85]]),
  segment("silk-otrar-turkistan", 3, "otrar", "turkistan", [[68.3, 42.85], [68.15, 43.05], [68.25, 43.3]]),
  segment("silk-turkistan-syganak", 4, "turkistan", "syganak", [[68.25, 43.3], [67.2, 43.7], [66.02, 44.17]]),
];

export const getRouteSegments = (routeId, year) =>
  routeSegments
    .filter(
      (item) =>
        item.routeId === routeId &&
        item.validFromYear <= year &&
        (item.validToYear === null || item.validToYear >= year)
    )
    .sort((a, b) => a.order - b.order);
