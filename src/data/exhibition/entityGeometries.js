const feature = (id, entityId, validFromYear, validToYear, confidenceLevel, coordinates, sourceIds) => ({
  id,
  entityId,
  validFromYear,
  validToYear,
  geometryType: "reconstruction",
  confidenceLevel,
  sourceIds,
  geojson: {
    type: "Feature",
    properties: { id, entityId, confidenceLevel, reconstruction: true },
    geometry: { type: "Polygon", coordinates: [coordinates] },
  },
});

export const entityGeometries = [
  feature("saka-550", "saka-communities", -800, -300, "low", [[48, 44], [55, 51], [72, 54], [87, 49], [83, 41], [64, 40], [48, 44]], ["britannica-kazakhstan-history"]),
  feature("turkic-552", "first-turkic-khaganate", 552, 603, "low", [[46, 41], [52, 54], [75, 58], [94, 50], [88, 39], [67, 38], [46, 41]], ["britannica-turkic-peoples"]),
  feature("khanate-1465", "kazakh-khanate", 1465, 1510, "medium", [[64, 42], [69, 44], [76, 43], [78, 47], [73, 50], [66, 49], [62, 46], [64, 42]], ["e-history-kazakh-khanate", "cambridge-kazakh-history"]),
  feature("khanate-1511", "kazakh-khanate", 1511, 1521, "low", [[51, 44], [56, 51], [68, 54], [81, 49], [78, 42], [65, 40], [51, 44]], ["e-history-kasym", "cambridge-kazakh-history"]),
  feature("kazakh-ssr-1936", "kazakh-ssr", 1936, 1991, "high", [[46.5, 49.2], [51, 55], [61, 55.4], [72, 54.2], [87.3, 49.1], [85, 46], [80, 42], [67, 40.7], [55, 42.2], [46.5, 49.2]], ["britannica-kazakhstan-history"]),
  feature("republic-1991", "republic-kazakhstan", 1991, null, "high", [[46.5, 49.2], [51, 55], [61, 55.4], [72, 54.2], [87.3, 49.1], [85, 46], [80, 42], [67, 40.7], [55, 42.2], [46.5, 49.2]], ["adilet-independence-law"]),
];

export const getGeometriesAtYear = (year) =>
  entityGeometries.filter(
    (item) =>
      item.validFromYear <= year && (item.validToYear === null || item.validToYear >= year)
  );
