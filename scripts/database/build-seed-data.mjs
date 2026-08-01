import { buildSeedData } from "./seed-model.mjs";
import {
  ensureSeedDirectory,
  seedDataPath,
  stableStringify,
  writeIfChanged,
} from "./seed-io.mjs";

await ensureSeedDirectory();
const seedData = buildSeedData();
const changed = await writeIfChanged(seedDataPath, stableStringify(seedData));
const count = Object.values(seedData.tables).reduce(
  (total, records) => total + records.length,
  0
);

console.log(
  `P2A seed data: ${count} records, ${changed ? "updated" : "unchanged"}`
);
