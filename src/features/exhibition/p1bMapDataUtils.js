const emptyCollection = () => ({ type: "FeatureCollection", features: [] });
const local = (value, language) => value?.[language] || value?.ru || "";
const activeAtYear = (item, year) =>
  item.validFromYear <= year &&
  (item.validToYear === null || item.validToYear >= year);
const activeName = (place, year, language) => {
  const names = place.names.filter(
    (entry) =>
      entry.validFromYear <= year &&
      (entry.validToYear === null || entry.validToYear >= year)
  );
  const latestNames = [...place.names].sort(
    (a, b) => b.validFromYear - a.validFromYear
  );
  return (
    names.find((entry) => entry.language === language)?.value ||
    names.find((entry) => entry.language === "ru")?.value ||
    latestNames.find((entry) => entry.language === language)?.value ||
    latestNames.find((entry) => entry.language === "ru")?.value ||
    ""
  );
};

const copyFeature = (feature, id, properties) => ({
  ...feature,
  id,
  properties: { ...(feature?.properties || {}), id, ...properties },
});

export const buildEnvironmentCollection = (snapshots = [], year, language) => ({
  type: "FeatureCollection",
  features: snapshots
    .filter((item) => activeAtYear(item, year))
    .map((item) =>
      copyFeature(item.geojson, item.id, {
        label: local(item.names, language),
        environmentType: item.environmentType,
        verificationStatus: item.verificationStatus,
      })
    ),
});

export const buildHydrologyCollection = (snapshots = [], year, language) => {
  const candidates = snapshots.filter((item) => item.validFromYear <= year);
  const latestByFeature = new Map();
  candidates.forEach((item) => {
    const current = latestByFeature.get(item.featureId);
    if (
      activeAtYear(item, year) &&
      (!current || item.validFromYear > current.validFromYear)
    ) {
      latestByFeature.set(item.featureId, item);
    }
  });
  return {
    type: "FeatureCollection",
    features: [...latestByFeature.values()].map((item) =>
      copyFeature(item.geometry, item.id, {
        featureId: item.featureId,
        featureType: item.featureType,
        label: local(item.names, language),
        verificationStatus: item.verificationStatus,
      })
    ),
  };
};

export const buildHistoricalPlaceCollections = (
  settlements = [],
  year,
  language
) => {
  const collections = {
    places: emptyCollection(),
    archaeology: emptyCollection(),
  };
  settlements
    .filter((item) => activeAtYear(item, year))
    .forEach((item) => {
      const feature = {
        type: "Feature",
        id: item.id,
        properties: {
          id: item.id,
          label: activeName(item, year, language),
          placeTypes: item.placeType.join(","),
          verificationStatus: item.verificationStatus,
          coordinatePrecision: item.coordinatePrecision,
        },
        geometry: { type: "Point", coordinates: item.coordinates },
      };
      const target = item.placeType.includes("archaeological_site")
        ? "archaeology"
        : "places";
      collections[target].features.push(feature);
    });
  return collections;
};

export const buildRouteCollections = (
  routes = [],
  segments = [],
  year,
  language
) => {
  const collections = {
    trade: emptyCollection(),
    nomadic: emptyCollection(),
    military: emptyCollection(),
  };
  routes.filter((route) => activeAtYear(route, year)).forEach((route) => {
    const target =
      route.routeType === "nomadic_seasonal"
        ? "nomadic"
        : ["military_campaign", "diplomatic_mission"].includes(route.routeType)
          ? "military"
          : "trade";
    segments
      .filter(
        (segment) =>
          segment.routeId === route.id && activeAtYear(segment, year)
      )
      .forEach((segment) => {
        collections[target].features.push(
          copyFeature(segment.geometry, segment.id, {
            routeId: route.id,
            label: local(route.names, language),
            routeType: route.routeType,
            order: segment.order,
            verificationStatus: segment.verificationStatus,
          })
        );
      });
  });
  return collections;
};

export const buildEmptyP1BCollections = () => ({
  environment: emptyCollection(),
  hydrology: emptyCollection(),
  places: emptyCollection(),
  archaeology: emptyCollection(),
  trade: emptyCollection(),
  nomadic: emptyCollection(),
  military: emptyCollection(),
});
