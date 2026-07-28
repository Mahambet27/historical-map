import { describe, expect, it } from "vitest";
import { getTimelineStateAtYear, timelineStates } from "../../data/exhibition/timeline.js";
import { getGeometriesAtYear } from "../../data/exhibition/entityGeometries.js";
import { formatHistoricalYear } from "../../services/historicalTimelineService.js";
import { runLocalHistoricalAgent } from "../agent/historicalAgentService.js";
import { AGENT_ACTIONS } from "../agent/agentTypes.js";

describe("exhibition timeline", () => {
  it("formats BCE years in all supported languages", () => {
    expect(formatHistoricalYear(-550, "ru")).toBe("550 г. до н. э.");
    expect(formatHistoricalYear(-550, "kk")).toBe("б.з.д. 550 ж.");
    expect(formatHistoricalYear(-550, "en")).toBe("550 BCE");
  });

  it("chooses the nearest reviewed timeline state", () => {
    expect(getTimelineStateAtYear(1467).id).toBe("kazakh-khanate-1465");
    expect(getTimelineStateAtYear(1519).id).toBe("kasym-khan-1511");
    expect(timelineStates).toHaveLength(6);
  });

  it("filters time-valid geometry", () => {
    expect(getGeometriesAtYear(1465).some((item) => item.id === "khanate-1465")).toBe(true);
    expect(getGeometriesAtYear(1511).some((item) => item.id === "khanate-1511")).toBe(true);
    expect(getGeometriesAtYear(1511).some((item) => item.id === "khanate-1465")).toBe(false);
  });
});

describe("local historical agent", () => {
  it("returns grounded UI tools for an allow-listed prompt", () => {
    const result = runLocalHistoricalAgent("compare", "en");
    expect(result.grounded).toBe(true);
    expect(result.actions[0]).toEqual({
      type: AGENT_ACTIONS.COMPARE,
      payload: { firstYear: 1465, secondYear: 1511 },
    });
  });

  it("refuses unknown prompts without tools", () => {
    const result = runLocalHistoricalAgent("invent-an-answer", "ru");
    expect(result.grounded).toBe(false);
    expect(result.actions).toEqual([]);
  });
});
