import { parseLayerUrlParam } from "./layerState.js";

const ROUTE_ALIASES = {
  "silk-road": "silk-road-southern-kazakhstan",
  "silk-road-southern-kazakhstan": "silk-road-southern-kazakhstan",
};
const PLACE_IDS = new Set([
  "taraz",
  "otrar",
  "sayram",
  "turkistan",
  "syganak",
  "saraishyk",
  "balasagun",
  "ispidjab",
]);
const STORY_ALIASES = {
  "silk-road-geography": "silk-road-geography",
};

export const parseP1BUrlState = (search = window.location.search) => {
  try {
    const params = new URLSearchParams(search);
    const route = ROUTE_ALIASES[params.get("route")] || null;
    const placeValue = params.get("place");
    const story = STORY_ALIASES[params.get("story")] || null;
    const atmosphereValue = params.get("atmosphere");
    return {
      layers: parseLayerUrlParam(params.get("layers")),
      route,
      place: PLACE_IDS.has(placeValue) ? placeValue : null,
      story,
      atmosphere:
        atmosphereValue === "false"
          ? false
          : atmosphereValue === "true"
            ? true
            : null,
    };
  } catch {
    return { layers: [], route: null, place: null, story: null, atmosphere: null };
  }
};

