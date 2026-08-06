import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sourceRegistry from "../../data-sources/open-data-sources.json" with { type: "json" };
import { assertImportableLicense } from "../../src/dataAccess/licensing/openDataLicensePolicy.js";

const root = process.cwd();
const sourceById = new Map(sourceRegistry.map((source) => [source.id, source]));

const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

const inCentralAsia = (record) => {
  const country = String(record.countryCode || record.country || "").toUpperCase();
  if (["KZ", "KG", "UZ", "TJ", "TM", "KAZAKHSTAN"].includes(country)) return true;
  const coordinates = record.coordinates || [record.longitude, record.latitude];
  const [longitude, latitude] = coordinates.map(Number);
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= 45 &&
    longitude <= 90 &&
    latitude >= 35 &&
    latitude <= 56
  );
};

export const runImporter = async ({
  sourceId,
  importerVersion = "1.0.0",
  crosscheckOnly = false,
  normalize = (record) => record,
}) => {
  const inputArg = process.argv.find((arg) => arg.startsWith("--input="));
  if (!inputArg) {
    throw new Error(
      "A reviewed local input is required: --input=path/to/file.json. Network fetch is intentionally not automatic."
    );
  }
  const source = sourceById.get(sourceId);
  if (!source) throw new Error(`Unknown source: ${sourceId}`);
  if (!source.enabled) throw new Error(`Source is disabled pending license review: ${sourceId}`);
  const licenseDecision = assertImportableLicense(source);
  const isolated = crosscheckOnly || licenseDecision.isolated;
  const inputPath = path.resolve(root, inputArg.slice("--input=".length));
  const raw = JSON.parse(await readFile(inputPath, "utf8"));
  const records = Array.isArray(raw) ? raw : raw.records || raw.features || [];
  const accessedAt = new Date().toISOString();
  const accepted = [];
  const rejected = [];
  for (const rawRecord of records) {
    if (!inCentralAsia(rawRecord.properties || rawRecord)) {
      rejected.push({ reason: "outside_geographic_scope", sourceRecordId: rawRecord.id });
      continue;
    }
    const record = normalize(rawRecord.properties || rawRecord);
    accepted.push({
      ...record,
      provenance: {
        sourceIds: [sourceId],
        sourceRecordIds: [String(rawRecord.id ?? record.id)],
        sourceUrls: [record.sourceUrl || `https://${source.officialDomain}`],
        sourceVersion: source.sourceVersion,
        accessedAt,
        importedAt: accessedAt,
        importerVersion,
        licenseStatus: licenseDecision.status,
        attribution: source.attributionRequired ? source.provider : "Not required",
        rawRecordHash: hash(rawRecord),
        transformationNotes: [
          "Geographically filtered to Kazakhstan/Central Asia",
          isolated ? "Stored in isolated license/cross-check lane" : "Awaiting manual review",
        ],
        verificationStatus: "needs_review",
      },
      verificationStatus: "needs_review",
      publicationStatus: "staging",
      crosscheckOnly: isolated,
    });
  }
  const outputDir = path.join(
    root,
    "src",
    "data",
    "imported",
    isolated ? "staging" : "normalized"
  );
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${sourceId}.json`);
  await writeFile(outputPath, `${JSON.stringify(accepted, null, 2)}\n`, "utf8");
  const summary = {
    sourceId,
    imported: records.length,
    accepted: accepted.length,
    needs_review: accepted.length,
    rejected: rejected.length,
    output: path.relative(root, outputPath).replaceAll("\\", "/"),
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return summary;
};
