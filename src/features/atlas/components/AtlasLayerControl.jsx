import { atlasLayers, atlasLocal } from "../data/atlasDemoData.js";
export default function AtlasLayerControl({ layers, onToggle, language, text }) {
  return (
    <fieldset className="atlas-layer-control">
      <legend className="atlas-section-title">{text.layers}</legend>
      {atlasLayers.map((layer) => (
        <label className={`atlas-layer ${layer.future ? "atlas-layer-future" : ""}`} key={layer.id}>
          <input
            type="checkbox"
            role="switch"
            aria-label={atlasLocal(layer.name, language)}
            checked={layers[layer.id]}
            onChange={() => onToggle(layer.id)}
            disabled={layer.future}
          />
          <span className="atlas-toggle" aria-hidden="true" />
          <span>{atlasLocal(layer.name, language)}</span>
          {layer.future && <small>{text.soon}</small>}
        </label>
      ))}
    </fieldset>
  );
}
