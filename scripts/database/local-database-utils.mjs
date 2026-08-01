import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(scriptDirectory, "../..");

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const SERVICE_ROLE_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "P2A_SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE_KEY",
];
const DATABASE_URL_NAMES = [
  "P2A_LOCAL_DATABASE_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
  "SUPABASE_DB_URL",
];
const API_URL_NAMES = [
  "P2A_LOCAL_SUPABASE_URL",
  "SUPABASE_URL",
  "VITE_SUPABASE_URL",
];

const pathExists = async (targetPath) => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const parseEnvText = (text) => {
  const result = {};
  for (const line of text.split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/u);
    if (!match) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/u, "$2");
    result[match[1]] = value;
  }
  return result;
};

const readOptionalEnvFile = async (fileName) => {
  const filePath = path.join(projectRoot, fileName);
  if (!(await pathExists(filePath))) return {};
  return parseEnvText(await readFile(filePath, "utf8"));
};

const classifyUrl = (value) => {
  if (!value) return { configured: false, local: false, host: null };
  try {
    const parsed = new URL(value);
    return {
      configured: true,
      local: LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase()),
      host: parsed.hostname.toLowerCase(),
    };
  } catch {
    return { configured: true, local: false, host: "invalid" };
  }
};

const firstConfigured = (source, names) => {
  for (const name of names) {
    if (source[name]) return { name, value: source[name] };
  }
  return null;
};

export class LocalDatabaseSafetyError extends Error {
  constructor(reasons) {
    super("Local database safety assertion failed.");
    this.name = "LocalDatabaseSafetyError";
    this.reasons = reasons;
  }
}

export const assertLocalDatabase = async ({
  requireDatabaseUrl = false,
  requireApiUrl = false,
} = {}) => {
  const reasons = [];
  const projectRefPath = path.join(projectRoot, "supabase", ".temp", "project-ref");
  if (await pathExists(projectRefPath)) {
    reasons.push("A Supabase project ref is present; linked projects are forbidden.");
  }

  const localEnv = await readOptionalEnvFile(".env.local");
  const developmentLocalEnv = await readOptionalEnvFile(".env.development.local");
  const checkedSources = [
    ["active shell", process.env],
    [".env.local", localEnv],
    [".env.development.local", developmentLocalEnv],
  ];

  for (const [label, source] of checkedSources) {
    for (const variableName of SERVICE_ROLE_NAMES) {
      if (source[variableName]) {
        reasons.push(`${label} contains a forbidden service-role variable.`);
      }
    }

    for (const variableName of [...DATABASE_URL_NAMES, ...API_URL_NAMES]) {
      const classified = classifyUrl(source[variableName]);
      if (classified.configured && !classified.local) {
        reasons.push(`${label} contains a non-loopback ${variableName}.`);
      }
    }
  }

  const productionFlags = [
    ["NODE_ENV", process.env.NODE_ENV === "production"],
    ["VERCEL_ENV", process.env.VERCEL_ENV === "production"],
    ["P2A_PRODUCTION", /^(1|true|yes)$/iu.test(process.env.P2A_PRODUCTION || "")],
    [
      "SUPABASE_ENV",
      /^(production|prod)$/iu.test(process.env.SUPABASE_ENV || ""),
    ],
  ];
  for (const [name, enabled] of productionFlags) {
    if (enabled) reasons.push(`${name} indicates a production environment.`);
  }

  const databaseTarget = firstConfigured(process.env, DATABASE_URL_NAMES);
  const apiTarget = firstConfigured(process.env, API_URL_NAMES);
  if (requireDatabaseUrl && !databaseTarget) {
    reasons.push("No explicit local database URL is configured.");
  }
  if (requireApiUrl && !apiTarget) {
    reasons.push("No explicit local Supabase API URL is configured.");
  }

  if (reasons.length > 0) throw new LocalDatabaseSafetyError(reasons);

  return {
    safe: true,
    projectLinked: false,
    databaseConfigured: Boolean(databaseTarget),
    apiConfigured: Boolean(apiTarget),
    databaseTarget: databaseTarget?.value || null,
    apiTarget: apiTarget?.value || null,
  };
};

export const defaultLocalDatabaseUrl =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
export const defaultLocalApiUrl = "http://127.0.0.1:54321";

export const getLocalDatabaseUrl = () =>
  process.env.P2A_LOCAL_DATABASE_URL || defaultLocalDatabaseUrl;

export const getLocalApiUrl = () =>
  process.env.P2A_LOCAL_SUPABASE_URL || defaultLocalApiUrl;

export const getNpxInvocation = (args) => {
  if (process.platform !== "win32") {
    return { command: "npx", args };
  }
  return {
    command: process.execPath,
    args: [
      path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js"),
      ...args,
    ],
  };
};

export const runProcess = (
  command,
  args,
  { cwd = projectRoot, env = process.env, timeoutMs = 120_000 } = {}
) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Local command timed out after ${timeoutMs} ms.`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });

export const getLocalSupabaseStatus = async () => {
  await assertLocalDatabase();
  const invocation = getNpxInvocation([
    "--yes",
    "supabase",
    "status",
    "-o",
    "env",
  ]);
  const result = await runProcess(invocation.command, invocation.args);
  if (result.code !== 0) {
    throw new Error("Local Supabase status is unavailable.");
  }
  const values = parseEnvText(result.stdout);
  const apiUrl = values.API_URL || getLocalApiUrl();
  const databaseUrl = values.DB_URL || getLocalDatabaseUrl();
  if (!classifyUrl(apiUrl).local || !classifyUrl(databaseUrl).local) {
    throw new LocalDatabaseSafetyError([
      "Supabase status returned a non-loopback endpoint.",
    ]);
  }
  return {
    apiUrl,
    databaseUrl,
    anonKey: values.ANON_KEY || values.PUBLISHABLE_KEY || null,
    keyConfigured: Boolean(values.ANON_KEY || values.PUBLISHABLE_KEY),
  };
};

export const createPgClient = async () => {
  const databaseUrl = getLocalDatabaseUrl();
  process.env.P2A_LOCAL_DATABASE_URL = databaseUrl;
  await assertLocalDatabase({ requireDatabaseUrl: true });
  const { Client } = await import("pg");
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 30_000,
    application_name: "qhm-p2a5-local-verification",
  });
  await client.connect();
  return client;
};

export const withPgClient = async (callback) => {
  const client = await createPgClient();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
};

export const safeErrorMessage = (error) => {
  if (error instanceof LocalDatabaseSafetyError) {
    return error.reasons.join(" ");
  }
  if (error?.code === "ECONNREFUSED") {
    return "Local database is not reachable on the configured loopback endpoint.";
  }
  return error?.message || "Local database verification failed.";
};
