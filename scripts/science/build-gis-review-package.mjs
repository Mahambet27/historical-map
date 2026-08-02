import fs from "node:fs/promises";
import path from "node:path";
import {
  allScienceRecords,
  scienceDatasets,
} from "./science-data.mjs";
import {
  checklistRow,
  collection,
  csvCell,
  feature,
  geometryFor,
  reviewProperties,
  REVIEW_CHECKLIST_HEADERS,
} from "./review-package-utils.mjs";
import { validateTemporalConsistency } from "./validate-temporal-consistency.mjs";
import { validateSpatialConsistency } from "./validate-spatial-consistency.mjs";
import { validateScientificEvidence } from "./validate-scientific-evidence.mjs";
import { getScientificWarnings } from "../../src/features/exhibition/scientificReadiness.js";
import { isDirectRun } from "./validation-utils.mjs";

export const REVIEW_PACKAGE_ROOT = path.resolve(
  "review-packages/qazaq-heritage-scientific-review"
);
export const containsSecretLikeContent = (content) =>
  /(?:service[_-]?role|SUPABASE_[A-Z_]+)\s*[:=]\s*["']?[A-Za-z0-9._-]{8,}/.test(
    content
  );
export const hasUtf8Bom = (content) => content.charCodeAt(0) === 0xfeff;

const claimsFor = (type, id) =>
  scienceDatasets.claims.filter(
    (claim) => claim.subjectType === type && claim.subjectId === id
  );
const writeJson = (file, value) =>
  fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");

export const buildGisReviewPackage = async (
  outputRoot = REVIEW_PACKAGE_ROOT
) => {
  await fs.mkdir(path.join(outputRoot, "screenshots"), { recursive: true });
  await fs.mkdir(path.join(outputRoot, "styles"), { recursive: true });

  const geojson = {
    "entities.geojson": collection(
      scienceDatasets.entities.map((record) =>
        feature(null, reviewProperties("entity", record, claimsFor("entity", record.id)))
      )
    ),
    "territories.geojson": collection(
      scienceDatasets.geometries.map((record) =>
        feature(
          geometryFor(record),
          reviewProperties(
            "geometry",
            record,
            claimsFor("geometry", record.id),
            record.entityId
          )
        )
      )
    ),
    "places.geojson": collection(
      scienceDatasets.places.map((record) =>
        feature(
          geometryFor(record),
          reviewProperties("place", record, claimsFor("place", record.id))
        )
      )
    ),
    "routes.geojson": collection(
      scienceDatasets.routeSegments.map((record) =>
        feature(
          geometryFor(record),
          reviewProperties(
            "route_segment",
            record,
            claimsFor("route", record.routeId),
            record.routeId
          )
        )
      )
    ),
    "hydrology.geojson": collection(
      scienceDatasets.hydrology.map((record) =>
        feature(
          geometryFor(record),
          reviewProperties(
            "hydrology",
            record,
            claimsFor("hydrology", record.id),
            record.featureId
          )
        )
      )
    ),
    "rivers.geojson": collection(
      scienceDatasets.rivers.map((record) =>
        feature(
          geometryFor(record),
          reviewProperties(
            "river",
            record,
            claimsFor("hydrology", record.id),
            record.featureId
          )
        )
      )
    ),
    "environment.geojson": collection(
      scienceDatasets.environment.map((record) =>
        feature(
          geometryFor(record),
          reviewProperties(
            "environment",
            record,
            claimsFor("environment", record.id)
          )
        )
      )
    ),
    "labels.geojson": collection(
      scienceDatasets.labels.map((record) =>
        feature(
          { type: "Point", coordinates: record.labelPoint },
          reviewProperties("label", record, [], record.entityId)
        )
      )
    ),
  };
  await Promise.all(
    Object.entries(geojson).map(([file, value]) =>
      writeJson(path.join(outputRoot, file), value)
    )
  );
  await writeJson(path.join(outputRoot, "claims.json"), scienceDatasets.claims);
  await writeJson(path.join(outputRoot, "sources.json"), scienceDatasets.sources);
  await writeJson(
    path.join(outputRoot, "licenses.json"),
    scienceDatasets.archiveMaps.map((record) => ({
      id: record.id,
      attribution: record.attribution,
      license: record.license,
      imageIncluded: false,
    }))
  );

  const rows = allScienceRecords()
    .filter(({ recordType }) => !["sources", "disputes"].includes(recordType))
    .map(({ recordType, record }) =>
      checklistRow(
        recordType,
        record,
        claimsFor(recordType.replace(/s$/, ""), record.id)
      )
    );
  const checklist = [
    REVIEW_CHECKLIST_HEADERS,
    ...rows,
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  await fs.writeFile(
    path.join(outputRoot, "review-checklist.csv"),
    `\uFEFF${checklist}\r\n`,
    "utf8"
  );

  const warningRows = allScienceRecords().flatMap(({ recordType, record }) =>
    getScientificWarnings(record, "ru").map((warning) => [
      recordType,
      record.id,
      warning,
    ])
  );
  await fs.writeFile(
    path.join(outputRoot, "scientific-warnings.csv"),
    `\uFEFF${[["record type", "record ID", "warning"], ...warningRows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")}\r\n`,
    "utf8"
  );

  const validations = {
    temporal: validateTemporalConsistency(),
    spatial: validateSpatialConsistency(),
    evidence: validateScientificEvidence(),
  };
  const index = {
    packageVersion: "2026.08-rc1",
    generatedAt: "2026-08-01",
    coordinateReferenceSystem: "EPSG:4326",
    featureCounts: Object.fromEntries(
      Object.entries(geojson).map(([file, value]) => [
        file,
        value.features.length,
      ])
    ),
    validations: Object.fromEntries(
      Object.entries(validations).map(([key, value]) => [
        key,
        { errors: value.errors, warnings: value.warnings },
      ])
    ),
    containsSecrets: false,
    includesRestrictedImages: false,
  };
  await writeJson(path.join(outputRoot, "review-index.json"), index);
  await fs.writeFile(
    path.join(outputRoot, "README.md"),
    `# Qazaq Heritage scientific GIS review package

Local, read-only review export for historians and cartographers.

- CRS: WGS84 / EPSG:4326.
- Geometries are reconstructions with the precision recorded per feature.
- Empty reviewer decision columns are intentional.
- No telemetry, credentials, reviewer identity, user data, environment files,
  Supabase keys, or restricted full-resolution archive images are included.
- Automated validation checks technical consistency, not historical truth.
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(outputRoot, "screenshots/README.md"),
    "# Screenshots\n\nAdd reviewer-approved release screenshots here; none are generated from user sessions.\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(outputRoot, "styles/qgis-style-notes.md"),
    `# QGIS style notes

- Use categorized styling by \`scientificReadiness\` and \`spatialPrecision\`.
- Solid: reviewed/generalized; soft edge: approximate/coarse; crosshatch:
  disputed; dots/dashes: schematic/demo-only; hidden: unavailable.
- Do not calculate precise area or length for generalized, coarse or schematic
  features.
`,
    "utf8"
  );

  const files = await fs.readdir(outputRoot, { recursive: true });
  for (const relative of files) {
    const full = path.join(outputRoot, relative);
    const stats = await fs.stat(full);
    if (!stats.isFile()) continue;
    const content = await fs.readFile(full, "utf8");
    if (containsSecretLikeContent(content)) {
      throw new Error(`Forbidden secret-like content in ${relative}`);
    }
  }
  console.log(`GIS review package: ${outputRoot}`);
  return { outputRoot, index };
};

if (isDirectRun(import.meta.url)) {
  await buildGisReviewPackage();
}
