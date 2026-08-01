import { writeFile } from "node:fs/promises";
import path from "node:path";

import {
  projectRoot,
  safeErrorMessage,
  withPgClient,
} from "./local-database-utils.mjs";
import { updateVerificationReport } from "./verification-report.mjs";

const reportPath = path.join(
  projectRoot,
  "docs",
  "P2A5_POSTGIS_VALIDATION_REPORT.md"
);

const writeReport = async (result) => {
  const invalidRows = (result.invalid || [])
    .map(
      (row) =>
        `| \`${row.id}\` | ${row.dataset} | ${row.geometryType} | ${row.reason} | ${row.verificationStatus} | Review the original reconstruction; do not apply ST_MakeValid automatically. |`
    )
    .join("\n");
  const content = `# P2A.5 PostGIS Validation Report

Date: ${new Date().toISOString()}

Overall status: **${result.passed ? "passed" : "failed"}**

## Summary

- Geometry records: ${result.total ?? "not measured"}
- Valid and non-empty: ${result.valid ?? "not measured"}
- Technically invalid: ${result.technicallyInvalid ?? "not measured"}
- Historically approximate: ${result.historicallyApproximate ?? "not measured"}
- \`needs_review\`: ${result.needsReview ?? "not measured"}
- \`demo_only\`: ${result.demoOnly ?? "not measured"}
- SRID 4326: ${result.srid4326 ?? "not measured"}
- Within legal longitude/latitude range: ${result.coordinateRangeValid ? "yes" : "no"}
- Intersecting the expected Central Asia verification envelope: ${
    result.centralAsiaIntersections ?? "not measured"
  }

## Invalid geometry

| ID | Dataset | Type | Reason | Verification | Recommendation |
| --- | --- | --- | --- | --- | --- |
${invalidRows || "| None | — | — | — | — | — |"}

## Dataset extents

${(result.extents || [])
  .map(
    (extent) =>
      `- ${extent.dataset}: ${extent.extent || "empty"} (${extent.records} records)`
  )
  .join("\n")}

No geometry is modified by this verification. \`ST_MakeValid\` is not called.

${result.error ? `Error: \`${result.error}\`` : ""}
`;
  await writeFile(reportPath, content, "utf8");
};

try {
  const result = await withPgClient(async (client) => {
    const rows = await client.query(`
      with all_geometry as (
        select 'historical_geometries'::text as dataset, id, geom,
          geometry_type, confidence_level, verification_status
        from public.historical_geometries
        union all
        select 'historical_places', id, point, 'Point',
          confidence_level, verification_status
        from public.historical_places
        union all
        select 'route_segments', id, geom, 'LineString',
          confidence_level, verification_status
        from public.route_segments
        union all
        select 'environment_snapshots', id, geom,
          extensions.geometrytype(geom), confidence_level, verification_status
        from public.environment_snapshots
        union all
        select 'hydrology_snapshots', id, geom,
          extensions.geometrytype(geom), confidence_level, verification_status
        from public.hydrology_snapshots
      )
      select
        dataset,
        id,
        geometry_type,
        extensions.st_srid(geom) as srid,
        extensions.st_geometrytype(geom) as actual_geometry_type,
        extensions.st_isempty(geom) as is_empty,
        extensions.st_isvalid(geom) as is_valid,
        extensions.st_isvalidreason(geom) as validity_reason,
        extensions.st_npoints(geom) as points,
        extensions.st_astext(extensions.st_envelope(geom)) as envelope,
        confidence_level,
        verification_status,
        extensions.st_intersects(
          geom,
          extensions.st_makeenvelope(40, 35, 100, 75, 4326)
        ) as intersects_central_asia,
        extensions.st_xmin(extensions.box3d(geom)) >= -180
          and extensions.st_xmax(extensions.box3d(geom)) <= 180
          and extensions.st_ymin(extensions.box3d(geom)) >= -90
          and extensions.st_ymax(extensions.box3d(geom)) <= 90
          as legal_coordinate_range
      from all_geometry
      order by dataset, id
    `);
    const extents = await client.query(`
      select 'historical_geometries'::text as dataset,
        count(*)::integer as records,
        extensions.st_extent(geom)::text as extent
      from public.historical_geometries
      union all
      select 'historical_places', count(*)::integer,
        extensions.st_extent(point)::text
      from public.historical_places
      union all
      select 'route_segments', count(*)::integer,
        extensions.st_extent(geom)::text
      from public.route_segments
      union all
      select 'environment_snapshots', count(*)::integer,
        extensions.st_extent(geom)::text
      from public.environment_snapshots
      union all
      select 'hydrology_snapshots', count(*)::integer,
        extensions.st_extent(geom)::text
      from public.hydrology_snapshots
      order by dataset
    `);
    const invalid = rows.rows
      .filter((row) => row.is_empty || !row.is_valid)
      .map((row) => ({
        id: row.id,
        dataset: row.dataset,
        geometryType: row.actual_geometry_type,
        reason: row.is_empty ? "Empty geometry" : row.validity_reason,
        verificationStatus: row.verification_status,
      }));
    return {
      passed:
        rows.rowCount === 55 &&
        invalid.length === 0 &&
        rows.rows.every(
          (row) => row.srid === 4326 && row.legal_coordinate_range
        ),
      total: rows.rowCount,
      valid: rows.rows.filter((row) => row.is_valid && !row.is_empty).length,
      technicallyInvalid: invalid.length,
      historicallyApproximate: rows.rows.filter((row) =>
        ["low", "disputed"].includes(row.confidence_level)
      ).length,
      needsReview: rows.rows.filter(
        (row) => row.verification_status === "needs_review"
      ).length,
      demoOnly: rows.rows.filter(
        (row) => row.verification_status === "demo_only"
      ).length,
      srid4326: rows.rows.filter((row) => row.srid === 4326).length,
      coordinateRangeValid: rows.rows.every((row) => row.legal_coordinate_range),
      centralAsiaIntersections: rows.rows.filter(
        (row) => row.intersects_central_asia
      ).length,
      invalid,
      extents: extents.rows,
    };
  });
  console.log(
    `PostGIS verification: ${result.passed ? "passed" : "failed"}; ${result.valid}/${result.total} valid`
  );
  await writeReport(result);
  await updateVerificationReport("postgis", result);
  if (!result.passed) process.exitCode = 1;
} catch (error) {
  const safeMessage = safeErrorMessage(error);
  console.error(`PostGIS verification failed: ${safeMessage}`);
  const result = { passed: false, error: safeMessage };
  await writeReport(result);
  await updateVerificationReport("postgis", result);
  process.exitCode = 1;
}
