import { localInventory } from "./seed-model.mjs";
import { readSeedData } from "./seed-io.mjs";

const seedData = await readSeedData();
const comparisons = [
  ["entities", localInventory.entities, seedData.tables.historical_entities],
  ["geometries", localInventory.geometries, seedData.tables.historical_geometries],
  ["events", localInventory.events, seedData.tables.historical_events],
  ["people", localInventory.people, seedData.tables.historical_people],
  ["sources", localInventory.sources, seedData.tables.historical_sources],
  ["claims", localInventory.claims, seedData.tables.source_claims],
  ["routes", localInventory.routes, seedData.tables.historical_routes],
  ["routeSegments", localInventory.routeSegments, seedData.tables.route_segments],
  ["environment", localInventory.environment, seedData.tables.environment_snapshots],
  ["hydrology", localInventory.hydrology, seedData.tables.hydrology_snapshots],
  ["archiveMaps", localInventory.archiveMaps, seedData.tables.archive_maps],
  ["stories", localInventory.stories, seedData.tables.educational_stories],
  ["questions", localInventory.questions, seedData.tables.educational_questions],
];

const failures = [];
comparisons.forEach(([name, localRecords, seedRecords]) => {
  const localIds = [...new Set(localRecords.map((record) => record.id))].sort();
  const seedIds = [...new Set(seedRecords.map((record) => record.id))].sort();
  const missing = localIds.filter((id) => !seedIds.includes(id));
  const unexpected = seedIds.filter((id) => !localIds.includes(id));
  if (missing.length || unexpected.length) {
    failures.push({ dataset: name, missing, unexpected });
  }
  console.log(
    `${name}: local=${localIds.length} seed=${seedIds.length} missing=${missing.length} unexpected=${unexpected.length}`
  );
});

const importedPlaceIds = new Set(seedData.tables.historical_places.map((record) => record.id));
const expectedPlaceIds = new Set([
  ...localInventory.places.map((record) => record.id),
  ...localInventory.historicalSettlements.map((record) => record.id),
]);
const missingPlaces = [...expectedPlaceIds].filter((id) => !importedPlaceIds.has(id));
if (missingPlaces.length) {
  failures.push({ dataset: "places", missing: missingPlaces, unexpected: [] });
}
console.log(
  `places: local union=${expectedPlaceIds.size} seed=${importedPlaceIds.size} missing=${missingPlaces.length}`
);

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log("P2A local/seed comparison: stable IDs preserved");
}
