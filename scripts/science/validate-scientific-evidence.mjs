import { scienceDatasets, sourceIdsFor } from "./science-data.mjs";
import {
  isDirectRun,
  issue,
  printValidationResult,
  resultSummary,
} from "./validation-utils.mjs";
import {
  canCalculateAreaPrecisely,
  canCalculateDistancePrecisely,
} from "../../src/features/exhibition/spatialPrecision.js";
import { getScientificReadiness } from "../../src/features/exhibition/scientificReadiness.js";

export const validateScientificEvidence = () => {
  const issues = [];
  const sourceById = new Map(
    scienceDatasets.sources.map((record) => [record.id, record])
  );
  const claimBySubject = Map.groupBy(
    scienceDatasets.claims,
    (record) => `${record.subjectType}:${record.subjectId}`
  );

  scienceDatasets.geometries.forEach((record) => {
    const claims = claimBySubject.get(`geometry:${record.id}`) || [];
    if (
      !claims.some((claim) => claim.predicate === "territorial_extent") &&
      record.verificationStatus !== "needs_review"
    ) {
      issues.push(
        issue(
          "warning",
          "scientific",
          "reviewed_geometry_without_extent_claim",
          "geometries",
          record.id
        )
      );
    } else if (!claims.length) {
      issues.push(
        issue(
          "warning",
          "scientific",
          "geometry_needs_extent_claim",
          "geometries",
          record.id
        )
      );
    }
  });

  scienceDatasets.places.forEach((record) => {
    if (!sourceIdsFor(record).length && record.coordinatePrecision !== "approximate") {
      issues.push(
        issue(
          "error",
          "blocking",
          "place_coordinate_without_evidence",
          "places",
          record.id
        )
      );
    }
  });
  scienceDatasets.routes.forEach((record) => {
    if (!sourceIdsFor(record).length && record.verificationStatus !== "demo_only") {
      issues.push(
        issue(
          "warning",
          "scientific",
          "route_direction_without_source",
          "routes",
          record.id
        )
      );
    }
  });
  [...scienceDatasets.hydrology, ...scienceDatasets.environment].forEach(
    (record) => {
      if (
        !sourceIdsFor(record).length &&
        !["needs_review", "demo_only"].includes(record.verificationStatus)
      ) {
        issues.push(
          issue(
            "error",
            "blocking",
            "snapshot_without_source_or_warning",
            record.featureId ? "hydrology" : "environment",
            record.id
          )
        );
      }
    }
  );

  scienceDatasets.claims.forEach((record) => {
    const sources = sourceIdsFor(record).map((id) => sourceById.get(id));
    if (sources.some((source) => !source)) {
      issues.push(
        issue(
          "error",
          "blocking",
          "unknown_source",
          "claims",
          record.id
        )
      );
    }
    if (
      record.verificationStatus === "reviewed" &&
      sources.length &&
      sources.every((source) =>
        ["needs_review", "demo_only"].includes(source?.verificationStatus)
      )
    ) {
      issues.push(
        issue(
          "error",
          "blocking",
          "reviewed_record_only_demo_sources",
          "claims",
          record.id
        )
      );
    }
    if (!record.reviewedBy || !record.reviewedAt) {
      issues.push(
        issue(
          "warning",
          "editorial",
          "missing_reviewer_metadata",
          "claims",
          record.id
        )
      );
    }
  });

  scienceDatasets.archiveMaps.forEach((record) => {
    if (record.license?.status === "unknown" && record.imageUrl) {
      issues.push(
        issue(
          "warning",
          "licensing",
          "unknown_license_image_must_not_export",
          "archiveMaps",
          record.id
        )
      );
    }
  });

  scienceDatasets.stories.forEach((story) => {
    story.steps.forEach((step) => {
      (step.sourceIds || []).forEach((sourceId) => {
        if (!sourceById.has(sourceId)) {
          issues.push(
            issue(
              "error",
              "blocking",
              "story_unknown_source",
              "stories",
              `${story.id}:${step.id}`,
              sourceId
            )
          );
        }
      });
    });
  });

  [
    ...scienceDatasets.geometries,
    ...scienceDatasets.routeSegments,
    ...scienceDatasets.hydrology,
  ].forEach((record) => {
    if (
      getScientificReadiness(record) === "exhibition_ready" &&
      (record.licenseStatus === "unknown" ||
        record.license?.status === "unknown")
    ) {
      issues.push(
        issue(
          "error",
          "licensing",
          "ready_record_unknown_license",
          "records",
          record.id
        )
      );
    }
  });

  scienceDatasets.claims
    .filter((claim) => /area|distance|length|measurement/i.test(claim.predicate))
    .forEach((claim) => {
      const record = [
        ...scienceDatasets.geometries,
        ...scienceDatasets.routeSegments,
      ].find((candidate) => candidate.id === claim.subjectId);
      if (
        record &&
        !canCalculateAreaPrecisely(record) &&
        !canCalculateDistancePrecisely(record)
      ) {
        issues.push(
          issue(
            "warning",
            "scientific",
            "measurement_incompatible_precision",
            "claims",
            claim.id
          )
        );
      }
    });

  return resultSummary(issues);
};

if (isDirectRun(import.meta.url)) {
  printValidationResult(
    "Scientific evidence",
    validateScientificEvidence()
  );
}
