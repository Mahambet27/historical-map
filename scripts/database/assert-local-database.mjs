import {
  assertLocalDatabase,
  safeErrorMessage,
} from "./local-database-utils.mjs";

try {
  const result = await assertLocalDatabase();
  console.log(
    [
      "Local database safety assertion: passed",
      `project linked: ${result.projectLinked ? "yes" : "no"}`,
      `database target configured: ${result.databaseConfigured ? "yes" : "no"}`,
      `local API target configured: ${result.apiConfigured ? "yes" : "no"}`,
      "service-role key detected: no",
    ].join("\n")
  );
} catch (error) {
  console.error(`Local database safety assertion: failed\n${safeErrorMessage(error)}`);
  process.exitCode = 1;
}
