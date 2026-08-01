import { spawn } from "node:child_process";

import {
  assertLocalDatabase,
  getNpxInvocation,
  getLocalSupabaseStatus,
  projectRoot,
  safeErrorMessage,
} from "./local-database-utils.mjs";
import { updateVerificationReport } from "./verification-report.mjs";

try {
  const status = await getLocalSupabaseStatus();
  process.env.P2A_LOCAL_SUPABASE_URL = status.apiUrl;
  await assertLocalDatabase({ requireApiUrl: true });
  if (!status.anonKey) {
    throw new Error("Local anonymous key is unavailable from Supabase status.");
  }
  const invocation = getNpxInvocation([
    "playwright",
    "test",
    "e2e/p2a-local-supabase.spec.js",
    "--project=chromium",
  ]);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      invocation.command,
      invocation.args,
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          P2A_LOCAL_SUPABASE_TESTS: "true",
          P2A_LOCAL_SUPABASE_URL: status.apiUrl,
          P2A_LOCAL_SUPABASE_ANON_KEY: status.anonKey,
        },
        shell: false,
        windowsHide: true,
        stdio: "inherit",
      }
    );
    child.on("error", reject);
    child.on("close", resolve);
  });
  const result = { passed: exitCode === 0, exitCode };
  await updateVerificationReport("localDatabaseE2E", result);
  if (exitCode !== 0) process.exitCode = exitCode || 1;
} catch (error) {
  console.error(`Local database E2E failed: ${safeErrorMessage(error)}`);
  await updateVerificationReport("localDatabaseE2E", {
    passed: false,
    error: safeErrorMessage(error),
  });
  process.exitCode = 1;
}
