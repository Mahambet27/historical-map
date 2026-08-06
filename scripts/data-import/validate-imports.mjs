import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { validateOpenDataProvenance } from "../../src/dataAccess/provenance/openDataProvenance.js";

const roots = [
  "src/data/imported/staging",
  "src/data/imported/normalized",
  "src/data/imported/rejected",
];
const errors = [];
let count = 0;
for (const directory of roots) {
  const entries = await readdir(path.resolve(directory), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const records = JSON.parse(
      await readFile(path.resolve(directory, entry.name), "utf8")
    );
    for (const record of Array.isArray(records) ? records : []) {
      count += 1;
      const result = validateOpenDataProvenance(record.provenance);
      if (!result.valid) {
        errors.push(`${directory}/${entry.name}:${record.id || count} missing ${result.missing.join(",")}`);
      }
      if (record.verificationStatus === "reviewed" && record.publicationStatus !== "approved") {
        errors.push(`${directory}/${entry.name}:${record.id || count} reviewed without approval`);
      }
    }
  }
}
if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`Validated ${count} staged/normalized import records.\n`);
