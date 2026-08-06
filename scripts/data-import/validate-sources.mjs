import sourceRegistry from "../../data-sources/open-data-sources.json" with { type: "json" };
import { validateSourceLicense } from "../../src/dataAccess/licensing/openDataLicensePolicy.js";

const required = [
  "id",
  "name",
  "provider",
  "officialDomain",
  "dataCategories",
  "geographicCoverage",
  "temporalCoverage",
  "license",
  "attributionRequired",
  "commercialUseAllowed",
  "shareAlike",
  "bulkDownloadAllowed",
  "apiAvailable",
  "lastCheckedAt",
  "sourceVersion",
  "importer",
  "enabled",
  "notes",
];
const errors = [];
const ids = new Set();
for (const source of sourceRegistry) {
  for (const field of required) {
    if (source[field] == null || source[field] === "") {
      errors.push(`${source.id || "unknown"}: missing ${field}`);
    }
  }
  if (ids.has(source.id)) errors.push(`${source.id}: duplicate source ID`);
  ids.add(source.id);
  const license = validateSourceLicense(source);
  if (!license.valid) errors.push(`${source.id}: ${license.errors.join(", ")}`);
  if (source.enabled && license.status === "review_required") {
    errors.push(`${source.id}: review_required source cannot be enabled`);
  }
}
if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(
  `Validated ${sourceRegistry.length} sources (${sourceRegistry.filter((item) => item.enabled).length} enabled).\n`
);
