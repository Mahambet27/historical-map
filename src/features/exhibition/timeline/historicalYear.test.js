import { describe, expect, it } from "vitest";
import { eraRegistry } from "../../../data/exhibition/eraRegistry.js";
import {
  clampYearToEra,
  formatHistoricalYear,
  getNextHistoricalYear,
  getPreviousHistoricalYear,
  historicalYearToSliderIndex,
  isValidHistoricalYear,
  normalizeHistoricalYear,
  sliderIndexToHistoricalYear,
} from "./historicalYear.js";
import {
  getAvailableDataForYear,
  getKeyYearsForEra,
  hasExactSnapshot,
  hasIntervalData,
} from "./timelineAvailability.js";
import {
  resolveTimelineUrlState,
  writeTimelineUrlState,
} from "../historicalYearModel.js";

describe("historical year", () => {
  it("rejects year zero and normalizes it out of datasets", () => {
    expect(isValidHistoricalYear(0)).toBe(false);
    expect(normalizeHistoricalYear(0)).toBe(1);
  });

  it("crosses BCE/CE without year zero", () => {
    expect(getNextHistoricalYear(-1)).toBe(1);
    expect(getPreviousHistoricalYear(1)).toBe(-1);
  });

  it.each([
    ["ru", "550 г. до н. э."],
    ["kk", "б.з.д. 550 ж."],
    ["en", "550 BCE"],
  ])("formats BCE in %s", (language, expected) => {
    expect(formatHistoricalYear(-550, language)).toBe(expected);
  });

  it("clamps a year to an era", () => {
    const era = eraRegistry.find((item) => item.id === "turkic");
    expect(clampYearToEra(100, era)).toBe(552);
    expect(clampYearToEra(1200, era)).toBe(942);
  });

  it("round-trips every accessible slider index", () => {
    const era = { fromYear: -2, toYear: 2, defaultYear: -1 };
    expect([0, 1, 2, 3].map((index) => sliderIndexToHistoricalYear(index, era))).toEqual([
      -2,
      -1,
      1,
      2,
    ]);
    expect(historicalYearToSliderIndex(1, era)).toBe(2);
  });
});

describe("era registry and URL state", () => {
  it("keeps all key years inside canonical era ranges", () => {
    for (const era of eraRegistry) {
      expect(era.keyYears.every((year) => year >= era.fromYear && year <= era.toYear)).toBe(true);
      expect(era.keyYears).not.toContain(0);
    }
  });

  it("keeps adjacent canonical era ranges non-overlapping", () => {
    for (let index = 1; index < eraRegistry.length; index += 1) {
      expect(eraRegistry[index - 1].toYear).toBeLessThan(
        eraRegistry[index].fromYear
      );
    }
  });

  it("restores and clamps era/year from URL", () => {
    expect(resolveTimelineUrlState("?era=turkic&year=100").selectedYear).toBe(552);
    expect(resolveTimelineUrlState("?era=kazakh-khanate&year=1511")).toMatchObject({
      selectedEraId: "kazakh-khanate",
      selectedYear: 1511,
    });
  });

  it("never writes year zero to URL", () => {
    writeTimelineUrlState("turkic", 0);
    expect(new URL(window.location.href).searchParams.get("year")).toBe("1");
  });
});

describe("timeline availability", () => {
  it("distinguishes exact and interval data", () => {
    expect(hasExactSnapshot(1465)).toBe(true);
    expect(hasIntervalData(1466)).toBe(true);
    expect(getAvailableDataForYear(1466).status).not.toBe("unavailable");
  });

  it("returns canonical key years", () => {
    expect(getKeyYearsForEra("kazakh-khanate")).toContain(1465);
  });
});
