const tr = (ru, kk, en) => ({ ru, kk, en });
const polygon = (coordinates) => ({
  type: "Feature",
  properties: {},
  geometry: { type: "Polygon", coordinates: [coordinates] },
});

export const HYDROLOGY_TYPES = [
  "river",
  "lake",
  "sea",
  "delta",
  "historical_channel",
  "reservoir",
  "wetland",
];

const aralSnapshot = ({
  id,
  snapshotYear,
  from,
  to,
  coordinates,
  status = "needs_review",
  sourceIds = [],
  geometrySourceType = "educational_generalization",
  reconstructionMethod = "generalized outline; not metrically precise",
  confidenceLevel = "low",
}) => ({
  id,
  featureId: "aral-sea",
  featureType: "sea",
  snapshotYear,
  validFromYear: from,
  validToYear: to,
  names: tr("Аральское море", "Арал теңізі", "Aral Sea"),
  descriptions: tr(
    "Демонстрационный временной контур. Требуется замена на проверенный локальный GeoJSON.",
    "Демонстрациялық уақыттық контур. Тексерілген жергілікті GeoJSON-мен ауыстыру қажет.",
    "Demonstration temporal outline. It must be replaced by verified local GeoJSON."
  ),
  geometry: polygon(coordinates),
  sourceIds,
  confidenceLevel,
  verificationStatus: status,
  interpolationAllowed: false,
  geometrySourceType,
  reconstructionMethod,
  geometryPrecision: "generalized",
});

export const hydrologySnapshots = [
  aralSnapshot({
    id: "aral-sea-historical-coarse",
    snapshotYear: 1500,
    from: 500,
    to: 1959,
    coordinates: [[58.15, 43], [61.75, 43], [61.25, 46.55], [59.05, 46.85], [58.15, 43]],
    reconstructionMethod: "coarse pre-shrinkage historical context; not metrically precise",
  }),
  aralSnapshot({
    id: "aral-sea-circa-1960-demo",
    snapshotYear: 1960,
    from: 1960,
    to: 1984,
    coordinates: [[58.2, 43], [61.7, 43], [61.2, 46.5], [59.1, 46.8], [58.2, 43]],
    status: "demo_only",
  }),
  aralSnapshot({
    id: "aral-sea-circa-1985-demo",
    snapshotYear: 1985,
    from: 1985,
    to: 1999,
    coordinates: [[58.4, 43.2], [61.4, 43.2], [61, 46.3], [59.2, 46.5], [58.4, 43.2]],
  }),
  aralSnapshot({
    id: "aral-sea-circa-2000-demo",
    snapshotYear: 2000,
    from: 2000,
    to: 2009,
    coordinates: [[58.8, 43.5], [60.9, 43.5], [60.7, 45.8], [59.4, 46], [58.8, 43.5]],
  }),
  aralSnapshot({
    id: "aral-sea-circa-2010-demo",
    snapshotYear: 2010,
    from: 2010,
    to: 2014,
    coordinates: [[59, 43.8], [60.5, 43.8], [60.4, 45.4], [59.5, 45.6], [59, 43.8]],
  }),
  aralSnapshot({
    id: "aral-sea-modern-demo",
    snapshotYear: 2015,
    from: 2015,
    to: null,
    coordinates: [[59.1, 44], [60.3, 44], [60.2, 45.2], [59.6, 45.3], [59.1, 44]],
  }),
];

export const getHydrologySnapshotAtYear = (
  featureId,
  year,
  snapshots = hydrologySnapshots
) =>
  snapshots
    .filter(
      (item) =>
        item.featureId === featureId &&
        item.validFromYear <= year &&
        (item.validToYear === null || item.validToYear >= year)
    )
    .sort((a, b) => b.validFromYear - a.validFromYear)[0] || null;

export const getHydrologySnapshotsAtYear = (year) => {
  const featureIds = [...new Set(hydrologySnapshots.map((item) => item.featureId))];
  return featureIds
    .map((featureId) => getHydrologySnapshotAtYear(featureId, year))
    .filter(Boolean);
};
