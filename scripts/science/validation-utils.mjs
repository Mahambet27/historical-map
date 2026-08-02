import { pathToFileURL } from "node:url";
import path from "node:path";

export const issue = (severity, category, code, recordType, id, detail = "") => ({
  severity,
  category,
  code,
  recordType,
  id,
  detail,
});

export const resultSummary = (issues) => ({
  errors: issues.filter((item) => item.severity === "error").length,
  warnings: issues.filter((item) => item.severity === "warning").length,
  issues,
});

export const printValidationResult = (name, result) => {
  result.issues.forEach((item) => {
    const output = `${item.severity.toUpperCase()} ${item.category}/${item.code} ${item.recordType}:${item.id}${item.detail ? ` — ${item.detail}` : ""}`;
    (item.severity === "error" ? console.error : console.warn)(output);
  });
  console.log(
    `${name}: ${result.errors} errors, ${result.warnings} warnings`
  );
  if (result.errors) process.exitCode = 1;
};

export const isDirectRun = (metaUrl) =>
  Boolean(
    process.argv[1] &&
      pathToFileURL(path.resolve(process.argv[1])).href === metaUrl
  );

export const activeAtYear = (record, year) =>
  record.validFromYear <= year &&
  (record.validToYear == null || record.validToYear >= year);

