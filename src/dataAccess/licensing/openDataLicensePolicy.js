export const LICENSE_STATUS = Object.freeze({
  ALLOWED: "allowed",
  ALLOWED_WITH_ATTRIBUTION: "allowed_with_attribution",
  ISOLATED_SHARE_ALIKE: "isolated_share_alike",
  NONCOMMERCIAL_ONLY: "noncommercial_only",
  REVIEW_REQUIRED: "review_required",
  PROHIBITED: "prohibited",
  UNKNOWN: "unknown",
});

const normalized = (license) => String(license || "").trim().toLowerCase();

export const getOpenDataLicenseStatus = (license) => {
  const value = normalized(license);
  if (!value) return LICENSE_STATUS.UNKNOWN;
  if (value.includes("unknown")) return LICENSE_STATUS.UNKNOWN;
  if (value.includes("restricted")) return LICENSE_STATUS.PROHIBITED;
  if (value.includes("odbl") || value.includes("by-sa")) {
    return LICENSE_STATUS.ISOLATED_SHARE_ALIKE;
  }
  if (value.includes("by-nc") || value.includes("non-commercial")) {
    return LICENSE_STATUS.NONCOMMERCIAL_ONLY;
  }
  if (value.includes("cc0") || value.includes("public domain")) {
    return LICENSE_STATUS.ALLOWED;
  }
  if (value.includes("cc by")) {
    return LICENSE_STATUS.ALLOWED_WITH_ATTRIBUTION;
  }
  if (
    value.includes("dataset-specific") ||
    value.includes("product-specific") ||
    value.includes("terms") ||
    value.includes("legal notice") ||
    value.includes("open data policy")
  ) {
    return LICENSE_STATUS.REVIEW_REQUIRED;
  }
  return LICENSE_STATUS.UNKNOWN;
};

export const validateSourceLicense = (source) => {
  const status = getOpenDataLicenseStatus(source?.license);
  const errors = [];
  if ([LICENSE_STATUS.UNKNOWN, LICENSE_STATUS.PROHIBITED].includes(status)) {
    errors.push("license_not_importable");
  }
  if (
    status === LICENSE_STATUS.ALLOWED_WITH_ATTRIBUTION &&
    !source?.attributionRequired
  ) {
    errors.push("attribution_policy_mismatch");
  }
  return {
    valid: errors.length === 0,
    status,
    errors,
    isolated: status === LICENSE_STATUS.ISOLATED_SHARE_ALIKE,
    productionEligible:
      source?.commercialUseAllowed === true &&
      ![
        LICENSE_STATUS.NONCOMMERCIAL_ONLY,
        LICENSE_STATUS.REVIEW_REQUIRED,
        LICENSE_STATUS.UNKNOWN,
        LICENSE_STATUS.PROHIBITED,
      ].includes(status),
  };
};

export const assertImportableLicense = (source) => {
  const result = validateSourceLicense(source);
  if (!result.valid) {
    throw new Error(`Import blocked for ${source?.id || "source"}: ${result.errors.join(", ")}`);
  }
  return result;
};
