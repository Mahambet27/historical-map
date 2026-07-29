const label = (id, entityId, validFromYear, validToYear, labelPoint, labelRotation = 0, labelSize = 24) => ({
  id, entityId, validFromYear, validToYear, labelPoint, labelRotation, labelSize,
});

export const entityLabels = [
  label("saka-label", "saka-communities", -800, -300, [68, 47], 0, 25),
  label("first-turkic-label", "first-turkic-khaganate", 552, 603, [70, 48], 0, 25),
  label("western-turkic-label", "western-turkic-khaganate", 604, 704, [68, 46.5]),
  label("turgesh-label", "turgesh-khaganate", 704, 756, [72.5, 44.5]),
  label("karluk-label", "karluk-state", 756, 840, [73, 44.2]),
  label("oghuz-label", "oghuz-state", 756, 942, [61, 45.5]),
  label("kimak-label", "kimak-khaganate", 840, 942, [76, 50.5]),
  label("karakhanid-label", "karakhanid-state", 840, 942, [70, 42.8]),
  label("kazakh-1465-label", "kazakh-khanate", 1465, 1509, [70.5, 46.5], 0, 27),
  label("kazakh-1510-label", "kazakh-khanate", 1510, 1512, [67.5, 47.5], 0, 28),
  label("kazakh-1513-label", "kazakh-khanate", 1513, 1521, [65.5, 48], 0, 29),
  label("kazakh-late-label", "kazakh-khanate", 1522, 1847, [67, 47.8], 0, 27),
  label("abulkhair-label", "abulkhair-state", 1428, 1468, [67, 50]),
  label("moghulistan-label", "moghulistan", 1347, 1514, [77, 44.5]),
  label("nogai-label", "nogai-horde", 1440, 1634, [53.5, 49]),
  label("timurid-label", "timurid-state", 1370, 1507, [66.5, 40.5]),
  label("sibir-label", "sibir-khanate", 1468, 1598, [74, 55]),
  label("dzungar-label", "dzungar-khanate", 1635, 1758, [81, 46.5]),
  label("bukhara-label", "bukhara-khanate", 1500, 1785, [65, 40.5]),
  label("khiva-label", "khiva-khanate", 1511, 1920, [58.5, 41.5]),
  label("russian-label", "russian-empire", 1721, 1847, [60, 55]),
  label("qing-label", "qing-empire", 1644, 1847, [88, 44]),
  label("kazakh-ssr-label", "kazakh-ssr", 1936, 1990, [67, 48], 0, 28),
  label("republic-label", "republic-kazakhstan", 1991, null, [67, 48], 0, 28),
];

export const getEntityLabelsAtYear = (year) =>
  entityLabels.filter(
    (item) => item.validFromYear <= year && (item.validToYear === null || item.validToYear >= year)
  );
