import { allHistoricalEntities } from "../../../data/exhibition/entities.js";

const fallback = {
  color: "#69757c",
  borderColor: "#d5dde1",
  extrusionColor: "#475159",
};

const makeStyle = (entity) => {
  const base = {
    color: entity.color || fallback.color,
    borderColor: entity.borderColor || fallback.borderColor,
    extrusionColor: entity.extrusionColor || fallback.extrusionColor,
  };
  return {
    ...base,
    default: { fill: base.color, line: base.borderColor, opacity: 0.58 },
    hover: { fill: base.color, line: "#fff4d6", opacity: 0.72 },
    selected: { fill: base.color, line: "#ffffff", opacity: 0.84 },
    label: { color: "#fff7df", halo: "#07121b" },
    pattern: entity.verificationStatus === "needs_review" ? "review-dash" : "solid",
  };
};

export const entityStyleRegistry = Object.freeze(
  Object.fromEntries(allHistoricalEntities.map((entity) => [entity.id, makeStyle(entity)]))
);

export const getEntityStyle = (entityId) => entityStyleRegistry[entityId] || makeStyle(fallback);

