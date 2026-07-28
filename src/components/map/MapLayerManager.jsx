export default function MapLayerManager({
  showHistoricalBorders,
  showMapObjects,
  setShowHistoricalBorders,
  setShowMapObjects,
}) {
  return (
    <div className="hm-layer-manager" aria-label="Слои карты">
      <strong>Слои</strong>
      <label>
        <input type="checkbox" checked={showMapObjects} onChange={(event) => setShowMapObjects(event.target.checked)} />
        Исторические объекты
      </label>
      <label>
        <input type="checkbox" checked={showHistoricalBorders} onChange={(event) => setShowHistoricalBorders(event.target.checked)} />
        Исторические границы
      </label>
    </div>
  );
}
