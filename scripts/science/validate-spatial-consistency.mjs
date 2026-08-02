import { scienceDatasets } from "./science-data.mjs";
import {
  isDirectRun,
  issue,
  printValidationResult,
  resultSummary,
} from "./validation-utils.mjs";

const pairs = (coordinates, output = []) => {
  if (
    Array.isArray(coordinates) &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1])
  ) {
    output.push(coordinates);
  } else if (Array.isArray(coordinates)) {
    coordinates.forEach((value) => pairs(value, output));
  }
  return output;
};
const same = (left, right) =>
  left?.[0] === right?.[0] && left?.[1] === right?.[1];
const geometryFor = (record) =>
  record.geometry?.type === "Feature"
    ? record.geometry.geometry
    : record.geometry?.type
    ? record.geometry
    : record.geometry?.geometry ||
      record.geojson?.geometry ||
      (record.coordinates && !record.geometry
        ? { type: "Point", coordinates: record.coordinates }
        : null);
const rings = (geometry) =>
  geometry?.type === "Polygon"
    ? geometry.coordinates
    : geometry?.type === "MultiPolygon"
      ? geometry.coordinates.flat()
      : [];
const distance = (left, right) =>
  left && right
    ? Math.hypot(left[0] - right[0], left[1] - right[1])
    : Number.POSITIVE_INFINITY;
const orientation = (a, b, c) =>
  (b[1] - a[1]) * (c[0] - b[0]) -
  (b[0] - a[0]) * (c[1] - b[1]);
const intersects = (a, b, c, d) => {
  const first = orientation(a, b, c) * orientation(a, b, d);
  const second = orientation(c, d, a) * orientation(c, d, b);
  return first < 0 && second < 0;
};
const selfIntersects = (ring) => {
  for (let first = 0; first < ring.length - 1; first += 1) {
    for (let second = first + 2; second < ring.length - 1; second += 1) {
      if (first === 0 && second === ring.length - 2) continue;
      if (
        intersects(
          ring[first],
          ring[first + 1],
          ring[second],
          ring[second + 1]
        )
      ) {
        return true;
      }
    }
  }
  return false;
};

