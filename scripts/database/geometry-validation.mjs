const SUPPORTED_TYPES = new Set([
  "Polygon",
  "MultiPolygon",
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
]);

const issue = (severity, code, record, recommendation, details = {}) => ({
  severity,
  code,
  subjectId: record.subject_id || record.feature_id || record.route_id || record.id,
  geometryId: record.id,
  recommendation,
  ...details,
});

const sameCoordinate = (left, right) =>
  Array.isArray(left) &&
  Array.isArray(right) &&
  left.length >= 2 &&
  right.length >= 2 &&
  left[0] === right[0] &&
  left[1] === right[1];

const coordinatePairs = (coordinates, output = []) => {
  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1])
  ) {
    output.push(coordinates);
    return output;
  }
  if (Array.isArray(coordinates)) {
    coordinates.forEach((value) => coordinatePairs(value, output));
  }
  return output;
};

const ringsFor = (geometry) => {
  if (geometry.type === "Polygon") return geometry.coordinates || [];
  if (geometry.type === "MultiPolygon") return (geometry.coordinates || []).flat();
  return [];
};

const orientation = (a, b, c) =>
  (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);

const intersects = (a, b, c, d) => {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
};

const ringSelfIntersects = (ring) => {
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

export const validateGeometryRecord = (record, claims = []) => {
  const issues = [];
  const geometry = record.geometry;
  if (!geometry || typeof geometry !== "object") {
    return [
      issue(
        "error",
        "missing_geometry",
        record,
        "Provide reviewed GeoJSON; do not synthesize geometry automatically."
      ),
    ];
  }
  if (!SUPPORTED_TYPES.has(geometry.type)) {
    issues.push(
      issue(
        "error",
        "unsupported_geometry_type",
        record,
        "Use one of the P2A supported geometry types.",
        { actualType: geometry.type || null }
      )
    );
  }

  const pairs = coordinatePairs(geometry.coordinates);
  if (pairs.length === 0) {
    issues.push(
      issue(
        "error",
        "empty_geometry",
        record,
        "Replace the empty record with reviewed geometry or skip it explicitly."
      )
    );
  }
  pairs.forEach(([longitude, latitude]) => {
    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      issues.push(
        issue(
          "error",
          "invalid_coordinate",
          record,
          "Review the source coordinate; the validator will not clamp it.",
          { coordinate: [longitude, latitude] }
        )
      );
    }
  });

  ringsFor(geometry).forEach((ring, ringIndex) => {
    if (!Array.isArray(ring) || ring.length < 4) {
      issues.push(
        issue(
          "error",
          "invalid_ring",
          record,
          "Provide a ring with at least four coordinates.",
          { ringIndex }
        )
      );
      return;
    }
    if (!sameCoordinate(ring[0], ring[ring.length - 1])) {
      issues.push(
        issue(
          "error",
          "open_polygon_ring",
          record,
          "Close the ring in the reviewed source file; do not auto-close it.",
          { ringIndex }
        )
      );
    }
    for (let index = 1; index < ring.length; index += 1) {
      if (sameCoordinate(ring[index - 1], ring[index])) {
        issues.push(
          issue(
            "warning",
            "duplicate_consecutive_coordinate",
            record,
            "Review and remove the duplicate only in the curated source.",
            { ringIndex, coordinateIndex: index }
          )
        );
      }
    }
    if (ringSelfIntersects(ring)) {
      issues.push(
        issue(
          "error",
          "self_intersection",
          record,
          "Review the source ring; do not apply ST_MakeValid silently.",
          { ringIndex }
        )
      );
    }
  });

  if (
    record.valid_from_year != null &&
    record.valid_to_year != null &&
    record.valid_to_year < record.valid_from_year
  ) {
    issues.push(
      issue(
        "error",
        "reversed_year_range",
        record,
        "Review the historical validity range."
      )
    );
  }
  if (!record.verification_status) {
    issues.push(
      issue(
        "error",
        "missing_verification_status",
        record,
        "Assign a reviewed status explicitly; never infer verified."
      )
    );
  }
  if (
    record.subject_type === "entity" &&
    !claims.some(
      (claim) =>
        claim.subject_type === "geometry" &&
        claim.subject_id === record.id
    )
  ) {
    issues.push(
      issue(
        "warning",
        "missing_source_claim",
        record,
        "Add a territorial_extent claim explaining what the geometry represents."
      )
    );
  }
  issues.push(
    issue(
      "warning",
      "srid_assumption",
      record,
      "Coordinates are assumed to be WGS84/EPSG:4326; verify provenance before publication."
    )
  );
  return issues;
};

export const validateGeometryTables = (seedData) => {
  const claims = seedData.tables.source_claims || [];
  const records = [
    ...(seedData.tables.historical_geometries || []),
    ...(seedData.tables.historical_places || []).map((record) => ({
      ...record,
      geometry: record.point,
      subject_type: "place",
      subject_id: record.id,
    })),
    ...(seedData.tables.route_segments || []),
    ...(seedData.tables.environment_snapshots || []).map((record) => ({
      ...record,
      subject_type: "environment",
      subject_id: record.id,
    })),
    ...(seedData.tables.hydrology_snapshots || []).map((record) => ({
      ...record,
      subject_type: "hydrology",
      subject_id: record.id,
    })),
  ];
  const issues = records.flatMap((record) =>
    validateGeometryRecord(record, claims)
  );
  return {
    records: records.length,
    errors: issues.filter((item) => item.severity === "error").length,
    warnings: issues.filter((item) => item.severity === "warning").length,
    issues,
  };
};
