import { describe, expect, it, vi, beforeEach } from "vitest";
import { historicalChanges } from "../../data/exhibition/historicalChanges.js";
import { historicalSources } from "../../data/exhibition/sources.js";
import {
  historicalStories,
  storyQuestions,
} from "../../data/exhibition/stories.js";
import { AGENT_ACTIONS } from "../agent/agentTypes.js";
import { runLocalHistoricalAgent } from "../agent/historicalAgentService.js";
import {
  GeometryDifferenceController,
  resetGeometryComparisonCacheForTests,
} from "./geometryDifferenceClient.js";
import {
  getHistoricalChange,
  shouldShowChangePrompt,
} from "./historicalChangeModel.js";
import {
  scheduleStoryAdvance,
  shouldPauseStoryForVisibility,
  validateHistoricalStory,
} from "./story/historicalStoryModel.js";

const localized = (value) => Boolean(value?.ru && value?.kk && value?.en);
const feature = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
  },
};

beforeEach(() => {
  resetGeometryComparisonCacheForTests();
});

describe("P1A historical change model", () => {
  it("returns the curated 1465 to 1511 change", () => {
    expect(getHistoricalChange(1465, 1511)).toMatchObject({
      id: "kazakh-khanate-1465-to-1511",
      isReversed: false,
      displayFromYear: 1465,
      displayToYear: 1511,
    });
  });

  it("supports reverse comparison without rewriting causes or consequences", () => {
    const forward = getHistoricalChange(1465, 1511);
    const reverse = getHistoricalChange(1511, 1465);
    expect(reverse).toMatchObject({
      isReversed: true,
      displayFromYear: 1511,
      displayToYear: 1465,
    });
    expect(reverse.causes).toEqual(forward.causes);
    expect(reverse.consequences).toEqual(forward.consequences);
    expect(reverse.changes[0].displayDirection).toBe("contracted");
  });

  it("does not invent causes for an arbitrary transition", () => {
    expect(getHistoricalChange(1465, 1936)).toBeNull();
  });

  it("shows a prompt only for a significant, not-yet-shown transition", () => {
    const shown = new Set();
    const prompt = shouldShowChangePrompt({
      fromYear: 1465,
      toYear: 1511,
      alreadyShown: shown,
    });
    expect(prompt?.change.id).toBe("kazakh-khanate-1465-to-1511");
    shown.add(prompt.signature);
    expect(
      shouldShowChangePrompt({ fromYear: 1465, toYear: 1511, alreadyShown: shown })
    ).toBeNull();
    expect(
      shouldShowChangePrompt({ fromYear: 1511, toYear: 1512, alreadyShown: shown })
    ).toBeNull();
    expect(
      shouldShowChangePrompt({
        fromYear: 1511,
        toYear: 1521,
        kioskAutoplay: true,
      })
    ).toBeNull();
  });

  it("references only source ids that exist", () => {
    const sourceIds = new Set(historicalSources.map((source) => source.id));
    historicalChanges.forEach((change) => {
      [
        ...change.sourceIds,
        ...change.changes.flatMap((entry) => entry.sourceIds),
        ...change.causes.flatMap((entry) => entry.sourceIds),
        ...change.consequences.flatMap((entry) => entry.sourceIds),
      ].forEach((sourceId) => expect(sourceIds.has(sourceId)).toBe(true));
    });
  });

  it("requires sources for every reviewed cause", () => {
    historicalChanges.flatMap((change) => change.causes).forEach((cause) => {
      expect(
        cause.sourceIds.length > 0 || cause.verificationStatus === "needs_review"
      ).toBe(true);
    });
  });
});

describe("P1A educational story", () => {
  it("has a valid ten-step story", () => {
    const story = historicalStories.find(
      (item) => item.id === "formation-and-consolidation-kazakh-khanate"
    );
    expect(validateHistoricalStory(story)).toBe(true);
    expect(story.steps).toHaveLength(10);
  });

  it("localizes every story step in RU, KZ and EN", () => {
    historicalStories
      .find((item) => item.id === "formation-and-consolidation-kazakh-khanate")
      .steps.forEach((step) => {
      expect(localized(step.titles)).toBe(true);
      expect(localized(step.narration)).toBe(true);
      expect(localized(step.simpleNarration)).toBe(true);
    });
  });

  it("clears the story timer", () => {
    const callback = vi.fn();
    const clearTimer = vi.fn();
    const cancel = scheduleStoryAdvance({
      callback,
      delay: 1000,
      setTimer: vi.fn(() => 42),
      clearTimer,
    });
    cancel();
    expect(clearTimer).toHaveBeenCalledWith(42);
  });

  it("pauses when the document is hidden", () => {
    expect(shouldPauseStoryForVisibility(true)).toBe(true);
    expect(shouldPauseStoryForVisibility(false)).toBe(false);
  });

  it("ships four reasoning questions with explanations and sources", () => {
    const p1aQuestions = storyQuestions.filter((question) =>
      ["reconstruction-boundaries", "compare-1465-1511", "formation-sources", "kasym-person"].includes(question.id)
    );
    expect(p1aQuestions).toHaveLength(4);
    expect(new Set(p1aQuestions.map((question) => question.type))).toEqual(
      new Set(["single-choice", "compare", "map-selection", "source-analysis"])
    );
    p1aQuestions.forEach((question) => {
      expect(localized(question.explanations)).toBe(true);
      expect(question.sourceIds.length).toBeGreaterThan(0);
    });
  });
});

describe("P1A geometry worker client and local agent", () => {
  it("caches geometry results by comparison key", async () => {
    let posted = 0;
    const worker = {
      onmessage: null,
      onerror: null,
      postMessage(message) {
        posted += 1;
        queueMicrotask(() =>
          this.onmessage({
            data: {
              requestId: message.requestId,
              ok: true,
              cached: false,
              durationMs: 2,
              result: { common: feature, added: null, lost: null, union: feature },
            },
          })
        );
      },
      terminate: vi.fn(),
    };
    const controller = new GeometryDifferenceController(() => worker);
    const request = {
      fromYear: 1465,
      toYear: 1511,
      entityId: "kazakh-khanate",
      first: feature,
      second: feature,
    };
    await controller.calculate(request);
    const cached = await controller.calculate(request);
    expect(posted).toBe(1);
    expect(cached.cached).toBe(true);
    controller.dispose();
  });

  it("surfaces a worker error as a recoverable comparison failure", async () => {
    const worker = {
      onmessage: null,
      onerror: null,
      postMessage(message) {
        queueMicrotask(() =>
          this.onmessage({
            data: {
              requestId: message.requestId,
              ok: false,
              error: "invalid polygon",
            },
          })
        );
      },
      terminate: vi.fn(),
    };
    const controller = new GeometryDifferenceController(() => worker);
    await expect(
      controller.calculate({
        fromYear: 1465,
        toYear: 1511,
        entityId: "kazakh-khanate",
        first: feature,
        second: feature,
      })
    ).rejects.toThrow("invalid polygon");
    expect(() => controller.dispose()).not.toThrow();
  });

  it("allows the existing local agent to open a change", () => {
    const result = runLocalHistoricalAgent("why-map-changed", "ru");
    expect(result.grounded).toBe(true);
    expect(result.actions).toContainEqual(
      expect.objectContaining({ type: AGENT_ACTIONS.SHOW_CHANGE })
    );
  });

  it("allows the existing local agent to start the story", () => {
    const result = runLocalHistoricalAgent("start-khanate-story", "ru");
    expect(result.actions).toContainEqual(
      expect.objectContaining({ type: AGENT_ACTIONS.START_STORY })
    );
  });
});
