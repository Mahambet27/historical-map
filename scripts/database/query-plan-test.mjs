import { writeFile } from "node:fs/promises";
import path from "node:path";

import {
  projectRoot,
  safeErrorMessage,
  withPgClient,
} from "./local-database-utils.mjs";
import { updateVerificationReport } from "./verification-report.mjs";

const reportPath = path.join(
  projectRoot,
  "docs",
  "P2A5_QUERY_PLAN_REPORT.md"
);

const queries = [
  {
    name: "get_historical_geometries",
    parameters: "year=1465, bbox=40/35/100/75",
    sql: "select * from public.get_historical_geometries(1465, 40, 35, 100, 75)",
  },
  {
    name: "get_historical_places",
    parameters: "year=1465, bbox=40/35/100/75, limit=500",
    sql: "select * from public.get_historical_places(1465, 40, 35, 100, 75, null, 500)",
  },
  {
    name: "get_historical_routes",
    parameters: "year=1465",
    sql: "select public.get_historical_routes(1465)",
  },
  {
    name: "get_subject_evidence",
    parameters: "entity/kazakh-khanate",
    sql: "select public.get_subject_evidence('entity', 'kazakh-khanate')",
  },
  {
    name: "get_exhibition_snapshot",
    parameters: "year=1465, bbox=40/35/100/75, language=ru",
    sql: "select public.get_exhibition_snapshot(1465, 40, 35, 100, 75, 'ru')",
  },
  {
    name: "get_educational_story",
    parameters: "historical-evidence",
    sql: "select public.get_educational_story('historical-evidence')",
  },
  {
    name: "direct_spatial_index_probe",
    parameters: "year=1465, bbox=68/41/74/47",
    sql: `select id
      from public.historical_geometries
      where (valid_from_year is null or valid_from_year <= 1465)
        and (valid_to_year is null or valid_to_year >= 1465)
        and extensions.st_intersects(
          geom,
          extensions.st_makeenvelope(68, 41, 74, 47, 4326)
        )
      limit 1000`,
  },
];

const collectNodes = (node, output = []) => {
  output.push(node);
  for (const child of node.Plans || []) collectNodes(child, output);
  return output;
};

const writeReport = async (result) => {
  const rows = (result.plans || [])
    .map(
      (plan) =>
        `| \`${plan.name}\` | ${plan.parameters} | ${plan.planningTimeMs.toFixed(
          3
        )} | ${plan.executionTimeMs.toFixed(3)} | ${plan.actualRows} | ${
          plan.indexes.join(", ") || "none"
        } | ${plan.sequentialScans.join(", ") || "none"} |`
    )
    .join("\n");
  const content = `# P2A.5 Query Plan Report

Date: ${new Date().toISOString()}

Overall status: **${result.passed ? "passed" : "failed"}**

| Function/query | Parameters | Planning ms | Execution ms | Rows | Index usage | Sequential scans |
| --- | --- | ---: | ---: | ---: | --- | --- |
${rows || "| Not executed | — | 0 | 0 | 0 | — | — |"}

The seed dataset is intentionally small. A sequential scan can be the correct
planner choice at this size and is not by itself classified as an index defect.
The direct spatial probe records whether the GiST path becomes attractive for a
bounded envelope; production-scale recommendations should be based on staging
cardinality and representative statistics.

${result.error ? `Error: \`${result.error}\`` : ""}
`;
  await writeFile(reportPath, content, "utf8");
};

try {
  const result = await withPgClient(async (client) => {
    const plans = [];
    for (const query of queries) {
      const explained = await client.query(
        `explain (analyze, buffers, format json) ${query.sql}`
      );
      const top = explained.rows[0]["QUERY PLAN"][0];
      const nodes = collectNodes(top.Plan);
      plans.push({
        name: query.name,
        parameters: query.parameters,
        planningTimeMs: top["Planning Time"],
        executionTimeMs: top["Execution Time"],
        actualRows: top.Plan["Actual Rows"] || 0,
        nodeTypes: [...new Set(nodes.map((node) => node["Node Type"]))],
        indexes: [
          ...new Set(nodes.map((node) => node["Index Name"]).filter(Boolean)),
        ],
        sequentialScans: [
          ...new Set(
            nodes
              .filter((node) => node["Node Type"] === "Seq Scan")
              .map((node) => node["Relation Name"])
              .filter(Boolean)
          ),
        ],
        sharedHitBlocks: nodes.reduce(
          (total, node) => total + (node["Shared Hit Blocks"] || 0),
          0
        ),
      });
    }
    return { passed: true, plans };
  });
  for (const plan of result.plans) {
    console.log(
      `PASS ${plan.name} — ${plan.executionTimeMs.toFixed(3)} ms, ${plan.actualRows} rows`
    );
  }
  await writeReport(result);
  await updateVerificationReport("queryPlans", result);
} catch (error) {
  const safeMessage = safeErrorMessage(error);
  console.error(`Query plan verification failed: ${safeMessage}`);
  const result = { passed: false, error: safeMessage, plans: [] };
  await writeReport(result);
  await updateVerificationReport("queryPlans", result);
  process.exitCode = 1;
}

