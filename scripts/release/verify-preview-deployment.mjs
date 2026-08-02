import { fileURLToPath } from "node:url";
import path from "node:path";
import { EXHIBITION_RELEASE } from "../../src/config/exhibitionRelease.js";
import { primaryExhibitionModel } from "../../src/data/exhibition/threeDModels.js";

export const validateDeploymentUrl = (input) => {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error("A valid deployment URL is required.");
  }
  if (url.protocol !== "https:") throw new Error("Deployment URL must use HTTPS.");
  if (url.username || url.password)
    throw new Error("Deployment URL must not contain credentials.");
  if (url.search || url.hash)
    throw new Error("Pass the deployment origin only, without query or hash.");
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url;
};

export const getUrlArgument = (argv = process.argv.slice(2)) => {
  const inline = argv.find((value) => value.startsWith("--url="));
  const index = argv.indexOf("--url");
  const value = inline?.slice(6) || (index >= 0 ? argv[index + 1] : "");
  return validateDeploymentUrl(value);
};

const checkResponse = async (base, target, fetchImpl, results) => {
  const started = performance.now();
  try {
    const response = await fetchImpl(new URL(target, base), {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    const elapsedMs = Math.round(performance.now() - started);
    const redirectLoop = response.redirected && response.url === new URL(target, base).href;
    results.push({
      target,
      status: response.status,
      elapsedMs,
      passed: response.ok && !redirectLoop,
      finalUrl: response.url,
    });
    return response;
  } catch (error) {
    results.push({ target, status: 0, elapsedMs: 0, passed: false, error: error.message });
    return null;
  }
};

export const verifyDeployment = async ({
  baseUrl,
  mode = "preview",
  fetchImpl = fetch,
} = {}) => {
  const base = validateDeploymentUrl(baseUrl);
  const targets = [
    "/demo",
    "/demo?lang=kk",
    "/demo?quality=light",
    "/exhibition",
    "/map",
    "/exhibition-release.json",
    "/sw.js",
    "/offline.html",
    primaryExhibitionModel.poster,
    primaryExhibitionModel.src,
  ];
  const results = [];
  let manifest = null;
  for (const target of targets) {
    const response = await checkResponse(base, target, fetchImpl, results);
    if (target === "/exhibition-release.json" && response?.ok) {
      manifest = await response.json().catch(() => null);
    }
  }
  const errors = results
    .filter((result) => !result.passed)
    .map((result) => `${result.target}: HTTP ${result.status || "error"}`);
  if (!manifest) errors.push("release manifest is unavailable or invalid");
  if (manifest?.releaseVersion !== EXHIBITION_RELEASE.version)
    errors.push(`release version must be ${EXHIBITION_RELEASE.version}`);
  if (!manifest?.gitCommit || manifest.gitCommit === "UNCOMMITTED")
    errors.push("release manifest git commit is missing");
  if (mode === "production" && manifest?.releaseChannel !== "exhibition-stable")
    errors.push("production release channel is not exhibition-stable");
  if (mode === "production" && manifest?.integrityStatus !== "READY")
    errors.push("production integrity status is not READY");
  return {
    mode,
    baseUrl: base.origin + base.pathname,
    releaseVersion: manifest?.releaseVersion || null,
    gitCommit: manifest?.gitCommit || null,
    supportedLanguages: manifest?.supportedLanguages || [],
    cacheVersion: primaryExhibitionModel.cacheVersion,
    officialModeRequired: true,
    debugUiRequiredHidden: true,
    modernMapboxLabelsAllowed: false,
    readOnly: true,
    results,
    errors,
    passed: errors.length === 0,
  };
};

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const baseUrl = getUrlArgument();
  const report = await verifyDeployment({ baseUrl, mode: "preview" });
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}
