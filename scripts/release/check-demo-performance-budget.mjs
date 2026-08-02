import { gzipSync } from "node:zlib";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoRoot } from "./package-config.mjs";

const dist = path.join(repoRoot, "dist");
const assetDir = path.join(dist, "assets");
const KiB = 1024;
const MiB = 1024 * KiB;

const filesWith = async (extension) =>
  (await readdir(assetDir))
    .filter((name) => name.endsWith(extension))
    .sort();

export const evaluateDemoBudget = ({
  initialJsGzip,
  cssGzip,
  precacheBytes,
  productionGlbBytes,
}) => {
  const hardFailures = [];
  const warnings = [];
  if (cssGzip > 80 * KiB) hardFailures.push("initial CSS gzip exceeds 80 KiB");
  if (precacheBytes > 1.2 * MiB)
    hardFailures.push("PWA precache exceeds 1.2 MiB");
  if (productionGlbBytes > 2 * MiB)
    hardFailures.push("production GLB exceeds 2 MiB");
  if (initialJsGzip > 350 * KiB)
    warnings.push("initial JS gzip exceeds advisory 350 KiB");
  return { hardFailures, warnings };
};

export const checkDemoPerformanceBudget = async () => {
  const js = await filesWith(".js");
  const css = await filesWith(".css");
  const initialJs = js.filter(
    (name) =>
      !/mapbox|model-viewer|supabase|MapView|ScientificReview/i.test(name)
  );
  const gzipTotal = async (names) => {
    let total = 0;
    for (const name of names) {
      total += gzipSync(await readFile(path.join(assetDir, name))).length;
    }
    return total;
  };
  const initialJsGzip = await gzipTotal(initialJs);
  const cssGzip = await gzipTotal(css);
  const precacheCandidates = [
    path.join(dist, "index.html"),
    ...initialJs.map((name) => path.join(assetDir, name)),
    ...css.map((name) => path.join(assetDir, name)),
  ];
  let precacheBytes = 0;
  for (const file of precacheCandidates) precacheBytes += (await stat(file)).size;
  const productionGlbBytes = (
    await stat(path.join(dist, "models", "exhibition", "bory-tastagan.glb"))
  ).size;
  const evaluation = evaluateDemoBudget({
    initialJsGzip,
    cssGzip,
    precacheBytes,
    productionGlbBytes,
  });
  const report = {
    status: evaluation.hardFailures.length ? "failed" : "passed",
    measured: {
      initialJsGzip,
      cssGzip,
      precacheBytes,
      productionGlbBytes,
    },
    budgets: {
      initialJsGzip: 350 * KiB,
      cssGzip: 80 * KiB,
      precacheBytes: 1.2 * MiB,
      productionGlbBytes: 2 * MiB,
    },
    advisoryRuntimeBudgets: {
      startupMs: 1000,
      localDatasetMs: 300,
      storyOpenMs: 800,
      yearChangeMs: 250,
      svgFallbackMs: 1000,
      routeGuardFps: 20,
    },
    ...evaluation,
    headlessFpsBlocksBuild: false,
  };
  await writeFile(
    path.join(repoRoot, "public", "exhibition-performance-budget.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
  return report;
};

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  checkDemoPerformanceBudget()
    .then((report) => {
      console.log(
        `Demo performance budget: ${report.status}; ${report.warnings.length} advisory warnings`
      );
      report.hardFailures.forEach((item) => console.error(`ERROR ${item}`));
      report.warnings.forEach((item) => console.warn(`WARNING ${item}`));
      if (report.hardFailures.length) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(`Demo budget failed: ${error.message}`);
      process.exitCode = 1;
    });
}

