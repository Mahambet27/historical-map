import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputDir = path.resolve("src/data/imported/normalized");
const records = [];
for (const entry of await readdir(inputDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
  const data = JSON.parse(await readFile(path.join(inputDir, entry.name), "utf8"));
  records.push(...(Array.isArray(data) ? data : []));
}
const byIdentifier = new Map();
for (const record of records) {
  for (const identifier of [
    ...(record.provenance?.sourceRecordIds || []),
    record.wikidataId,
    record.pleiadesId,
  ].filter(Boolean)) {
    const group = byIdentifier.get(identifier) || [];
    group.push(record);
    byIdentifier.set(identifier, group);
  }
}
const duplicates = [...byIdentifier.entries()]
  .filter(([, group]) => group.length > 1)
  .map(([identifier, group]) => ({
    identifier,
    recordIds: group.map((item) => item.id),
    action: "manual_reconciliation_required",
  }));
const conflicts = records
  .filter((record) => record.conflicts?.length)
  .flatMap((record) =>
    record.conflicts.map((conflict) => ({ recordId: record.id, ...conflict }))
  );
await mkdir(path.resolve("reports"), { recursive: true });
await writeFile(
  path.resolve("reports/open-data-duplicates.json"),
  `${JSON.stringify(duplicates, null, 2)}\n`
);
await writeFile(
  path.resolve("reports/open-data-conflicts.json"),
  `${JSON.stringify(conflicts, null, 2)}\n`
);
await writeFile(
  path.resolve("reports/open-data-import-summary.json"),
  `${JSON.stringify(
    {
      imported: records.length,
      accepted: 0,
      needs_review: records.length,
      rejected: 0,
      conflicts: conflicts.length,
      duplicates: duplicates.length,
      note: "No remote import was run; only committed local staging records are counted.",
    },
    null,
    2
  )}\n`
);
process.stdout.write(
  `Conflict report: ${conflicts.length} conflicts, ${duplicates.length} duplicate groups.\n`
);
