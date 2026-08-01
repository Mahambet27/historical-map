import {
  assertLocalDatabase,
  getNpxInvocation,
  getLocalDatabaseUrl,
  getLocalSupabaseStatus,
  runProcess,
  safeErrorMessage,
  withPgClient,
} from "./local-database-utils.mjs";

const action = process.argv[2] || "status";

const sanitizeCliFailure = (text) =>
  String(text || "")
    .replace(/(?:eyJ|sb_(?:secret|publishable)_)[A-Za-z0-9._-]+/gu, "[redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/giu, "[redacted-local-database-url]")
    .replace(/https?:\/\/\S+/giu, "[redacted-url]")
    .split(/\r?\n/u)
    .filter(Boolean)
    .slice(-8)
    .join("\n");

const runSupabase = async (args, timeoutMs = 900_000) => {
  await assertLocalDatabase();
  const invocation = getNpxInvocation(["--yes", "supabase", ...args]);
  const result = await runProcess(
    invocation.command,
    invocation.args,
    { timeoutMs }
  );
  if (result.code !== 0) {
    const error = new Error(
      sanitizeCliFailure(result.stderr || result.stdout) ||
        "Local Supabase CLI command failed."
    );
    throw error;
  }
  return result;
};

try {
  if (action === "start") {
    await runSupabase(["start"]);
    const status = await getLocalSupabaseStatus();
    console.log("Local Supabase start: passed");
    console.log("API endpoint: loopback configured");
    console.log("Database port: 54322");
    console.log("Studio port: 54323");
    console.log(`Local anon key configured: ${status.keyConfigured ? "yes" : "no"}`);
  } else if (action === "stop") {
    await runSupabase(["stop"]);
    console.log("Local Supabase stop: passed");
  } else if (action === "cleanup") {
    await runSupabase(["stop", "--no-backup"]);
    console.log("Local Supabase cleanup: passed");
  } else if (action === "reset") {
    process.env.P2A_LOCAL_DATABASE_URL = getLocalDatabaseUrl();
    await assertLocalDatabase({ requireDatabaseUrl: true });
    await runSupabase(["db", "reset", "--local"]);
    console.log("Local database reset: passed");
  } else if (action === "status") {
    const status = await getLocalSupabaseStatus();
    process.env.P2A_LOCAL_DATABASE_URL = status.databaseUrl;
    const versions = await withPgClient(async (client) => {
      const result = await client.query(`
        select
          current_setting('server_version') as postgres_version,
          extensions.postgis_lib_version() as postgis_version,
          coalesce((
            select max(version)
            from supabase_migrations.schema_migrations
          ), 'none') as migration_version
      `);
      return result.rows[0];
    });
    console.log("Local Supabase status: running");
    console.log("API endpoint: loopback configured");
    console.log("Database port: 54322");
    console.log("Studio port: 54323");
    console.log(`PostgreSQL version: ${versions.postgres_version}`);
    console.log(`PostGIS version: ${versions.postgis_version}`);
    console.log(`Migration version: ${versions.migration_version}`);
    console.log(`Local anon key configured: ${status.keyConfigured ? "yes" : "no"}`);
  } else {
    throw new Error(`Unsupported local Supabase action: ${action}`);
  }
} catch (error) {
  console.error(
    `Local Supabase ${action} failed: ${safeErrorMessage(error)}`
  );
  process.exitCode = 1;
}
