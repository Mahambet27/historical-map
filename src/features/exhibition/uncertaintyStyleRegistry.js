import { getScientificReadiness } from "./scientificReadiness.js";
import { getSpatialPrecision } from "./spatialPrecision.js";

const style = (
  status,
  linePattern,
  opacity,
  blur,
  width,
  fillPattern,
  ariaLabel
) => ({
  status,
  linePattern,
  opacity,
  blur,
  width,
  fillPattern,
  ariaLabel,
});

export const UNCERTAINTY_STYLE_REGISTRY = Object.freeze({
  solid: style("solid", null, 0.95, 0, 2, "solid", {
    ru: "Проверенная или обобщённая граница",
    kk: "Тексерілген немесе жалпыланған шекара",
    en: "Reviewed or generalized boundary",
  }),
  "soft-edge": style("soft-edge", null, 0.66, 2, 4, "soft-bands", {
    ru: "Приблизительная реконструкция",
    kk: "Шамамен реконструкция",
    en: "Approximate reconstruction",
  }),
  patterned: style("patterned", [6, 3, 1, 3], 0.82, 0, 3, "crosshatch", {
    ru: "Спорная интерпретация",
    kk: "Даулы түсіндіру",
    en: "Disputed interpretation",
  }),
  hidden: style("hidden", null, 0, 0, 0, "none", {
    ru: "Геометрия недоступна",
    kk: "Геометрия қолжетімсіз",
    en: "Geometry unavailable",
  }),
  schematic: style("schematic", [2, 3], 0.72, 0, 2, "dots", {
    ru: "Демонстрационная схема",
    kk: "Демонстрациялық схема",
    en: "Demonstration schematic",
  }),
});

export const getUncertaintyVariant = (record) => {
  const readiness = getScientificReadiness(record);
  const precision = getSpatialPrecision(record);
  if (readiness === "unavailable") return "hidden";
  if (readiness === "disputed") return "patterned";
  if (readiness === "demo_only" || precision === "schematic") return "schematic";
  if (["approximate", "coarse_reconstruction", "unknown"].includes(precision)) {
    return "soft-edge";
  }
  return "solid";
};

export const getUncertaintyStyle = (
  record,
  { quality = "auto", theme = "light" } = {}
) => {
  const base = UNCERTAINTY_STYLE_REGISTRY[getUncertaintyVariant(record)];
  return {
    ...base,
    blur: quality === "light" ? 0 : base.blur,
    width: theme === "high-contrast" ? Math.max(3, base.width) : base.width,
    monochromePattern:
      base.status === "patterned"
        ? "crosshatch"
        : base.status === "schematic"
          ? "dots"
          : base.fillPattern,
    svg: {
      strokeDasharray: base.linePattern?.join(" ") || "none",
      fillPattern: base.fillPattern,
      opacity: base.opacity,
    },
  };
};

