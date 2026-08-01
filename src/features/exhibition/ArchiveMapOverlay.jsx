export default function ArchiveMapOverlay({ archiveMap, language, opacity }) {
  if (!archiveMap) return null;
  const description =
    archiveMap.descriptions?.[language] || archiveMap.descriptions?.ru || "";
  return (
    <aside
      className="ex-archive-attribution"
      aria-label={`${description} ${archiveMap.attribution}`}
    >
      <strong>{archiveMap.attribution}</strong>
      <span>{Math.round(opacity * 100)}%</span>
    </aside>
  );
}
