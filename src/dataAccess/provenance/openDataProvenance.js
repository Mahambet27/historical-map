const REQUIRED_FIELDS = [
  "sourceIds",
  "sourceRecordIds",
  "sourceUrls",
  "sourceVersion",
  "accessedAt",
  "importedAt",
  "importerVersion",
  "licenseStatus",
  "attribution",
  "rawRecordHash",
  "transformationNotes",
  "verificationStatus",
];

export const validateOpenDataProvenance = (provenance) => {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = provenance?.[field];
    return value == null || value === "" || (Array.isArray(value) && value.length === 0);
  });
  return { valid: missing.length === 0, missing };
};

export const mergeProvenance = (...records) => ({
  sourceIds: [...new Set(records.flatMap((item) => item?.sourceIds || []))],
  sourceRecordIds: [
    ...new Set(records.flatMap((item) => item?.sourceRecordIds || [])),
  ],
  sourceUrls: [...new Set(records.flatMap((item) => item?.sourceUrls || []))],
  sourceVersion: records.map((item) => item?.sourceVersion).filter(Boolean).join("; "),
  accessedAt: records.map((item) => item?.accessedAt).filter(Boolean).sort().at(-1),
  importedAt: records.map((item) => item?.importedAt).filter(Boolean).sort().at(-1),
  importerVersion: records
    .map((item) => item?.importerVersion)
    .filter(Boolean)
    .join("; "),
  licenseStatus: records
    .map((item) => item?.licenseStatus)
    .filter(Boolean)
    .join("; "),
  attribution: records.map((item) => item?.attribution).filter(Boolean).join("; "),
  rawRecordHash: records
    .map((item) => item?.rawRecordHash)
    .filter(Boolean)
    .join("; "),
  transformationNotes: records
    .flatMap((item) => item?.transformationNotes || [])
    .filter(Boolean),
  verificationStatus: "needs_review",
});
