import { validateGeometryTables } from "./geometry-validation.mjs";
import { readSeedData } from "./seed-io.mjs";

const result = validateGeometryTables(await readSeedData());
console.log(
  `P2A geometry validation: ${result.records} records, ${result.errors} errors, ${result.warnings} warnings`
);
result.issues.forEach((item) => {
  console.log(
    `${item.severity.toUpperCase()} ${item.code} subject=${item.subjectId} geometry=${item.geometryId}: ${item.recommendation}`
  );
});
if (result.errors) process.exitCode = 1;
