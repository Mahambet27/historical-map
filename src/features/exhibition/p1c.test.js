import { describe, expect, it, vi } from "vitest";
import { historicalSources } from "../../data/exhibition/sources.js";
import { entityGeometries } from "../../data/exhibition/entityGeometries.js";
import { sourceClaims } from "../../data/exhibition/sourceClaims.js";
import { archiveMaps } from "../../data/exhibition/archiveMaps.js";
import { sourceDisputes } from "../../data/exhibition/sourceDisputes.js";
import { historicalStories, storyQuestions } from "../../data/exhibition/stories.js";
import {
  canCacheArchiveMap,
  canDisplayFullArchiveMap,
} from "./archiveMapRights.js";
import { getEvidenceStatus } from "./evidenceStatusRegistry.js";
import {
  CITATION_FORMATS,
  exportClaimsWithSources,
  formatCitation,
} from "./citationFormatter.js";
import { validateEvidenceData } from "./evidenceValidation.js";
import {
  buildReviewQueue,
  mergeReviewState,
} from "./review/reviewQueueModel.js";
import {
  createLocalReviewRecord,
  exportReviewReport,
  upsertLocalReview,
} from "./review/localReviewStore.js";
import {
  clampArchiveOpacity,
  mountArchiveOverlay,
  removeArchiveOverlay,
} from "./archiveMapOverlayUtils.js";
import { parseP1CUrlState } from "./p1cUrlState.js";
import { runLocalHistoricalAgent } from "../agent/historicalAgentService.js";
import { AGENT_ACTIONS } from "../agent/agentTypes.js";
import {
  loadArchiveData,
  resetP1CDataLoaderForTests,
} from "./p1cDataLoader.js";

const sourceIds = new Set(historicalSources.map((source) => source.id));
const displayable = archiveMaps.find(canDisplayFullArchiveMap);
const unknown = archiveMaps.find((map) => map.license.status === "unknown");

describe("P1C evidence models", () => {
  it("all claim sources exist", () => {
    expect(sourceClaims.every((claim) => claim.sourceIds.every((id) => sourceIds.has(id)))).toBe(true);
  });

  it("verified claims cannot omit sources", () => {
    const result = validateEvidenceData({
      sources: historicalSources,
      claims: [{ id: "bad", verificationStatus: "verified", sourceIds: [], labels: { ru: "a", kk: "a", en: "a" } }],
    });
    expect(result.errors.some((error) => error.code === "verified_claim_without_source")).toBe(true);
  });

  it("reviewed claims cannot rely only on needs_review sources", () => {
    const result = validateEvidenceData({
      sources: [{ id: "draft", verificationStatus: "needs_review", url: "https://example.test" }],
      claims: [{ id: "bad", verificationStatus: "reviewed", sourceIds: ["draft"], labels: { ru: "a", kk: "a", en: "a" } }],
    });
    expect(result.errors.some((error) => error.code === "reviewed_claim_only_unreviewed_sources")).toBe(true);
  });

  it("every archive map has an explicit licence status", () => {
    expect(archiveMaps.every((map) => map.license?.status)).toBe(true);
  });

  it("restricted and unknown maps cannot be displayed or cached", () => {
    expect(canDisplayFullArchiveMap({ imageUrl: "/x", georeferenceType: "image-corners", license: { status: "restricted" } })).toBe(false);
    expect(canDisplayFullArchiveMap(unknown)).toBe(false);
    expect(canCacheArchiveMap(unknown)).toBe(false);
  });

  it("the project-owned map can display and cache", () => {
    expect(canDisplayFullArchiveMap(displayable)).toBe(true);
    expect(canCacheArchiveMap(displayable)).toBe(true);
  });

  it("image-corners maps contain four coordinates", () => {
    expect(archiveMaps.filter((map) => map.georeferenceType === "image-corners").every((map) => map.coordinates.length === 4)).toBe(true);
  });

  it("every evidence status has text, icon and pattern", () => {
    sourceClaims.forEach((claim) => {
      const status = getEvidenceStatus(claim);
      expect(status.icon).toBeTruthy();
      expect(status.pattern).toBeTruthy();
      expect(status.label.ru && status.label.kk && status.label.en).toBeTruthy();
    });
  });

  it("citation formatter supports every requested format", () => {
    CITATION_FORMATS.forEach((format) => {
      expect(formatCitation(historicalSources[0], format, "ru")).toBeTruthy();
    });
  });

  it("claims can be exported with their source records", () => {
    const exported = exportClaimsWithSources("entity", "kazakh-khanate", sourceClaims, historicalSources);
    expect(exported[0].sources.length).toBeGreaterThan(0);
  });

  it("reverse year ranges are detected", () => {
    const result = validateEvidenceData({
      archiveMaps: [{ id: "reverse", validFromYear: 10, validToYear: 1, titles: { ru: "a", kk: "a", en: "a" }, descriptions: { ru: "a", kk: "a", en: "a" }, license: { status: "open_license" } }],
    });
    expect(result.errors.some((error) => error.code === "reverse_year_range")).toBe(true);
  });
});

