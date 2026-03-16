export const MAP_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

export const INITIAL_VIEW = {
  center: [83.6, 47.6],
  zoom: 8.6,
  pitch: 58,
  bearing: -18,
};

export const ERAS = [
  "Қола дәуірі",
  "Сақ дәуірі",
  "Түркі кезеңі",
  "Қазақ хандығы",
  "КСРО",
  "Қазіргі кезең",
];

export const LAYER_IDS = {
  tarbagatai: {
    source: "tarbagatai",
    fill: "tarbagatai-fill",
    outline: "tarbagatai-outline",
    glow: "tarbagatai-glow",
    hover: "tarbagatai-hover",
  },
  zaysan: {
    source: "zaysan",
    fill: "zaysan-fill",
    outline: "zaysan-outline",
    glow: "zaysan-glow",
    hover: "zaysan-hover",
  },
  route: {
    source: "driving-route",
    line: "driving-route-line",
    glow: "driving-route-glow",
  },
};