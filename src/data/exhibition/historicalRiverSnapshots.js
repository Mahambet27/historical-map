const line = (coordinates) => ({
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates },
});
const names = {
  "syr-darya": { ru: "Сырдарья", kk: "Сырдария", en: "Syr Darya" },
  ili: { ru: "Или", kk: "Іле", en: "Ili" },
  irtysh: { ru: "Иртыш", kk: "Ертіс", en: "Irtysh" },
  ural: { ru: "Урал", kk: "Жайық", en: "Ural" },
  chu: { ru: "Чу", kk: "Шу", en: "Chu" },
  talas: { ru: "Талас", kk: "Талас", en: "Talas" },
};

const river = (id, featureId, coordinates, sourceIds = []) => ({
  id,
  featureId,
  featureType: "river",
  names: names[featureId],
  validFromYear: 500,
  validToYear: 1500,
  geometry: line(coordinates),
  sourceIds,
  confidenceLevel: "low",
  verificationStatus: "needs_review",
  geometryPrecision: "generalized",
  interpolationAllowed: false,
  geometrySourceType: "educational_generalization",
  reconstructionMethod: "generalized historical corridor; not a metric channel",
});

// Only historically relevant generalized corridors are included. They are
// explicitly review-gated and must not be interpreted as modern river channels.
export const historicalRiverSnapshots = [
  river("syr-darya-medieval", "syr-darya", [[70.5, 41.2], [68.2, 42.7], [65, 44], [61.2, 45.2]], ["unesco-silk-roads"]),
  river("ili-medieval", "ili", [[80.2, 43.5], [77.5, 43.7], [75.2, 45]], ["unesco-silk-roads"]),
  river("irtysh-medieval", "irtysh", [[84.5, 47.5], [82, 49], [79.5, 51]], ["unesco-silk-roads"]),
  river("ural-medieval", "ural", [[55.2, 51.2], [52.5, 49.5], [51.4, 47]], ["unesco-silk-roads"]),
  river("chu-medieval", "chu", [[75.5, 42.8], [73.7, 43.3], [70.5, 44]], ["unesco-silk-roads"]),
  river("talas-medieval", "talas", [[72.7, 42.5], [71.4, 42.9], [69.8, 43.5]], ["unesco-silk-roads"]),
];
