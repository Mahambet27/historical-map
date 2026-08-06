import { eraRegistry } from "../../src/data/exhibition/eraRegistry.js";
import {
  isValidHistoricalYear,
  getNextHistoricalYear,
  getPreviousHistoricalYear,
} from "../../src/features/exhibition/timeline/historicalYear.js";
import { entityGeometries } from "../../src/data/exhibition/entityGeometries.js";
import { historicalRoutes } from "../../src/data/exhibition/historicalRoutes.js";

const errors = [];
if (getNextHistoricalYear(-1) !== 1) errors.push("-1 must advance to 1");
if (getPreviousHistoricalYear(1) !== -1) errors.push("1 must go back to -1");
for (const era of eraRegistry) {
  if (!isValidHistoricalYear(era.fromYear) || !isValidHistoricalYear(era.toYear)) {
    errors.push(`${era.id}: invalid range`);
  }
  for (const year of era.keyYears) {
    if (year < era.fromYear || year > era.toYear || year === 0) {
      errors.push(`${era.id}: invalid key year ${year}`);
    }
  }
}
for (let index = 1; index < eraRegistry.length; index += 1) {
  const previous = eraRegistry[index - 1];
  const current = eraRegistry[index];
  if (previous.toYear >= current.fromYear) {
    errors.push(`${previous.id}/${current.id}: overlapping era ranges`);
  }
}
for (const record of [...entityGeometries, ...historicalRoutes]) {
  if (record.validFromYear === 0 || record.validToYear === 0) {
    errors.push(`${record.id}: year zero is forbidden`);
  }
  if (
    Number.isFinite(record.validToYear) &&
    record.validFromYear > record.validToYear
  ) {
    errors.push(`${record.id}: inverted temporal range`);
  }
}
if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`Timeline validated: ${eraRegistry.length} eras, no year zero.\n`);
