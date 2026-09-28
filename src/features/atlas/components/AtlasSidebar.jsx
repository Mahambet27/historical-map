import { atlasCategories, atlasEras, atlasLocal } from "../data/atlasDemoData.js";
import AtlasIcon from "./AtlasIcon.jsx";
import AtlasLayerControl from "./AtlasLayerControl.jsx";
export default function AtlasSidebar({
  currentEra,
  onEra,
  categories,
  onCategory,
  onReset,
  language,
  text,
  onClose,
  ...layerProps
}) {
  return (
    <aside className="atlas-sidebar" aria-label={text.sidebar}>
      <div className="atlas-sidebar-heading">
        <div>
          <span className="atlas-eyebrow">ATLAS / 01</span>
          <h2>{text.explorer}</h2>
        </div>
        <button
          className="atlas-icon-button atlas-drawer-close"
          aria-label={text.close}
          onClick={onClose}
        >
          <AtlasIcon name="close" />
        </button>
        <AtlasIcon name="compass" />
      </div>
      <div className="atlas-sidebar-scroll">
        <section aria-label={text.epochs}>
          <h3 className="atlas-section-title">
            {text.epochs}
            <span>08</span>
          </h3>
          <div className="atlas-epochs">
            {atlasEras.map((era) => (
              <button
                key={era.id}
                className="atlas-epoch"
                aria-pressed={currentEra.id === era.id}
                onClick={() => onEra(era.year)}
              >
                <span className="atlas-epoch-dot" />
                <span>{atlasLocal(era.name, language)}</span>
                <span aria-hidden="true">{currentEra.id === era.id ? "↗" : ""}</span>
              </button>
            ))}
          </div>
        </section>
        <fieldset className="atlas-category-control">
          <legend className="atlas-section-title">{text.categories}</legend>
          <div className="atlas-categories">
            {atlasCategories.map((category) => (
              <label key={category.id} className="atlas-category">
                <input
                  type="checkbox"
                  checked={categories.includes(category.id)}
                  onChange={() => onCategory(category.id)}
                />
                <span aria-hidden="true">{category.symbol}</span>
                <span>{atlasLocal(category.name, language)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <AtlasLayerControl {...layerProps} language={language} text={text} />
        <button className="atlas-reset-filters" onClick={onReset}>
          ↺ {text.reset}
        </button>
      </div>
      <div className="atlas-sidebar-foot">
        <span className="atlas-status-dot" />
        {text.demo}
        <span>v.01</span>
      </div>
    </aside>
  );
}
