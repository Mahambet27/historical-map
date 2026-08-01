const tr = (ru, kk, en) => ({ ru, kk, en });

export const ARCHIVE_GEOREFERENCE_TYPES = [
  "image-corners",
  "raster-tiles",
  "external-viewer",
  "unavailable-preview",
];

export const ARCHIVE_LICENSE_STATUSES = [
  "public_domain",
  "open_license",
  "permission_granted",
  "educational_use_only",
  "restricted",
  "unknown",
];

export const archiveMaps = [
  {
    id: "qhm-evidence-overlay-demo",
    titles: tr(
      "Учебная схема анализа исторических границ",
      "Тарихи шекараларды талдауға арналған оқу схемасы",
      "Educational historical-boundary analysis diagram"
    ),
    descriptions: tr(
      "Собственная образовательная реконструкция Qazaq Heritage Map. Не является архивным оригиналом.",
      "Qazaq Heritage Map жобасының оқу реконструкциясы. Архивтік түпнұсқа емес.",
      "An original Qazaq Heritage Map educational reconstruction. It is not an archival original."
    ),
    mapDate: 1465,
    mapDatePrecision: "approximate",
    validFromYear: 1400,
    validToYear: 1550,
    sourceId: "qhm-p1c-educational-overlay",
    sourceIds: ["qhm-p1c-educational-overlay"],
    institution: { name: "Qazaq Heritage Map", url: "/exhibition" },
    author: "Qazaq Heritage Map editorial team",
    publisher: "Qazaq Heritage Map",
    imageUrl: "/archive-maps/qhm-evidence-overlay.svg",
    thumbnailUrl: "/archive-maps/thumbnails/qhm-evidence-overlay.svg",
    georeferenceType: "image-corners",
    coordinates: [[45, 56], [88, 56], [88, 39], [45, 39]],
    bounds: [[45, 39], [88, 56]],
    coveredArea: tr("Центральная Азия", "Орталық Азия", "Central Asia"),
    defaultOpacity: 0.65,
    attribution: "© Qazaq Heritage Map, educational reconstruction, 2026",
    license: {
      status: "permission_granted",
      name: "Project-owned educational asset",
      url: null,
      attributionRequired: true,
      commercialUseAllowed: false,
      modificationAllowed: true,
      downloadAllowed: false,
      cacheAllowed: true,
      exportAllowed: false,
    },
    evidenceType: "educational_reconstruction",
    confidenceLevel: "low",
    verificationStatus: "reviewed",
  },
  {
    id: "future-institutional-archive-placeholder",
    titles: tr(
      "Будущее подключение архивной коллекции",
      "Архив қорын болашақта қосу",
      "Future institutional archive connection"
    ),
    descriptions: tr(
      "Только архитектурный placeholder: оригинал и изображение не подключены.",
      "Тек архитектуралық placeholder: түпнұсқа мен сурет қосылмаған.",
      "Architecture placeholder only: no original or image is connected."
    ),
    mapDate: null,
    mapDatePrecision: "unknown",
    validFromYear: null,
    validToYear: null,
    sourceId: "qhm-p1c-educational-overlay",
    sourceIds: ["qhm-p1c-educational-overlay"],
    institution: { name: "Institution to be confirmed", url: null },
    author: null,
    publisher: null,
    imageUrl: null,
    thumbnailUrl: null,
    georeferenceType: "unavailable-preview",
    coordinates: null,
    bounds: null,
    coveredArea: tr("Не определено", "Анықталмаған", "Not defined"),
    defaultOpacity: 0.65,
    attribution: "Rights and institution must be confirmed before display",
    license: {
      status: "unknown",
      name: null,
      url: null,
      attributionRequired: true,
      commercialUseAllowed: null,
      modificationAllowed: null,
      downloadAllowed: null,
      cacheAllowed: false,
      exportAllowed: false,
    },
    evidenceType: "historical_map",
    confidenceLevel: "low",
    verificationStatus: "needs_review",
  },
];

export const getArchiveMapById = (id) =>
  archiveMaps.find((map) => map.id === id) || null;