export const validateSpatialConsistency = () => {
  const issues = [];
  const geometryRecords = [
    ...scienceDatasets.geometries.map((record) => ["geometries", record]),
    ...scienceDatasets.places.map((record) => ["places", record]),
    ...scienceDatasets.routeSegments.map((record) => ["routeSegments", record]),
    ...scienceDatasets.environment.map((record) => ["environment", record]),
    ...scienceDatasets.hydrology.map((record) => ["hydrology", record]),
    ...scienceDatasets.rivers.map((record) => ["rivers", record]),
  ];
  geometryRecords.forEach(([recordType, record]) => {
    const geometry = geometryFor(record);
    const coordinates = pairs(geometry?.coordinates);
    if (!geometry || !coordinates.length) {
      issues.push(
        issue("error", "geometry", "empty_geometry", recordType, record.id)
      );
      return;
    }
    coordinates.forEach((coordinate) => {
      if (
        coordinate[0] < -180 ||
        coordinate[0] > 180 ||
        coordinate[1] < -90 ||
        coordinate[1] > 90
      ) {
        issues.push(
          issue(
            "error",
            "geometry",
            "coordinate_out_of_range",
            recordType,
            record.id,
            coordinate.join(",")
          )
        );
      }
    });
    rings(geometry).forEach((ring, ringIndex) => {
      if (!same(ring[0], ring.at(-1))) {
        issues.push(
          issue(
            "error",
            "geometry",
            "open_polygon_ring",
            recordType,
            record.id,
            String(ringIndex)
          )
        );
      }
      ring.slice(1).forEach((coordinate, index) => {
        if (same(coordinate, ring[index])) {
          issues.push(
            issue(
              "warning",
              "geometry",
              "duplicate_coordinate",
              recordType,
              record.id,
              String(index + 1)
            )
          );
        }
      });
      if (selfIntersects(ring)) {
        issues.push(
          issue(
            "error",
            "geometry",
            "self_intersection",
            recordType,
            record.id,
            String(ringIndex)
          )
        );
      }
    });
  });

  scienceDatasets.places.forEach((place) => {
    const [longitude, latitude] = place.coordinates;
    if (longitude < 38 || longitude > 101 || latitude < 31 || latitude > 63) {
      issues.push(
        issue(
          "warning",
          "logic",
          "place_outside_expected_region",
          "places",
          place.id
        )
      );
    }
  });

  const placeById = new Map(
    scienceDatasets.places.map((record) => [record.id, record])
  );
  const routeGroups = Map.groupBy(
    scienceDatasets.routeSegments,
    (record) => record.routeId
  );
  routeGroups.forEach((segments, routeId) => {
    const sorted = [...segments].sort((left, right) => left.order - right.order);
    sorted.forEach((segment, index) => {
      if (segment.order !== index + 1) {
        issues.push(
          issue(
            "error",
            "logic",
            "non_contiguous_route_order",
            "routeSegments",
            segment.id
          )
        );
      }
      const geometry = geometryFor(segment);
      const line = geometry?.coordinates || [];
      const from = placeById.get(segment.fromPlaceId);
      const to = placeById.get(segment.toPlaceId);
      if (!from || !to) {
        issues.push(
          issue(
            "error",
            "reference",
            "unknown_route_endpoint",
            "routeSegments",
            segment.id
          )
        );
      } else if (
        distance(line[0], from.coordinates) > 0.5 ||
        distance(line.at(-1), to.coordinates) > 0.5
      ) {
        issues.push(
          issue(
            "warning",
            "logic",
            "route_endpoint_mismatch",
            "routeSegments",
            segment.id
          )
        );
      }
    });
    if (!scienceDatasets.routes.some((record) => record.id === routeId)) {
      issues.push(
        issue("error", "reference", "unknown_route", "routes", routeId)
      );
    }
  });

  const geometryByEntity = Map.groupBy(
    scienceDatasets.geometries,
    (record) => record.entityId
  );
  scienceDatasets.labels.forEach((label) => {
    const candidates = geometryByEntity.get(label.entityId) || [];
    const geometry = candidates.find(
      (record) =>
        record.validFromYear <= label.validFromYear &&
        (record.validToYear == null ||
          label.validFromYear <= record.validToYear)
    );
    if (!geometry) {
      issues.push(
        issue("warning", "logic", "label_without_geometry", "labels", label.id)
      );
      return;
    }
    const coordinates = pairs(geometry.geojson.geometry.coordinates);
    const minX = Math.min(...coordinates.map((item) => item[0]));
    const maxX = Math.max(...coordinates.map((item) => item[0]));
    const minY = Math.min(...coordinates.map((item) => item[1]));
    const maxY = Math.max(...coordinates.map((item) => item[1]));
    const [x, y] = label.labelPoint;
    if (x < minX - 5 || x > maxX + 5 || y < minY - 5 || y > maxY + 5) {
      issues.push(
        issue("warning", "logic", "label_far_from_geometry", "labels", label.id)
      );
    }
  });

  scienceDatasets.places
    .filter((place) => place.placeType.includes("capital"))
    .forEach((place) => {
      if (!place.entityIds.length) {
        issues.push(
          issue(
            "warning",
            "reference",
            "capital_without_entity",
            "places",
            place.id
          )
        );
      }
    });

  scienceDatasets.rivers.forEach((river) => {
    if (!river.names || !river.featureId) {
      issues.push(
        issue(
          "error",
          "reference",
          "river_label_feature_mismatch",
          "rivers",
          river.id
        )
      );
    }
  });
  const modernAral = scienceDatasets.hydrology.find(
    (record) => record.id === "aral-sea-modern-demo"
  );
  if (modernAral?.validFromYear < 1900) {
    issues.push(
      issue(
        "error",
        "logic",
        "modern_aral_in_ancient_period",
        "hydrology",
        modernAral.id
      )
    );
  }
  const hydrologyByFeature = Map.groupBy(
    scienceDatasets.hydrology,
    (record) => record.featureId
  );
  hydrologyByFeature.forEach((records, featureId) => {
    const sorted = [...records].sort(
      (left, right) => left.validFromYear - right.validFromYear
    );
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = pairs(geometryFor(sorted[index - 1]).coordinates);
      const current = pairs(geometryFor(sorted[index]).coordinates);
      const previousCenter = [
        previous.reduce((sum, item) => sum + item[0], 0) / previous.length,
        previous.reduce((sum, item) => sum + item[1], 0) / previous.length,
      ];
      const currentCenter = [
        current.reduce((sum, item) => sum + item[0], 0) / current.length,
        current.reduce((sum, item) => sum + item[1], 0) / current.length,
      ];
      if (distance(previousCenter, currentCenter) > 10) {
        issues.push(
          issue(
            "warning",
            "geometry",
            "extreme_snapshot_jump",
            "hydrology",
            featureId,
            `${sorted[index - 1].id}/${sorted[index].id}`
          )
        );
      }
    }
  });
  return resultSummary(issues);
};

if (isDirectRun(import.meta.url)) {
  printValidationResult("Spatial consistency", validateSpatialConsistency());
}
