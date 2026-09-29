export const TERRAIN_SOURCE = "atlas-local-dem";
export const HILLSHADE_SOURCE = "atlas-local-hillshade-dem";
export const HILLSHADE_LAYER = "atlas-local-hillshade";
export const TERRAIN_MANIFEST = "/maps/terrain/terrain.json";
export const terrainEnabled = (env = {}) => env.VITE_ATLAS_TERRAIN_ENABLED === "true";

export function validateTerrainManifest(data) {
  if (
    data?.encoding !== "terrarium" ||
    data.tileSize !== 256 ||
    data.tiles?.length !== 1 ||
    data.tiles[0] !== "/maps/terrain/{z}/{x}/{y}.png" ||
    !Number.isInteger(data.minzoom) ||
    !Number.isInteger(data.maxzoom) ||
    data.minzoom !== 0 ||
    data.maxzoom < 0 ||
    data.maxzoom > 14 ||
    !Array.isArray(data.bounds) ||
    data.bounds.length !== 4 ||
    !data.bounds.every(Number.isFinite) ||
    data.bounds[0] < -180 ||
    data.bounds[2] > 180 ||
    data.bounds[1] < -85.051129 ||
    data.bounds[3] > 85.051129 ||
    data.bounds[0] >= data.bounds[2] ||
    data.bounds[1] >= data.bounds[3]
  ) {
    throw new Error("Invalid local Terrarium manifest");
  }
  return {
    type: "raster-dem",
    tiles: data.tiles,
    encoding: data.encoding,
    tileSize: data.tileSize,
    minzoom: data.minzoom,
    maxzoom: data.maxzoom,
    bounds: data.bounds,
    ...(data.provenance?.attribution ? { attribution: data.provenance.attribution } : {}),
  };
}

// Optional renderer resource; failures must never replace the working basemap.
export function attachAtlasTerrain(map, enabled, fetcher = fetch) {
  if (!enabled) return () => {};
  const controller = new AbortController();
  let disposed = false;
  const disable = () => {
    if (disposed) return;
    map.setTerrain(null);
    if (map.getLayer(HILLSHADE_LAYER)) map.removeLayer(HILLSHADE_LAYER);
    for (const id of [TERRAIN_SOURCE, HILLSHADE_SOURCE]) {
      if (map.getSource(id)) map.removeSource(id);
    }
  };
  const onError = (event) => {
    if ([TERRAIN_SOURCE, HILLSHADE_SOURCE].includes(event.sourceId)) disable();
  };
  map.on("error", onError);
  fetcher(TERRAIN_MANIFEST, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error("Local DEM unavailable");
      return response.json();
    })
    .then((data) => {
      if (disposed) return;
      const source = validateTerrainManifest(data);
      map.addSource(TERRAIN_SOURCE, source);
      map.addSource(HILLSHADE_SOURCE, { ...source });
      const before = map
        .getStyle()
        .layers.find((layer) => ["line", "symbol", "circle"].includes(layer.type))?.id;
      map.addLayer(
        {
          id: HILLSHADE_LAYER,
          type: "hillshade",
          source: HILLSHADE_SOURCE,
          paint: { "hillshade-exaggeration": 0.35 },
        },
        before
      );
      map.setTerrain({ source: TERRAIN_SOURCE, exaggeration: 1 });
    })
    .catch(() => {
      if (!disposed) disable();
    });
  return () => {
    disposed = true;
    controller.abort();
    map.off("error", onError);
  };
}
