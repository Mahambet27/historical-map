import AtlasIcon from "./AtlasIcon.jsx";
export default function AtlasMobileToolbar({
  onFilters,
  onMap,
  onObject,
  sidebarOpen,
  hasObject,
  text,
}) {
  return (
    <nav className="atlas-mobile-toolbar" aria-label={text.explorer}>
      <button
        onClick={onFilters}
        aria-expanded={sidebarOpen}
        aria-controls={sidebarOpen ? "atlas-sidebar" : undefined}
      >
        <AtlasIcon name="layers" size={19} />
        {text.filters}
      </button>
      <button onClick={onMap}>
        <AtlasIcon name="compass" size={19} />
        {text.map}
      </button>
      <button onClick={onObject} disabled={!hasObject}>
        <AtlasIcon name="pin" size={19} />
        {text.objects}
      </button>
    </nav>
  );
}
