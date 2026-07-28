export const setGeoJsonData = (map, sourceId, data) => {
  const source = map?.getSource(sourceId);
  if (!source?.setData) return false;
  source.setData(data);
  return true;
};

export default function useMapLayers(mapRef) {
  return {
    hasLayer: (id) => Boolean(mapRef.current?.getLayer(id)),
    hasSource: (id) => Boolean(mapRef.current?.getSource(id)),
    setData: (id, data) => setGeoJsonData(mapRef.current, id, data),
  };
}
