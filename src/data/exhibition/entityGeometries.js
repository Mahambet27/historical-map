const feature = (
  id, entityId, validFromYear, validToYear, confidenceLevel, coordinates, sourceIds = [],
  verificationStatus = "needs_review"
) => ({
  id, entityId, validFromYear, validToYear,
  geometryType: "reconstruction",
  confidenceLevel,
  verificationStatus,
  sourceIds,
  geojson: {
    type: "Feature",
    id,
    properties: { id, entityId, confidenceLevel, verificationStatus, reconstruction: true },
    geometry: { type: "Polygon", coordinates: [coordinates] },
  },
});

export const entityGeometries = [
  feature("saka-550", "saka-communities", -800, -300, "low", [[48,44],[55,51],[72,54],[87,49],[83,41],[64,40],[48,44]], ["britannica-kazakhstan-history"], "reviewed"),
  feature("turkic-552", "first-turkic-khaganate", 552, 603, "low", [[46,41],[52,54],[75,58],[94,50],[88,39],[67,38],[46,41]], ["britannica-turkic-peoples"], "reviewed"),
  feature("western-turkic-604", "western-turkic-khaganate", 604, 703, "low", [[51,42],[55,52],[73,55],[84,48],[80,40],[63,39],[51,42]]),
  feature("turgesh-704", "turgesh-khaganate", 704, 755, "low", [[64,41],[68,47],[77,49],[82,44],[77,40],[69,40],[64,41]]),
  feature("karluk-756", "karluk-state", 756, 839, "low", [[65,41],[68,47],[78,48],[81,43],[75,40],[65,41]]),
  feature("oghuz-756", "oghuz-state", 756, 941, "low", [[50,43],[54,49],[66,50],[69,44],[62,40],[50,43]]),
  feature("kimak-840", "kimak-khaganate", 840, 941, "low", [[62,48],[68,55],[82,56],[86,49],[77,46],[62,48]]),
  feature("karakhanid-840", "karakhanid-state", 840, 941, "low", [[61,39],[65,45],[76,46],[80,40],[72,37],[61,39]]),

  feature("abulkhair-1428", "abulkhair-state", 1428, 1468, "low", [[51,45],[56,53],[69,55],[77,50],[72,44],[61,42],[51,45]]),
  feature("moghulistan-1347", "moghulistan", 1347, 1514, "low", [[68,40],[70,47],[82,49],[88,43],[81,38],[72,38],[68,40]]),
  feature("nogai-1440", "nogai-horde", 1440, 1634, "low", [[43,45],[47,53],[58,54],[63,48],[57,42],[48,42],[43,45]]),
  feature("timurid-1370", "timurid-state", 1370, 1507, "low", [[55,35],[59,43],[71,44],[76,37],[67,33],[55,35]]),
  feature("sibir-1468", "sibir-khanate", 1468, 1598, "low", [[61,52],[66,59],[82,60],[88,54],[79,50],[61,52]]),
  feature("khanate-1465", "kazakh-khanate", 1465, 1509, "medium", [[64,42],[69,44],[76,43],[78,47],[73,50],[66,49],[62,46],[64,42]], ["e-history-kazakh-khanate","cambridge-kazakh-history"], "reviewed"),
  feature("khanate-1510", "kazakh-khanate", 1510, 1512, "low", [[57,43],[61,51],[71,53],[80,48],[76,41],[65,40],[57,43]], ["e-history-kasym","cambridge-kazakh-history"], "reviewed"),
  feature("khanate-1513", "kazakh-khanate", 1513, 1521, "low", [[51,44],[56,51],[68,54],[81,49],[78,42],[65,40],[51,44]], ["e-history-kasym","cambridge-kazakh-history"], "reviewed"),
  feature("khanate-1522", "kazakh-khanate", 1522, 1634, "low", [[52,44],[57,52],[70,54],[80,48],[76,41],[63,40],[52,44]]),
  feature("khanate-1635", "kazakh-khanate", 1635, 1722, "low", [[51,44],[56,52],[70,54],[77,49],[73,42],[62,40],[51,44]]),
  feature("khanate-1723", "kazakh-khanate", 1723, 1730, "low", [[50,44],[55,52],[67,53],[73,48],[69,42],[59,40],[50,44]]),
  feature("khanate-1731", "kazakh-khanate", 1731, 1847, "low", [[49,44],[54,53],[68,54],[76,49],[73,41],[60,40],[49,44]]),
  feature("dzungar-1635", "dzungar-khanate", 1635, 1758, "low", [[73,41],[75,50],[85,52],[91,46],[87,39],[78,38],[73,41]]),
  feature("bukhara-1500", "bukhara-khanate", 1500, 1785, "low", [[57,37],[59,43],[69,44],[73,38],[66,35],[57,37]]),
  feature("khiva-1511", "khiva-khanate", 1511, 1847, "low", [[52,38],[53,45],[62,46],[65,40],[60,36],[52,38]]),
  feature("russian-1721", "russian-empire", 1721, 1847, "low", [[43,50],[47,61],[78,61],[82,54],[70,51],[55,50],[43,50]]),
  feature("qing-1644", "qing-empire", 1644, 1847, "low", [[82,37],[84,50],[96,53],[99,40],[91,34],[82,37]]),

  feature("kazakh-ssr-1936", "kazakh-ssr", 1936, 1990, "high", [[46.5,49.2],[51,55],[61,55.4],[72,54.2],[87.3,49.1],[85,46],[80,42],[67,40.7],[55,42.2],[46.5,49.2]], ["britannica-kazakhstan-history"], "reviewed"),
  feature("republic-1991", "republic-kazakhstan", 1991, null, "high", [[46.5,49.2],[51,55],[61,55.4],[72,54.2],[87.3,49.1],[85,46],[80,42],[67,40.7],[55,42.2],[46.5,49.2]], ["adilet-independence-law"], "verified"),
];

export const getGeometriesAtYear = (year) =>
  entityGeometries.filter(
    (item) => item.validFromYear <= year && (item.validToYear === null || item.validToYear >= year)
  );

export const getEntityGeometryAtYear = (entityId, year) =>
  getGeometriesAtYear(year).find((item) => item.entityId === entityId) || null;
