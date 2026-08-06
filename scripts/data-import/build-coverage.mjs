import { mkdir, writeFile } from "node:fs/promises";
import { eraRegistry } from "../../src/data/exhibition/eraRegistry.js";
import { entityGeometries } from "../../src/data/exhibition/entityGeometries.js";
import { historicalEvents } from "../../src/data/exhibition/events.js";
import { historicalPeople } from "../../src/data/exhibition/people.js";
import { historicalSettlements } from "../../src/data/exhibition/historicalSettlements.js";
import { historicalRoutes } from "../../src/data/exhibition/historicalRoutes.js";
import { hydrologySnapshots } from "../../src/data/exhibition/hydrologySnapshots.js";
import { historicalRiverSnapshots } from "../../src/data/exhibition/historicalRiverSnapshots.js";

const overlaps = (record, era) => {
  const from =
    record.validFromYear ??
    record.startYear ??
    record.birthYear ??
    record.year ??
    Number.NEGATIVE_INFINITY;
  const to =
    record.validToYear ??
    record.endYear ??
    record.deathYear ??
    record.year ??
    Number.POSITIVE_INFINITY;
  return from <= era.toYear && to >= era.fromYear;
};
const eventById = new Map(historicalEvents.map((event) => [event.id, event]));
const personOverlaps = (person, era) => {
  const linkedEvents = (person.eventIds || [])
    .map((eventId) => eventById.get(eventId))
    .filter(Boolean);
  if (linkedEvents.length) return linkedEvents.some((event) => overlaps(event, era));
  if (Number.isFinite(person.birthYear) && Number.isFinite(person.deathYear)) {
    return person.birthYear <= era.toYear && person.deathYear >= era.fromYear;
  }
  return false;
};
const unique = (records, key) => new Set(records.map((item) => item[key]).filter(Boolean)).size;
const knownGaps = {
  saka: ["Historical places, people, hydrology, and additional reviewed boundaries are missing."],
  turkic: ["Most boundaries and all medieval hydrology require expert review."],
  "kazakh-khanate": ["Reviewed boundaries after 1521, person life dates, and post-1500 routes are incomplete."],
  "kazakh-ssr": ["Reviewed Aral snapshots, people, and year-bounded historical place names are incomplete."],
  "independent-kazakhstan": ["Reviewed Aral snapshots and explicit place-name intervals are incomplete."],
};
const coverage = eraRegistry.map((era) => {
  const boundaries = entityGeometries.filter((item) => overlaps(item, era));
  const events = historicalEvents.filter((item) => overlaps(item, era));
  const people = historicalPeople.filter((item) => personOverlaps(item, era));
  const places = historicalSettlements.filter((item) => overlaps(item, era));
  const routes = historicalRoutes.filter((item) => overlaps(item, era));
  const hydrology = [...hydrologySnapshots, ...historicalRiverSnapshots].filter((item) =>
    overlaps(item, era)
  );
  const all = [...boundaries, ...events, ...people, ...places, ...routes, ...hydrology];
  const status = (value) =>
    all.filter((item) => item.verificationStatus === value).length;
  return {
    eraId: era.id,
    fromYear: era.fromYear,
    toYear: era.toYear,
    states: unique(boundaries, "entityId"),
    boundarySnapshots: boundaries.length,
    events: events.length,
    people: people.length,
    historicalPlaces: places.length,
    routes: routes.length,
    hydrologySnapshots: hydrology.length,
    sources: unique(all.flatMap((item) => (item.sourceIds || []).map((sourceId) => ({ sourceId }))), "sourceId"),
    reviewed: status("reviewed") + status("verified"),
    needs_review: status("needs_review"),
    disputed: status("disputed"),
    missing: all.length === 0 ? 1 : 0,
    dataGaps:
      all.length === 0
        ? ["No local records overlap this era."]
        : knownGaps[era.id] || ["Coverage and dates require expert review."],
  };
});
await mkdir("public", { recursive: true });
await writeFile(
  "public/historical-data-coverage.json",
  `${JSON.stringify({ generatedAt: "2026-08-06", coverage }, null, 2)}\n`
);
const rows = coverage
  .map(
    (item) =>
      `| ${item.eraId} | ${item.states} | ${item.boundarySnapshots} | ${item.events} | ${item.people} | ${item.historicalPlaces} | ${item.routes} | ${item.hydrologySnapshots} | ${item.sources} | ${item.reviewed} | ${item.needs_review} | ${item.disputed} | ${item.missing} | ${item.dataGaps.join("; ") || "—"} |`
  )
  .join("\n");
await writeFile(
  "docs/HISTORICAL_DATA_COVERAGE_REPORT.md",
  `# Historical data coverage report\n\nGenerated from committed local datasets. Counts measure available records, not historical completeness or scholarly certainty.\n\n| Era | States | Boundaries | Events | People | Places | Routes | Hydrology | Sources | Reviewed | Needs review | Disputed | Missing | Gaps |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|\n${rows}\n\nNo remote source, production database, or automatically inferred boundary was used.\n`
);
process.stdout.write(`Coverage generated for ${coverage.length} eras.\n`);
