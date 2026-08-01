import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { projectRoot } from "./local-database-utils.mjs";

const outputDirectory = path.join(projectRoot, ".p2a5");
const outputPath = path.join(outputDirectory, "verification.json");

const readCurrent = async () => {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return { schemaVersion: 1, sections: {} };
  }
};

export const updateVerificationReport = async (section, result) => {
  const current = await readCurrent();
  const next = {
    ...current,
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    sections: {
      ...current.sections,
      [section]: {
        ...result,
        checkedAt: new Date().toISOString(),
      },
    },
  };
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
};

export const verificationOutputPath = outputPath;

export const createCheckCollector = () => {
  const checks = [];
  const check = (name, passed, detail = "") => {
    checks.push({ name, passed: Boolean(passed), detail });
  };
  return {
    check,
    checks,
    get passed() {
      return checks.every((item) => item.passed);
    },
    print() {
      for (const item of checks) {
        console.log(
          `${item.passed ? "PASS" : "FAIL"} ${item.name}${
            item.detail ? ` — ${item.detail}` : ""
          }`
        );
      }
    },
  };
};

