export function flyToPlace(map, coords, opts = {}) {
  if (!map || !coords) return;

  map.flyTo({
    center: coords,
    zoom: opts.zoom ?? 13.8,
    pitch: opts.pitch ?? 75,
    bearing: opts.bearing ?? 30,
    speed: opts.speed ?? 0.75,
    curve: opts.curve ?? 1.5,
    essential: true,
  });
}

export function flyToInitial(map, initialView) {
  if (!map) return;

  map.flyTo({
    ...initialView,
    speed: 0.9,
    curve: 1.4,
    essential: true,
  });
}

export function cinematicPlace(map, coords) {
  if (!map || !coords) return;

  map.flyTo({
    center: coords,
    zoom: 14.2,
    pitch: 78,
    bearing: 25,
    speed: 0.65,
    curve: 1.65,
    essential: true,
  });
}