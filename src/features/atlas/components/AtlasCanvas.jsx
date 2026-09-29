import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { createAtlasMap } from "../map/createAtlasMap.js";
import { atlasLocal, atlasYear } from "../data/atlasDemoData.js";
import AtlasPlaceholderCanvas from "./AtlasPlaceholderCanvas.jsx";

export default function AtlasCanvas(props) {
  const {
    geojson,
    historical,
    onSelectEntity,
    objects,
    selectedId,
    onSelect,
    year,
    era,
    language,
    text,
    onResetFilters,
    layers,
  } = props;
  const container = useRef(null);
  const renderer = useRef(null);
  const [status, setStatus] = useState("loading");
  const failed = status === "error";
  useEffect(() => {
    if (failed) return undefined;
    let mounted = true;
    const notify = (next) => {
      if (mounted) setStatus(next);
    };
    try {
      renderer.current = createAtlasMap(container.current, notify);
    } catch {
      queueMicrotask(() => notify("error"));
    }
    return () => {
      mounted = false;
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [failed]);
  useEffect(() => {
    renderer.current?.update({
      geojson,
      historical,
      layers,
      selectedId,
      onSelect,
      onSelectEntity,
      text,
    });
  }, [geojson, historical, layers, selectedId, onSelect, onSelectEntity, text, failed]);
  if (failed)
    return (
      <div className="atlas-map-fallback" data-map-status="error">
        <AtlasPlaceholderCanvas
          {...props}
          objects={objects.filter((object) => object.position)}
          layers={{ ...layers, territories: false, borders: false }}
          text={{ ...text, pending: text.mapError }}
        />
      </div>
    );
  return (
    <section
      className="atlas-canvas atlas-gis-canvas"
      id="atlas-map"
      tabIndex={-1}
      aria-label={text.map}
      data-map-status={status}
    >
      <div ref={container} className="atlas-maplibre-container" />
      <div className="atlas-map-heading">
        <span className="atlas-eyebrow">
          {text.region} / {atlasYear(year, language)}
        </span>
        <h1>{atlasLocal(era.name, language)}</h1>
        <p>{text.scope}</p>
      </div>
      {!geojson.features.length && (
        <div className="atlas-map-empty" role="status">
          <p>{text.noObjects}</p>
          <button onClick={onResetFilters}>{text.reset}</button>
        </div>
      )}
      <div className="atlas-map-status" role="status">
        {status === "loading" ? text.mapLoading : text.mapBasemap}
      </div>
    </section>
  );
}
