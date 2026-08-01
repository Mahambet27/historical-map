export const REVIEW_STATUSES = [
  "pending",
  "in_review",
  "approved",
  "rejected",
  "needs_more_sources",
];

const hasTranslations = (value) =>
  ["ru", "kk", "en"].every((language) => Boolean(value?.[language]));

const validUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value, "https://qhm.local");
    return ["http:", "https:"].includes(url.protocol) || value.startsWith("/");
  } catch {
    return false;
  }
};

export const validateEvidenceData = ({
  sources = [],
  claims = [],
  archiveMaps = [],
  geometries = [],
  reviews = [],
} = {}) => {
  const errors = [];
  const warnings = [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const territorialGeometryIds = new Set(
    claims
      .filter((claim) => claim.subjectType === "geometry" && claim.predicate === "territorial_extent")
      .map((claim) => claim.subjectId)
  );

  sources.forEach((source) => {
    if (!validUrl(source.url)) errors.push({ code: "invalid_source_url", id: source.id });
  });
  claims.forEach((claim) => {
    if (claim.verificationStatus === "verified" && !claim.sourceIds?.length) {
      errors.push({ code: "verified_claim_without_source", id: claim.id });
    } else if (!claim.sourceIds?.length) {
      warnings.push({ code: "claim_without_source", id: claim.id });
    }
    (claim.sourceIds || []).forEach((sourceId) => {
      if (!sourceById.has(sourceId)) {
        errors.push({ code: "unknown_source", id: claim.id, sourceId });
      }
    });
    if (
      claim.verificationStatus === "reviewed" &&
      claim.sourceIds?.length &&
      claim.sourceIds.every((sourceId) =>
        ["needs_review", "demo_only"].includes(sourceById.get(sourceId)?.verificationStatus)
      )
    ) {
      errors.push({ code: "reviewed_claim_only_unreviewed_sources", id: claim.id });
    }
    if (claim.valueType === "year_range" && claim.value?.endYear < claim.value?.startYear) {
      errors.push({ code: "reverse_year_range", id: claim.id });
    }
    if (!hasTranslations(claim.labels)) warnings.push({ code: "missing_translation", id: claim.id });
    if (!claim.reviewedBy || !claim.reviewedAt) warnings.push({ code: "missing_reviewer", id: claim.id });
  });
  archiveMaps.forEach((map) => {
    if (!map.license?.status) errors.push({ code: "archive_missing_license", id: map.id });
    if (map.license?.status === "unknown") warnings.push({ code: "unknown_license", id: map.id });
    if (map.georeferenceType === "image-corners" && map.coordinates?.length !== 4) {
      errors.push({ code: "invalid_image_corners", id: map.id });
    }
    if (map.validFromYear !== null && map.validToYear !== null && map.validToYear < map.validFromYear) {
      errors.push({ code: "reverse_year_range", id: map.id });
    }
    if (!hasTranslations(map.titles) || !hasTranslations(map.descriptions)) {
      warnings.push({ code: "missing_translation", id: map.id });
    }
  });
  geometries.forEach((geometry) => {
    if (!territorialGeometryIds.has(geometry.id)) {
      warnings.push({ code: "geometry_without_territorial_claim", id: geometry.id });
    }
    if (
      Number.isFinite(geometry.validFromYear) &&
      Number.isFinite(geometry.validToYear) &&
      geometry.validToYear < geometry.validFromYear
    ) {
      errors.push({ code: "reverse_year_range", id: geometry.id });
    }
    if (geometry.verificationStatus === "needs_review") {
      warnings.push({ code: "needs_review_geometry", id: geometry.id });
    }
  });
  reviews.forEach((review) => {
    if (!REVIEW_STATUSES.includes(review.status)) {
      errors.push({ code: "invalid_review_status", id: review.itemId });
    }
  });
  return { errors, warnings };
};
