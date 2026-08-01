import { writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  assertLocalDatabase,
  getLocalSupabaseStatus,
  projectRoot,
  safeErrorMessage,
} from "./local-database-utils.mjs";
import { updateVerificationReport } from "./verification-report.mjs";

const reportPath = path.join(
  projectRoot,
  "docs",
  "P2A5_PERFORMANCE_REPORT.md"
);
const cases = [
  { year: -700, bbox: [40, 35, 100, 75] },
  { year: 552, bbox: [60, 40, 80, 60] },
  { year: 1465, bbox: [68, 41, 74, 47] },
  { year: 1511, bbox: [55, 40, 75, 60] },
  { year: 1936, bbox: [40, 35, 100, 75] },
  { year: 1991, bbox: [65, 40, 85, 60] },
  { year: 2026, bbox: [40, 35, 100, 75] },
];

const percentile = (sorted, fraction) =>
  sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)] ||
  0;

const recordCount = (snapshot) =>
  [
    snapshot.entities,
    snapshot.geometries,
    snapshot.places,
    snapshot.environment,
    snapshot.hydrology,
    snapshot.routes?.routes,
    snapshot.routes?.segments,
  ].reduce((total, rows) => total + (rows?.length || 0), 0);

const writeReport = async (result) => {
  const content = `# P2A.5 Performance Report

Date: ${new Date().toISOString()}

Overall status: **${result.passed ? "passed" : "failed"}**

This is a bounded local smoke check, not an aggressive load test.

- Sequential requests: ${result.sequentialRequests ?? 0}
- Concurrent requests: ${result.concurrentRequests ?? 0}
- Concurrency: ${result.concurrency ?? 0}
- Errors: ${result.errors ?? 0}
- Minimum latency: ${result.minMs?.toFixed(2) ?? "not measured"} ms
- Median latency: ${result.medianMs?.toFixed(2) ?? "not measured"} ms
- p95 latency: ${result.p95Ms?.toFixed(2) ?? "not measured"} ms
- Maximum latency: ${result.maxMs?.toFixed(2) ?? "not measured"} ms
- Median payload: ${Math.round((result.medianPayloadBytes || 0) / 1024)} KiB
- Maximum payload: ${Math.round((result.maxPayloadBytes || 0) / 1024)} KiB
- Median records: ${result.medianRecords ?? 0}
- Maximum records: ${result.maxRecords ?? 0}
- Cache: bypassed; values represent API/database latency

${result.error ? `Error: \`${result.error}\`` : ""}
`;
  await writeFile(reportPath, content, "utf8");
};

try {
  const status = await getLocalSupabaseStatus();
  process.env.P2A_LOCAL_SUPABASE_URL = status.apiUrl;
  await assertLocalDatabase({ requireApiUrl: true });
  if (!status.anonKey) {
    throw new Error("Local anonymous key is unavailable from Supabase status.");
  }
  const client = createClient(status.apiUrl, status.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const observations = [];
  const request = async (testCase) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const started = performance.now();
    try {
      const query = client.rpc("get_exhibition_snapshot", {
        p_year: testCase.year,
        p_west: testCase.bbox[0],
        p_south: testCase.bbox[1],
        p_east: testCase.bbox[2],
        p_north: testCase.bbox[3],
        p_language: "ru",
      });
      const { data, error } = await query.abortSignal(controller.signal);
      const durationMs = performance.now() - started;
      if (error) {
        observations.push({ durationMs, error: true, payloadBytes: 0, records: 0 });
        return;
      }
      observations.push({
        durationMs,
        error: false,
        payloadBytes: Buffer.byteLength(JSON.stringify(data), "utf8"),
        records: recordCount(data),
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  for (let index = 0; index < 30; index += 1) {
    await request(cases[index % cases.length]);
  }
  await Promise.all(
    Array.from({ length: 8 }, (_, index) => request(cases[index % cases.length]))
  );

  const successful = observations.filter((item) => !item.error);
  const latencies = successful
    .map((item) => item.durationMs)
    .sort((left, right) => left - right);
  const payloads = successful
    .map((item) => item.payloadBytes)
    .sort((left, right) => left - right);
  const records = successful
    .map((item) => item.records)
    .sort((left, right) => left - right);
  const errors = observations.length - successful.length;
  const result = {
    passed: observations.length === 38 && errors === 0,
    sequentialRequests: 30,
    concurrentRequests: 8,
    concurrency: 8,
    errors,
    minMs: latencies[0] || 0,
    medianMs: percentile(latencies, 0.5),
    p95Ms: percentile(latencies, 0.95),
    maxMs: latencies.at(-1) || 0,
    medianPayloadBytes: percentile(payloads, 0.5),
    maxPayloadBytes: payloads.at(-1) || 0,
    medianRecords: percentile(records, 0.5),
    maxRecords: records.at(-1) || 0,
  };
  console.log(
    `Smoke test: ${result.passed ? "passed" : "failed"}; median ${result.medianMs.toFixed(
      2
    )} ms, p95 ${result.p95Ms.toFixed(2)} ms, errors ${errors}`
  );
  await writeReport(result);
  await updateVerificationReport("performance", result);
  if (!result.passed) process.exitCode = 1;
} catch (error) {
  const safeMessage = safeErrorMessage(error);
  console.error(`Smoke test failed: ${safeMessage}`);
  const result = { passed: false, error: safeMessage };
  await writeReport(result);
  await updateVerificationReport("performance", result);
  process.exitCode = 1;
}

