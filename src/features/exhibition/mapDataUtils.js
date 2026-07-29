import { getGeometriesAtYear } from "../../data/exhibition/entityGeometries.js";
import { allHistoricalEntities } from "../../data/exhibition/entities.js";
import { getEntityStyle } from "./theme/entityStyleRegistry.js";

const entityById = new Map(allHistoricalEntities.map((entity) => [entity.id, entity]));
const local = (value, language) => value?.[language] || value?.ru || "";

export const buildTerritoryCollection = (selectedYear) => ({
  type: "FeatureCollection",
  features: getGeometriesAtYear(selectedYear).map((item) => {
    const entity = entityById.get(item.entityId);
    const style = getEntityStyle(item.entityId);
    return {
      ...item.geojson,
      id: item.id,
      properties: {
        ...item.geojson.properties,
        label: local(entity?.names, "ru"),
        color: style.color,
        borderColor: style.borderColor,
        extrusionColor: style.extrusionColor,
        pattern: style.pattern,
      },
    };
  }),
});

export const projectExhibitionCoordinate = ([lng, lat]) => ({
  x: 34 + ((lng - 38) / 63) * 832,
  y: 398 - ((lat - 31) / 32) * 354,
});

export const getFallbackEntitiesAtYear = (year) =>
  getGeometriesAtYear(year)
    .map((geometry) => ({ geometry, entity: entityById.get(geometry.entityId) }))
    .filter((item) => item.entity);
