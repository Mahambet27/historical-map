export const ARCHIVE_SOURCE_ID = "archive-map-overlay";
export const ARCHIVE_LAYER_ID = "archive-map-overlay-layer";

export const clampArchiveOpacity = (value) =>
  Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0.65));

export const removeArchiveOverlay = (map) => {
  if (!map) return;
  if (map.getLayer(ARCHIVE_LAYER_ID)) map.removeLayer(ARCHIVE_LAYER_ID);
  if (map.getSource(ARCHIVE_SOURCE_ID)) map.removeSource(ARCHIVE_SOURCE_ID);
};

export const mountArchiveOverlay = ({
  map,
  archiveMap,
  opacity = 0.65,
  reducedMotion = false,
  beforeId,
}) => {
  removeArchiveOverlay(map);
  if (!map || !archiveMap?.imageUrl || archiveMap.coordinates?.length !== 4) {
    return () => removeArchiveOverlay(map);
  }
  map.addSource(ARCHIVE_SOURCE_ID, {
    type: "image",
    url: archiveMap.imageUrl,
    coordinates: archiveMap.coordinates,
  });
  map.addLayer(
    {
      id: ARCHIVE_LAYER_ID,
      type: "raster",
      source: ARCHIVE_SOURCE_ID,
      paint: {
        "raster-opacity": clampArchiveOpacity(opacity),
        "raster-fade-duration": reducedMotion ? 0 : 250,
      },
    },
    beforeId && map.getLayer(beforeId) ? beforeId : undefined
  );
  return () => removeArchiveOverlay(map);
};

export const updateArchiveOverlayOpacity = (map, opacity) => {
  if (map?.getLayer(ARCHIVE_LAYER_ID)) {
    map.setPaintProperty(ARCHIVE_LAYER_ID, "raster-opacity", clampArchiveOpacity(opacity));
  }
};