describe("P1C local review workflow", () => {
  const queue = buildReviewQueue({
    claims: sourceClaims,
    geometries: entityGeometries,
    archiveMaps,
  });

  it("collects needs_review and licence gaps", () => {
    expect(queue.some((item) => item.itemType === "claim")).toBe(true);
    expect(queue.some((item) => item.itemType === "archive_map")).toBe(true);
  });

  it("review actions do not mutate curated data", () => {
    const claim = sourceClaims.find((item) => item.verificationStatus === "needs_review");
    const before = claim.verificationStatus;
    const record = createLocalReviewRecord({
      itemType: "claim",
      itemId: claim.id,
      status: "approved",
      now: () => "2026-01-01T00:00:00.000Z",
    });
    const reviews = upsertLocalReview([], record);
    expect(reviews[0].status).toBe("approved");
    expect(claim.verificationStatus).toBe(before);
  });

  it("merges local state without exposing it as source status", () => {
    const item = queue[0];
    const merged = mergeReviewState(queue, [{ itemType: item.itemType, itemId: item.itemId, status: "in_review" }]);
    expect(merged[0].localReview.status).toBe("in_review");
    expect(merged[0].originalVerificationStatus).toBeTruthy();
  });

  it("review export is valid JSON", () => {
    const report = JSON.parse(exportReviewReport([{ itemType: "claim", itemId: "a", status: "pending", note: "", reviewerName: "", reviewedAt: "now" }]));
    expect(report.schema).toBe("qhm-local-review-report-v1");
    expect(report.records).toHaveLength(1);
  });
});

describe("P1C overlay and URL safety", () => {
  it("opacity is clamped to 0–100 percent", () => {
    expect(clampArchiveOpacity(-1)).toBe(0);
    expect(clampArchiveOpacity(2)).toBe(1);
    expect(clampArchiveOpacity(0.42)).toBe(0.42);
  });

  it("overlay cleanup removes layer before source", () => {
    const calls = [];
    const map = {
      getLayer: vi.fn(() => true),
      getSource: vi.fn(() => true),
      removeLayer: vi.fn(() => calls.push("layer")),
      removeSource: vi.fn(() => calls.push("source")),
    };
    removeArchiveOverlay(map);
    expect(calls).toEqual(["layer", "source"]);
  });

  it("mount returns cleanup and configures one image source", () => {
    const map = {
      layers: new Set(),
      sources: new Set(),
      getLayer(id) { return this.layers.has(id); },
      getSource(id) { return this.sources.has(id); },
      addSource(id) { this.sources.add(id); },
      addLayer(layer) { this.layers.add(layer.id); },
      removeLayer(id) { this.layers.delete(id); },
      removeSource(id) { this.sources.delete(id); },
    };
    const cleanup = mountArchiveOverlay({ map, archiveMap: displayable });
    expect(map.sources.size).toBe(1);
    expect(map.layers.size).toBe(1);
    cleanup();
    expect(map.sources.size).toBe(0);
  });

  it("URL parser accepts valid values and clamps opacity", () => {
    const parsed = parseP1CUrlState("?archiveMap=qhm-evidence-overlay-demo&archiveOpacity=140&evidence=entity:kazakh-khanate&review=true&compareArchive=true");
    expect(parsed.archiveOpacity).toBe(1);
    expect(parsed.evidence).toEqual({ subjectType: "entity", subjectId: "kazakh-khanate" });
    expect(parsed.review).toBe(true);
  });

  it("unknown URL parameters are ignored safely", () => {
    const parsed = parseP1CUrlState("?archiveMap=unknown&evidence=bad&story=nope");
    expect(parsed.archiveMap).toBeNull();
    expect(parsed.evidence).toBeNull();
    expect(parsed.story).toBeNull();
  });

  it("unknown-licence URL target remains rights-blocked", () => {
    const parsed = parseP1CUrlState("?archiveMap=future-institutional-archive-placeholder");
    expect(parsed.archiveMap).toBe(unknown.id);
    expect(canDisplayFullArchiveMap(unknown)).toBe(false);
  });
});

