import {
  scienceDatasets,
  allScienceRecords,
} from "./science-data.mjs";
import {
  activeAtYear,
  isDirectRun,
  issue,
  printValidationResult,
  resultSummary,
} from "./validation-utils.mjs";
import { getGeographySnapshotAtYear } from "../../src/features/exhibition/temporalGeographyModel.js";

const range = (record) => ({
  from:
    record.validFromYear ??
    record.startYear ??
    record.birthYear ??
    record.fromYear,
  to:
    record.validToYear ??
    record.endYear ??
    record.deathYear ??
    record.toYear,
});

export const findSnapshotIntervalIssues = (records = []) => {
  const findings = [];
  const byFeature = Map.groupBy(records, (record) => record.featureId || record.id);
  byFeature.forEach((items, featureId) => {
    const sorted = [...items].sort(
      (left, right) => left.validFromYear - right.validFromYear
    );
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (
        previous.validToYear == null ||
        current.validFromYear <= previous.validToYear
      ) {
        findings.push({
          code: "snapshot_overlap",
          featureId,
          records: [previous.id, current.id],
        });
      } else if (current.validFromYear > previous.validToYear + 1) {
        findings.push({
          code: "snapshot_gap",
          featureId,
          records: [previous.id, current.id],
        });
      }
    }
  });
  return findings;
};

export const isEntityGeometryWithinPeriod = (geometry, entity) =>
  Boolean(
    entity &&
      geometry.validFromYear >= entity.startYear &&
      (entity.endYear == null ||
        (geometry.validToYear != null &&
          geometry.validToYear <= entity.endYear))
  );

export const isRouteSegmentWithinPeriod = (segment, route) =>
  Boolean(
    route &&
      segment.validFromYear >= route.validFromYear &&
      (route.validToYear == null ||
        (segment.validToYear != null &&
          segment.validToYear <= route.validToYear))
  );

export const isHistoricalNameWithinPlacePeriod = (name, place) =>
  name.validFromYear >= place.validFromYear &&
  (place.validToYear == null ||
    (name.validToYear != null && name.validToYear <= place.validToYear));

export const validateTemporalConsistency = () => {
  const issues = [];
  allScienceRecords().forEach(({ recordType, record }) => {
    const { from, to } = range(record);
    if (Number.isFinite(from) && Number.isFinite(to) && to < from) {
      issues.push(
        issue("error", "temporal", "impossible_range", recordType, record.id)
      );
    }
    if (
      record.verificationStatus === "needs_review" ||
      record.confidenceLevel === "low"
    ) {
      issues.push(
        issue("warning", "temporal", "needs_review", recordType, record.id)
      );
    }
  });

  const entityById = new Map(
    scienceDatasets.entities.map((record) => [record.id, record])
  );
  scienceDatasets.geometries.forEach((geometry) => {
    const entity = entityById.get(geometry.entityId);
    if (!entity) {
      issues.push(
        issue("error", "reference", "unknown_entity", "geometries", geometry.id)
      );
      return;
    }
    if (
      geometry.validFromYear < entity.startYear ||
      (entity.endYear != null &&
        (geometry.validToYear == null || geometry.validToYear > entity.endYear))
    ) {
      issues.push(
        issue(
          "error",
          "temporal",
          "geometry_outside_entity_period",
          "geometries",
          geometry.id
        )
      );
    }
  });

  const routeById = new Map(
    scienceDatasets.routes.map((record) => [record.id, record])
  );
  scienceDatasets.routeSegments.forEach((segment) => {
    const route = routeById.get(segment.routeId);
    if (!route) {
      issues.push(
        issue("error", "reference", "unknown_route", "routeSegments", segment.id)
      );
    } else if (
      segment.validFromYear < route.validFromYear ||
      (route.validToYear != null &&
        (segment.validToYear == null || segment.validToYear > route.validToYear))
    ) {
      issues.push(
        issue(
          "error",
          "temporal",
          "segment_outside_route_period",
          "routeSegments",
          segment.id
        )
      );
    }
  });

  scienceDatasets.places.forEach((place) => {
    place.names.forEach((name, index) => {
      if (
        name.validFromYear < place.validFromYear ||
        (place.validToYear != null &&
          (name.validToYear == null || name.validToYear > place.validToYear))
      ) {
        issues.push(
          issue(
            "warning",
            "temporal",
            "name_outside_place_period",
            "places",
            `${place.id}:name-${index}`
          )
        );
      }
    });
  });

  const checkSnapshotSequence = (records, recordType) => {
    const byFeature = Map.groupBy(records, (record) => record.featureId || record.id);
    byFeature.forEach((items, featureId) => {
      const sorted = [...items].sort(
        (left, right) => left.validFromYear - right.validFromYear
      );
      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1];
        const current = sorted[index];
        if (previous.validToYear == null || current.validFromYear <= previous.validToYear) {
          issues.push(
            issue(
              "error",
              "temporal",
              "snapshot_overlap",
              recordType,
              featureId,
              `${previous.id} / ${current.id}`
            )
          );
        } else if (current.validFromYear > previous.validToYear + 1) {
          issues.push(
            issue(
              "warning",
              "temporal",
              "snapshot_gap",
              recordType,
              featureId,
              `${previous.validToYear + 1}–${current.validFromYear - 1}`
            )
          );
        }
      }
    });
  };
  checkSnapshotSequence(scienceDatasets.hydrology, "hydrology");
  checkSnapshotSequence(scienceDatasets.rivers, "rivers");

  const modernAral = scienceDatasets.hydrology.find(
    (record) => record.id === "aral-sea-modern-demo"
  );
  if (modernAral && activeAtYear(modernAral, 1000)) {
    issues.push(
      issue(
        "error",
        "temporal",
        "modern_snapshot_in_ancient_period",
        "hydrology",
        modernAral.id
      )
    );
  }
  if (getGeographySnapshotAtYear("aral-sea", 1000)?.id === modernAral?.id) {
    issues.push(
      issue(
        "error",
        "runtime",
        "modern_snapshot_selected_for_ancient_year",
        "hydrology",
        modernAral.id
      )
    );
  }
  [...scienceDatasets.hydrology, ...scienceDatasets.rivers].forEach((record) => {
    if (record.interpolationAllowed !== false) {
      issues.push(
        issue(
          "error",
          "runtime",
          "interpolation_policy_violation",
          record.featureType === "river" ? "rivers" : "hydrology",
          record.id
        )
      );
    }
  });

  const knownEntities = new Set(scienceDatasets.entities.map((record) => record.id));
  scienceDatasets.stories.forEach((story) => {
    story.steps.forEach((step) => {
      const ids = [
        step.entityId,
        ...(step.entityIds || []),
        step.selectedEntityId,
      ].filter(Boolean);
      ids.forEach((id) => {
        if (!knownEntities.has(id)) {
          issues.push(
            issue(
              "error",
              "reference",
              "story_unknown_entity",
              "stories",
              `${story.id}:${step.id}`,
              id
            )
          );
        }
      });
    });
  });

  return resultSummary(issues);
};

if (isDirectRun(import.meta.url)) {
  printValidationResult(
    "Temporal consistency",
    validateTemporalConsistency()
  );
}
