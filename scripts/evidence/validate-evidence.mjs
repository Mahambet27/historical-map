import { historicalSources } from "../../src/data/exhibition/sources.js";
import { sourceClaims } from "../../src/data/exhibition/sourceClaims.js";
import { archiveMaps } from "../../src/data/exhibition/archiveMaps.js";
import { entityGeometries } from "../../src/data/exhibition/entityGeometries.js";
import { validateEvidenceData } from "../../src/features/exhibition/evidenceValidation.js";

const result = validateEvidenceData({
  sources: historicalSources,
  claims: sourceClaims,
  archiveMaps,
  geometries: entityGeometries,
});

for (const warning of result.warnings) {
  console.warn(`WARNING ${warning.code}: ${warning.id}`);
}
for (const error of result.errors) {
  console.error(`ERROR ${error.code}: ${error.id}`);
}
console.log(`Evidence validation: ${result.errors.length} errors, ${result.warnings.length} warnings`);
if (result.errors.length) process.exitCode = 1;