describe("P1C education, diagnostics and agent", () => {
  const story = historicalStories.find((item) => item.id === "historical-evidence");
  const questions = storyQuestions.filter((item) => item.id.startsWith("evidence-"));

  it("evidence story has nine multilingual accessible steps", () => {
    expect(story.steps).toHaveLength(9);
    story.steps.forEach((step) => {
      expect(step.narration.ru && step.narration.kk && step.narration.en).toBeTruthy();
      expect(step.accessibilityNarration.ru).toBeTruthy();
      expect(step.sourceIds.length).toBeGreaterThan(0);
    });
  });

  it("five evidence questions have sources and verification metadata", () => {
    expect(questions).toHaveLength(5);
    questions.forEach((question) => {
      expect(question.sourceIds.length).toBeGreaterThan(0);
      expect(question.evidenceType).toBeTruthy();
      expect(question.verificationStatus).toBeTruthy();
    });
  });

  it("diagnostic counts are available and validation has no fatal errors", () => {
    const result = validateEvidenceData({
      sources: historicalSources,
      claims: sourceClaims,
      archiveMaps,
      geometries: entityGeometries,
    });
    expect(sourceClaims.length).toBe(8);
    expect(archiveMaps.length).toBe(2);
    expect(sourceDisputes.length).toBe(1);
    expect(result.errors).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("one aborted archive consumer does not poison the shared dynamic import", async () => {
    resetP1CDataLoaderForTests();
    const controller = new AbortController();
    const aborted = loadArchiveData(controller.signal);
    const active = loadArchiveData();
    controller.abort();
    await expect(aborted).rejects.toMatchObject({ name: "AbortError" });
    await expect(active).resolves.toMatchObject({
      archiveMaps: expect.any(Array),
    });
  });

  it("agent SHOW_EVIDENCE opens evidence without changing verification", () => {
    const before = sourceClaims.map((claim) => claim.verificationStatus);
    const result = runLocalHistoricalAgent("show-evidence", "en");
    expect(result.actions[0].type).toBe(AGENT_ACTIONS.SHOW_EVIDENCE);
    expect(sourceClaims.map((claim) => claim.verificationStatus)).toEqual(before);
  });

  it("agent supports every P1C action family", () => {
    const ids = ["show-archive-maps", "compare-archive", "show-review-materials", "show-disputes", "start-evidence-lesson", "copy-source-citation"];
    const types = ids.flatMap((id) => runLocalHistoricalAgent(id, "en").actions.map((action) => action.type));
    expect(types).toContain(AGENT_ACTIONS.SHOW_ARCHIVE_MAPS);
    expect(types).toContain(AGENT_ACTIONS.START_ARCHIVE_COMPARISON);
    expect(types).toContain(AGENT_ACTIONS.SHOW_REVIEW_QUEUE);
    expect(types).toContain(AGENT_ACTIONS.SHOW_DISPUTE);
    expect(types).toContain(AGENT_ACTIONS.START_EVIDENCE_STORY);
    expect(types).toContain(AGENT_ACTIONS.EXPORT_CITATION);
  });
});
