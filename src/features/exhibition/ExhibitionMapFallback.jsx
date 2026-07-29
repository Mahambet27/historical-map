import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { getEntityLabelsAtYear } from "../../data/exhibition/entityLabels.js";
import {
  getFallbackEntitiesAtYear,
  projectExhibitionCoordinate,
} from "./mapDataUtils.js";

const entityById = new Map(allHistoricalEntities.map((entity) => [entity.id, entity]));
const local = (value, language) => value?.[language] || value?.ru || "";

const polygonPath = (coordinates, offsetY = 0) =>
  coordinates
    .map((coordinate, index) => {
      const point = projectExhibitionCoordinate(coordinate);
      return `${index ? "L" : "M"}${point.x.toFixed(1)} ${(point.y + offsetY).toFixed(1)}`;
    })
    .join(" ") + "Z";

export default function ExhibitionMapFallback({
  selectedYear,
  activeSnapshot,
  language,
  text,
  comparison,
  selectedEntityId,
  onSelectEntity,
}) {
  const territories = getFallbackEntitiesAtYear(selectedYear).sort(
    (a, b) => Number(a.entity.id === selectedEntityId) - Number(b.entity.id === selectedEntityId)
  );
  const labels = getEntityLabelsAtYear(selectedYear);
  const comparisonTerritories = comparison
    ? getFallbackEntitiesAtYear(comparison.secondYear)
    : [];

  return (
    <div className="ex-map-fallback" role="img" aria-label={`${text.mapLabel}. ${text.mapUnavailable}`}>
      <svg viewBox="0 0 900 430" aria-hidden="true">
        <defs>
          <radialGradient id="ex-sea" cx="55%" cy="45%">
            <stop offset="0" stopColor="#17434c" />
            <stop offset="1" stopColor="#081a25" />
          </radialGradient>
          <filter id="ex-soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#02080d" floodOpacity=".58" />
          </filter>
          <pattern id="ex-review-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#fff" strokeWidth="1" opacity=".08" />
          </pattern>
        </defs>
        <rect width="900" height="430" fill="url(#ex-sea)" />
        <path className="ex-map-fallback__grid" d="M0 90H900M0 170H900M0 250H900M0 330H900M150 0V430M300 0V430M450 0V430M600 0V430M750 0V430" />
        <path className="ex-map-fallback__water" d="M33 170C65 148 102 159 115 212C126 255 84 304 27 298Z" />

        {comparisonTerritories.map(({ geometry }) => (
          <path
            key={`compare-${geometry.id}`}
            className="ex-map-fallback__comparison-territory"
            d={polygonPath(geometry.geojson.geometry.coordinates[0])}
          />
        ))}

        {territories.map(({ geometry, entity }) => {
          const path = polygonPath(geometry.geojson.geometry.coordinates[0]);
          const selected = entity.id === selectedEntityId;
          return (
            <g
              key={geometry.id}
              className={`ex-map-fallback__territory ${selected ? "is-selected" : ""}`}
              onClick={() => onSelectEntity?.(entity.id)}
              role="button"
            >
              <path d={polygonPath(geometry.geojson.geometry.coordinates[0], selected ? 9 : 6)} fill={entity.extrusionColor} opacity=".58" />
              <path
                d={path}
                fill={entity.color}
                stroke={entity.borderColor}
                strokeWidth={selected ? 3.2 : 2}
                opacity={selected ? ".92" : ".72"}
                filter="url(#ex-soft-shadow)"
              />
              {geometry.verificationStatus === "needs_review" && <path d={path} fill="url(#ex-review-pattern)" />}
            </g>
          );
        })}

        {labels.map((item) => {
          const entity = entityById.get(item.entityId);
          const point = projectExhibitionCoordinate(item.labelPoint);
          if (!entity) return null;
          return (
            <text
              key={item.id}
              className="ex-map-fallback__entity-label"
              x={point.x}
              y={point.y - (entity.id === selectedEntityId ? 10 : 5)}
              transform={`rotate(${item.labelRotation} ${point.x} ${point.y})`}
            >
              {local(entity.names, language)}
            </text>
          );
        })}

        {(activeSnapshot?.placeIds || []).slice(0, 4).map((placeId) => {
          const knownPoints = { "chu-valley": [73.7,43.3], turkistan: [68.25,43.3], saraishyk: [51.73,47.05], almaty: [76.89,43.24], astana: [71.43,51.13] };
          const coordinate = knownPoints[placeId];
          if (!coordinate) return null;
          const point = projectExhibitionCoordinate(coordinate);
          return <circle key={placeId} cx={point.x} cy={point.y} r="4" className="ex-map-fallback__point" />;
        })}
      </svg>

      <aside className="ex-map-legend" aria-label={text.mapLegend}>
        <strong>{text.mapLegend}</strong>
        {territories.map(({ entity, geometry }) => (
          <button key={entity.id} onClick={() => onSelectEntity?.(entity.id)}>
            <i style={{ background: entity.color, borderColor: entity.borderColor }} />
            <span>{local(entity.names, language)}</span>
            {geometry.verificationStatus === "needs_review" && <small title={text.needsReview}>○</small>}
          </button>
        ))}
      </aside>
      <div className="ex-map-fallback__status">
        <span>◈</span>
        <div><strong>{text.mapUnavailable}</strong><small>{text.mapUnavailableDetail}</small></div>
      </div>
    </div>
  );
}
