import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  projectRoot,
  safeErrorMessage,
  withPgClient,
} from "./local-database-utils.mjs";
import { updateVerificationReport } from "./verification-report.mjs";

const sqlPath = path.join(
  projectRoot,
  "supabase",
  "tests",
  "p2a_security_checks.sql"
);
const reportPath = path.join(
  projectRoot,
  "docs",
  "P2A5_RLS_SECURITY_REPORT.md"
);

const writeReport = async (result) => {
  const rows = (result.assertions || [])
    .map((assertion, index) => `| ${index + 1} | \`${assertion}\` | passed |`)
    .join("\n");
  const content = `# P2A.5 RLS Security Report

Date: ${new Date().toISOString()}

Overall status: **${result.passed ? "passed" : "failed"}**

The checks execute inside a transaction against the local database, switch to
the real \`anon\` role, and always roll back their fixtures.

| # | Assertion | Result |
| ---: | --- | --- |
${rows || "| 1 | SQL security checks | not executed |"}

Additional anonymous REST write-denial checks for entities, geometries,
sources, claims and archive maps are performed by \`npm run db:rpc:test\`.

${result.error ? `Error: \`${result.error}\`` : ""}
`;
  await writeFile(reportPath, content, "utf8");
};

try {
  const sql = await readFile(sqlPath, "utf8");
  const notices = [];
  await withPgClient(async (client) => {
    client.on("notice", (notice) => {
      if (notice.message.startsWith("P2A_SECURITY_")) {
        notices.push(notice.message);
      }
    });
    await client.query(sql);
  });

  for (const notice of notices) console.log(`PASS ${notice}`);
  const result = {
    passed: notices.length >= 12,
    assertionCount: notices.length,
    assertions: notices,
  };
  if (!result.passed) {
    console.error(
      `Security checks returned ${notices.length} assertion results; expected at least 12.`
    );
    process.exitCode = 1;
  }
  await writeReport(result);
  await updateVerificationReport("rls", result);
} catch (error) {
  console.error(`SQL security checks failed: ${safeErrorMessage(error)}`);
  const result = {
    passed: false,
    error: safeErrorMessage(error),
    assertions: [],
  };
  await writeReport(result);
  await updateVerificationReport("rls", result);
  process.exitCode = 1;
}
