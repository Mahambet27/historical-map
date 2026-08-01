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

const aralSnapshot = (id, from, to, coordinates, status = "needs_review") => ({
  id,
  featureId: "aral-sea",
  featureType: "sea",
  validFromYear: from,
  validToYear: to,
  names: tr("Аральское море", "Арал теңізі", "Aral Sea"),
  descriptions: tr(
    "Демонстрационный временной контур. Требуется замена на проверенный локальный GeoJSON.",
    "Демонстрациялық уақыттық контур. Тексерілген жергілікті GeoJSON-мен ауыстыру қажет.",
    "Demonstration temporal outline. It must be replaced by verified local GeoJSON."
  ),
  geometry: polygon(coordinates),
  sourceIds: [],
  confidenceLevel: "low",
  verificationStatus: status,
  interpolationAllowed: false,
});

export const hydrologySnapshots = [
  aralSnapshot("aral-sea-circa-1960-demo", 1960, 1984, [[58.2, 43], [61.7, 43], [61.2, 46.5], [59.1, 46.8], [58.2, 43]], "demo_only"),
  aralSnapshot("aral-sea-circa-1985-demo", 1985, 1999, [[58.4, 43.2], [61.4, 43.2], [61, 46.3], [59.2, 46.5], [58.4, 43.2]]),
  aralSnapshot("aral-sea-circa-2000-demo", 2000, 2009, [[58.8, 43.5], [60.9, 43.5], [60.7, 45.8], [59.4, 46], [58.8, 43.5]]),
  aralSnapshot("aral-sea-circa-2010-demo", 2010, 2014, [[59, 43.8], [60.5, 43.8], [60.4, 45.4], [59.5, 45.6], [59, 43.8]]),
  aralSnapshot("aral-sea-modern-demo", 2015, null, [[59.1, 44], [60.3, 44], [60.2, 45.2], [59.6, 45.3], [59.1, 44]]),
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

