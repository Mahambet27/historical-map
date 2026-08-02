import {
  canCalculateAreaPrecisely,
  canCalculateDistancePrecisely,
  getSpatialPrecision,
} from "./spatialPrecision.js";

export const SCIENTIFIC_CALCULATION_COPY = Object.freeze({
  visualEstimate: "Визуальная оценка по реконструированному контуру",
  notPreciseTerritory: "Не является точным измерением исторической территории",
  differentGeneralization: "Геометрии имеют различную степень обобщения",
  educationalComparison: "Сравнение предназначено для образовательной визуализации",
});

const decision = (allowed, mode, warnings = []) => ({
  allowed,
  mode,
  warnings,
});

export const evaluateScientificCalculation = ({
  type,
  records = [],
  curatedClaim = false,
  compatibleSnapshots = false,
} = {}) => {
  const precisions = records.map(getSpatialPrecision);
  if (type === "area") {
    return canCalculateAreaPrecisely(records[0])
      ? decision(true, "precise")
      : decision(false, "visual_estimate", [
          SCIENTIFIC_CALCULATION_COPY.visualEstimate,
          SCIENTIFIC_CALCULATION_COPY.notPreciseTerritory,
        ]);
  }
  if (["route_length", "place_distance"].includes(type)) {
    return records.every(canCalculateDistancePrecisely)
      ? decision(true, "precise")
      : decision(false, "visual_estimate", [
          SCIENTIFIC_CALCULATION_COPY.differentGeneralization,
        ]);
  }
  if (type === "snapshot_percent_change") {
    return compatibleSnapshots &&
      new Set(precisions).size === 1 &&
      records.every(canCalculateAreaPrecisely)
      ? decision(true, "precise")
      : decision(false, "visual_estimate", [
          SCIENTIFIC_CALCULATION_COPY.differentGeneralization,
        ]);
  }
  if (type === "expansion_direction") {
    return curatedClaim
      ? decision(true, "curated_interpretation")
      : decision(false, "hidden", [
          SCIENTIFIC_CALCULATION_COPY.educationalComparison,
        ]);
  }
  if (type === "turf_difference") {
    return decision(true, "visual_estimate", [
      SCIENTIFIC_CALCULATION_COPY.visualEstimate,
      SCIENTIFIC_CALCULATION_COPY.educationalComparison,
    ]);
  }
  if (type === "route_duration") {
    return precisions.includes("schematic")
      ? decision(false, "hidden", [
          SCIENTIFIC_CALCULATION_COPY.differentGeneralization,
        ])
      : decision(false, "visual_estimate");
  }
  return decision(false, "unavailable");
};

