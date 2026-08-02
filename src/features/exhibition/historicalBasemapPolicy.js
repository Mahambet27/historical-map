export const HISTORICAL_BASEMAP_POLICY = Object.freeze({
  showModernLabels: false,
  showModernRoads: false,
  showModernBuildings: false,
  showModernAdministrativeBorders: false,
  showModernHydrology: false,
  showModernPoi: false,
  showModernSettlements: false,
  showModernTerrainLabels: false,
  allowHistoricalLabelsOnly: true,
  allowHistoricalHydrologyOnly: true,
  allowHistoricalPlacesOnly: true,
});

export const HISTORICAL_BASEMAP_STYLE_NAME =
  "Qazaq Heritage Neutral Historical Base";

export const HISTORICAL_BACKGROUND_COLORS = Object.freeze({
  era: "#d5d7d9",
  light: "#d7d9dc",
  dark: "#25282c",
  atlas: "#d8d1c2",
  "high-contrast": "#161616",
});

export const createHistoricalBasemapStyle = (backgroundColor = "#d5d7d9") => ({
  version: 8,
  name: HISTORICAL_BASEMAP_STYLE_NAME,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: {},
  layers: [
    {
      id: "historical-neutral-background",
      type: "background",
      paint: { "background-color": backgroundColor },
    },
  ],
});

const FORBIDDEN = {
  labels: /(label|place|poi|settlement|airport|transit)/i,
  roads: /(road|street|bridge|rail|motorway|path|tunnel)/i,
  buildings: /(building|structure)/i,
  administrativeBorders: /(admin|boundary|border)/i,
  hydrology: /(water|river|lake|ocean|sea|coast)/i,
};

const isVisible = (layer) =>
  layer?.layout?.visibility !== "none" &&
  layer?.id !== "historical-neutral-background" &&
  !String(layer?.id || "").startsWith("historical-") &&
  !String(layer?.id || "").startsWith("ex-") &&
  !String(layer?.id || "").startsWith("archive-");

export const inspectHistoricalBasemap = (style = {}) => {
  const visible = (style.layers || []).filter(isVisible);
  const violations = Object.fromEntries(
    Object.entries(FORBIDDEN).map(([key, pattern]) => [
      key,
      visible.filter((layer) => pattern.test(`${layer.id} ${layer["source-layer"] || ""}`)),
    ])
  );
  return {
    modernLabelsVisible: violations.labels.length > 0,
    modernRoadsVisible: violations.roads.length > 0,
    modernBuildingsVisible: violations.buildings.length > 0,
    modernAdministrativeBordersVisible: violations.administrativeBorders.length > 0,
    modernHydrologyVisible: violations.hydrology.length > 0,
    violations,
    passed:
      visible.length === 0 &&
      Object.values(violations).every((items) => items.length === 0),
  };
};

export const validateHistoricalBasemap = (map) =>
  inspectHistoricalBasemap(map?.getStyle?.() || {});

