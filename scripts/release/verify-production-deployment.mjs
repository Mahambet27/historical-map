import { getUrlArgument, verifyDeployment } from "./verify-preview-deployment.mjs";

const baseUrl = getUrlArgument();
const report = await verifyDeployment({ baseUrl, mode: "production" });
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
