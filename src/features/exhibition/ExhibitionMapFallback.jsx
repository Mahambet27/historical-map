import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { getEntityLabelsAtYear } from "../../data/exhibition/entityLabels.js";
import {
  getFallbackEntitiesAtYear,
  projectExhibitionCoordinate,
} from "./mapDataUtils.js";
import {
  buildEnvironmentCollection,
  buildHistoricalPlaceCollections,
  buildHydrologyCollection,
  buildRouteCollections,
} from "./p1bMapDataUtils.js";
import { getUncertaintyStyle } from "./uncertaintyStyleRegistry.js";
import { isRecordAllowedInOfficialDemo } from "./officialDemoMode.js";

const entityById = new Map(allHistoricalEntities.map((entity) => [entity.id, entity]));
const local = (value, language) => value?.[language] || value?.ru || "";

const polygonPath = (coordinates, offsetY = 0) =>
  coordinates
    .map((coordinate, index) => {
      const point = projectExhibitionCoordinate(coordinate);
      return `${index ? "L" : "M"}${point.x.toFixed(1)} ${(point.y + offsetY).toFixed(1)}`;
    })
    .join(" ") + "Z";
const linePath = (coordinates) =>
  coordinates
    .map((coordinate, index) => {
      const point = projectExhibitionCoordinate(coordinate);
      return `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(" ");

const getOuterRing = (geometry) =>
  geometry?.type === "MultiPolygon"
    ? geometry.coordinates?.[0]?.[0] || []
    : geometry?.coordinates?.[0] || [];

export default function ExhibitionMapFallback({
  selectedYear,
  language,
  text,
  comparison,
  selectedEntityId,
  onSelectEntity,
  activeLayers,
  layerState,
  p1bData,
  selectedRouteId,
  selectedPlaceId,
  onSelectRoute,
  onSelectPlace,
  archiveMap,
  archiveOverlayEnabled = false,
  archiveOpacity = 0.65,
  effectiveQuality = "auto",
  officialDemo = false,
}) {
  const territories = getFallbackEntitiesAtYear(selectedYear)
    .filter(
      ({ geometry }) =>
        !officialDemo || isRecordAllowedInOfficialDemo(geometry)
    )
    .sort(
    (a, b) => Number(a.entity.id === selectedEntityId) - Number(b.entity.id === selectedEntityId)
    );
  const labels = getEntityLabelsAtYear(selectedYear);
  const comparisonTerritories = comparison
    ? [
        ...getFallbackEntitiesAtYear(comparison.firstYear).map((entry) => ({
          ...entry,
          comparisonRole: "first",
        })),
        ...getFallbackEntitiesAtYear(comparison.secondYear).map((entry) => ({
          ...entry,
          comparisonRole: "second",
        })),
      ]
    : [];
  const differenceTerritories =
    comparison?.mode === "changes" && comparison.geometryResult
      ? ["common", "added", "lost"]
          .filter((role) => comparison.geometryResult[role])
          .map((role) => ({
            role,
            geometry: comparison.geometryResult[role].geometry,
          }))
      : [];
  const visible = (id) =>
    activeLayers
      ? activeLayers.includes(id)
      : Boolean(layerState?.[id]);
  const environment = p1bData
    ? buildEnvironmentCollection(p1bData.environmentSnapshots, selectedYear, language)
    : { features: [] };
  const hydrology = p1bData
    ? buildHydrologyCollection(p1bData.hydrologySnapshots, selectedYear, language)
    : { features: [] };
  const places = p1bData
    ? buildHistoricalPlaceCollections(
        p1bData.historicalSettlements,
        selectedYear,
        language
      )
    : { places: { features: [] }, archaeology: { features: [] } };
  const routes = p1bData
    ? buildRouteCollections(
        p1bData.historicalRoutes,
        p1bData.routeSegments,
        selectedYear,
        language
      )
    : { trade: { features: [] }, nomadic: { features: [] }, military: { features: [] } };

  return (
    <div className="ex-map-fallback" role="group" aria-label={`${text.mapLabel}. ${text.mapUnavailable}`}>
      <svg viewBox="0 0 900 430" aria-hidden="true">
        <defs>
          <filter id="ex-soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#02080d" floodOpacity=".58" />
          </filter>
          <pattern id="ex-review-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#fff" strokeWidth="1" opacity=".08" />
          </pattern>
        </defs>
        <rect width="900" height="430" fill="var(--ex-map-bg, #d5d7d9)" />
        {archiveOverlayEnabled && archiveMap?.imageUrl && (
          <image
            href={archiveMap.imageUrl}
            x="0"
            y="0"
            width="900"
            height="430"
            opacity={archiveOpacity}
            preserveAspectRatio="none"
          />
        )}
        {visible("terrain") && effectiveQuality !== "light" && (
          <path
            className="ex-map-fallback__terrain"
            d={polygonPath([[67.5, 39.5], [82, 39.5], [81, 44.3], [70, 44], [67.5, 39.5]])}
          />
        )}
        {visible("environment") && environment.features.map((feature) => (
          <path
            key={feature.id}
            className={`ex-map-fallback__environment is-${feature.properties.environmentType}`}
            d={polygonPath(getOuterRing(feature.geometry))}
          />
        ))}
        {visible("hydrology") && hydrology.features.map((feature) => (
          <path
            key={feature.id}
            className="ex-map-fallback__historical-water"
            d={
              feature.geometry.type === "LineString"
                ? linePath(feature.geometry.coordinates)
                : polygonPath(getOuterRing(feature.geometry))
            }
          />
        ))}

        {comparison?.mode !== "changes" && comparisonTerritories.map(({ geometry, comparisonRole }) => (
          <path
            key={`compare-${comparisonRole}-${geometry.id}`}
            className={`ex-map-fallback__comparison-territory is-${comparisonRole}`}
            d={polygonPath(geometry.geojson.geometry.coordinates[0])}
          />
        ))}
        {differenceTerritories.map(({ role, geometry }) => (
          <path
            key={`difference-${role}`}
            className={`ex-map-fallback__comparison-territory is-${role}`}
            d={polygonPath(getOuterRing(geometry))}
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
              {visible("uncertainty") && (
                <path
                  d={path}
                  className={`ex-map-fallback__uncertainty is-${getUncertaintyStyle(geometry).status}`}
                />
              )}
              {geometry.verificationStatus === "needs_review" && <path d={path} fill="url(#ex-review-pattern)" />}
            </g>
          );
        })}
        {visible("tradeRoutes") && routes.trade.features.map((feature) => (
          <path
            key={feature.id}
            className={`ex-map-fallback__route is-trade ${feature.properties.routeId === selectedRouteId ? "is-selected" : ""}`}
            d={linePath(feature.geometry.coordinates)}
            onClick={() => onSelectRoute?.(feature.properties.routeId)}
          />
        ))}
        {visible("nomadicRoutes") && routes.nomadic.features.map((feature) => (
          <path key={feature.id} className="ex-map-fallback__route is-nomadic" d={linePath(feature.geometry.coordinates)} />
        ))}
        {visible("militaryRoutes") && routes.military.features.map((feature) => (
          <path key={feature.id} className="ex-map-fallback__route is-military" d={linePath(feature.geometry.coordinates)} />
        ))}
        {[
          ...(visible("historicalPlaces") ? places.places.features : []),
          ...(visible("archaeology") ? places.archaeology.features : []),
        ].map((feature) => {
          const point = projectExhibitionCoordinate(feature.geometry.coordinates);
          const selected = feature.id === selectedPlaceId;
          return (
            <g key={feature.id} onClick={() => onSelectPlace?.(feature.id)} role="button">
              <circle
                cx={point.x}
                cy={point.y}
                r={selected ? 7 : 4.5}
                className={`ex-map-fallback__historical-place ${selected ? "is-selected" : ""}`}
              />
              <text className="ex-map-fallback__place-label" x={point.x + 7} y={point.y - 6}>
                {feature.properties.label}
              </text>
            </g>
          );
        })}

        {visible("stateLabels") && labels.map((item) => {
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

      </svg>
      {archiveOverlayEnabled && archiveMap && (
        <div className="ex-archive-attribution">
          <strong>{archiveMap.attribution}</strong>
          <span>{Math.round(archiveOpacity * 100)}%</span>
        </div>
      )}

      <aside className="ex-map-legend" aria-label={text.mapLegend}>
        <strong>{text.mapLegend}</strong>
        {territories.map(({ entity, geometry }) => (
          <button key={entity.id} onClick={() => onSelectEntity?.(entity.id)}>
            <i style={{ background: entity.color, borderColor: entity.borderColor }} />
            <span>{local(entity.names, language)}</span>
            {geometry.verificationStatus === "needs_review" && <small title={text.needsReview}>○</small>}
          </button>
        ))}
        <div className="ex-uncertainty-legend">
          <strong>
            {language === "en"
              ? "Reconstruction precision and status"
              : language === "kk"
                ? "Реконструкция дәлдігі мен мәртебесі"
                : "Точность и статус реконструкции"}
          </strong>
          <span><i className="is-solid" />{language === "en" ? "Reviewed/generalized" : "Проверенная/обобщённая"}</span>
          <span><i className="is-soft" />{language === "en" ? "Approximate" : "Приблизительная"}</span>
          <span><i className="is-patterned" />{language === "en" ? "Disputed/schematic" : "Спорная/схематическая"}</span>
        </div>
      </aside>
      <div className="ex-map-fallback__status">
        <span>◈</span>
        <div><strong>{text.mapUnavailable}</strong><small>{text.mapUnavailableDetail}</small></div>
      </div>
    </div>
  );
}
