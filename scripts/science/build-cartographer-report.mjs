import fs from "node:fs/promises";
import path from "node:path";
import { scienceDatasets, localizedName } from "./science-data.mjs";
import { getSpatialPrecision } from "../../src/features/exhibition/spatialPrecision.js";
import { validateSpatialConsistency } from "./validate-spatial-consistency.mjs";
import { escapeHtml, reportDocument } from "./report-utils.mjs";
import { isDirectRun } from "./validation-utils.mjs";

export const CARTOGRAPHER_REPORT = path.resolve(
  "review-packages/Qazaq_Heritage_Cartographer_Report.html"
);

export const buildCartographerReport = async (
  output = CARTOGRAPHER_REPORT
) => {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const records = [
    ...scienceDatasets.geometries,
    ...scienceDatasets.places,
    ...scienceDatasets.routeSegments,
    ...scienceDatasets.hydrology,
    ...scienceDatasets.rivers,
    ...scienceDatasets.environment,
  ];
  const validation = validateSpatialConsistency();
  const body = `
<h1>Qazaq Heritage Map — отчёт для картографа</h1>
<p>CRS: WGS84 / EPSG:4326. Package GeoJSON: <code>qazaq-heritage-scientific-review/</code>.</p>
<h2>Geometry inventory and spatial precision</h2>
<table><tr><th>ID</th><th>Name</th><th>Geometry</th><th>Precision</th><th>Status</th></tr>${records.map((record)=>`<tr><td><code>${escapeHtml(record.id)}</code></td><td>${escapeHtml(localizedName(record))}</td><td>${escapeHtml(record.geometry?.type || record.geometry?.geometry?.type || record.geojson?.geometry?.type || "Point")}</td><td>${escapeHtml(getSpatialPrecision(record))}</td><td>${escapeHtml(record.verificationStatus || "missing")}</td></tr>`).join("")}</table>
<h2>Polygon validity and geometry warnings</h2>
<p>${validation.errors} errors; ${validation.warnings} warnings.</p>
<table><tr><th>Severity</th><th>Code</th><th>Record</th><th>Detail</th></tr>${validation.issues.map((item)=>`<tr><td>${escapeHtml(item.severity)}</td><td>${escapeHtml(item.code)}</td><td>${escapeHtml(item.recordType)}:${escapeHtml(item.id)}</td><td>${escapeHtml(item.detail)}</td></tr>`).join("")}</table>
<h2>Review scope</h2><ul><li>Route geometries are generalized/schematic and do not support precise length or duration.</li><li>Label points require visual placement review per temporal geometry.</li><li>Aral snapshots are discrete and must be reviewed as a sequence.</li><li>River corridors are generalized, not modern surveyed channels.</li><li>Checklist: <code>qazaq-heritage-scientific-review/review-checklist.csv</code>.</li></ul>`;
  await fs.writeFile(output, reportDocument("Qazaq Heritage — cartographer report", body), "utf8");
  console.log(`Cartographer report: ${output}`);
  return output;
};

if (isDirectRun(import.meta.url)) await buildCartographerReport();

