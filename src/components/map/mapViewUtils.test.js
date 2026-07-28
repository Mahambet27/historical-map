import { describe, expect, it } from "vitest";

import {
  distanceKm,
  getPlaceFavoriteId,
  hasPlaceMedia,
  localizePlace,
} from "./mapViewUtils.js";

const isValid = (coords) => Array.isArray(coords) && coords.length === 2;

describe("map view utilities", () => {
  it("calculates distance and rejects invalid coordinates", () => {
    expect(distanceKm([0, 0], [0, 1], isValid)).toBeCloseTo(111.19, 1);
    expect(distanceKm(null, [0, 1], isValid)).toBe(Number.POSITIVE_INFINITY);
  });

  it("localizes without mutating the place", () => {
    const place = {
      id: 1,
      name: "Original",
      translations: { ru: { name: "Перевод", short: "Кратко" } },
    };
    expect(localizePlace(place, "ru")).toMatchObject({ name: "Перевод", short: "Кратко" });
    expect(place.name).toBe("Original");
  });

  it("creates stable favorite ids and detects media", () => {
    expect(getPlaceFavoriteId({ id: 42 })).toBe("42");
    expect(getPlaceFavoriteId({ coords: [1, 2] })).toBe("1,2");
    expect(hasPlaceMedia({ images: ["photo.webp"] })).toBe(true);
    expect(hasPlaceMedia({ images: [] })).toBe(false);
  });
});
