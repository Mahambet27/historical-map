# P2A.5 Local Database Verification Plan

Date: 2026-08-01

## Scope

P2A.5 verifies the existing P2A schema, seed, RLS, RPC and repository against a
local-only Supabase/PostgreSQL/PostGIS stack. It does not authorize a Supabase
login, project link, remote migration, remote seed, staging creation or
production deployment.

## Environment audit

| Tool or prerequisite | Result | Version or detail |
| --- | --- | --- |
| Node.js | Available | 24.12.0 |
| npm / npx | Available | 11.6.2 |
| Supabase CLI | Available through `npx` | 2.111.0 |
| Docker CLI | Not found | No executable in `PATH` or the standard Docker Desktop path |
| Docker Compose | Not available | Docker is not installed |
| Docker Desktop | Not found | Standard installation path is absent |
| PostgreSQL client (`psql`) | Not found | Supabase containers can provide the client after startup |
| Podman / nerdctl | Not found | No alternative container runtime |
| WSL distribution | Not installed | `wsl.exe` exists, but no distribution is installed |
| Supabase ports | Available | 54321 through 54327 had no listeners during the audit |
| Supabase project link | Absent | `supabase/.temp/project-ref` does not exist |
| Active database URL variables | Absent | No `DATABASE_URL`, `POSTGRES_URL` or `SUPABASE_DB_URL` in the shell |
| Service-role variables | Absent | No service-role variable in the shell or project `.env` |

The project `.env` contains a remote-looking public Supabase URL and a
publishable browser key. P2A.5 commands must not load this file. Local database
commands use explicit localhost values obtained from `supabase status`.
Credentials are never printed by the verification scripts or copied into
reports.

## Selected launch method

The intended method is Supabase CLI 2.111.0 through `npx`:

```text
npm run db:assert-local
npx --yes supabase start
```

Supabase CLI requires a Docker-compatible container runtime. The current
machine cannot start the stack until such a runtime is made available. Installing
Docker Desktop or changing WSL/system settings requires separate user approval;
P2A.5 will not silently install either.

## Planned verification sequence

Every command that connects to PostgreSQL or the local API first invokes
`npm run db:assert-local`, either directly or inside its Node entry point.

1. Initialize local Supabase configuration without login or link.
2. Run the local safety assertion.
3. Start the local stack and record non-secret versions and ports.
4. Reset the local database from a clean volume and time each migration.
5. Verify schema objects, column types, constraints, RLS, policies and grants.
6. Regenerate and validate the deterministic seed.
7. Apply the seed twice and verify counts, IDs, relations and idempotency.
8. Run PostGIS validity and extent checks without modifying geometry.
9. Run each SQL security assertion under the intended anonymous role.
10. Exercise every read RPC with valid, empty and invalid inputs.
11. Compare local JS repository output with the database repository output.
12. Run bounded query-plan and smoke-latency checks.
13. Run opt-in Playwright tests against the local stack.
14. Stop the stack and confirm local/offline fallback still works.

## Commands that are prohibited

The verification procedure never runs:

- `supabase login`;
- `supabase link`;
- a linked `supabase db push`;
- a linked `supabase migration up`;
- SQL against a non-loopback hostname;
- seed or destructive reset against a remote project.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| The project `.env` points at a remote-looking API | Database scripts ignore it and require explicit loopback configuration |
| Accidental linked-project operation | Guard rejects `supabase/.temp/project-ref` |
| Service-role key exposure | Guard rejects service-role variables; reports include no key values |
| Destructive reset against the wrong database | Guard validates hostname, port context and production flags before reset |
| Docker port collision | Ports 54321–54327 are checked before startup |
| Seed changes scientific meaning | Verification may fix SQL/serialization only; statuses, dates, claims, geometry and licenses are not rewritten |
| Test records survive a security check | Write checks use transactions or explicit cleanup |
| Reports leak credentials | Only availability, localhost ports and version information are recorded |

## Stop and cleanup

Safe local stop:

```text
npm run db:assert-local
npx --yes supabase stop
```

Remove only this project's local Supabase containers and volumes:

```text
npm run db:assert-local
npx --yes supabase stop --no-backup
```

Before cleanup, the resolved project directory and absence of a project link
must be rechecked. Project migrations, seed files and reports remain in the
working tree; only local container state is removed.

## Current execution status

Audit, CLI discovery and local safety automation are complete. The safety
assertion passes with no project link, database target or service-role key.
`npx supabase start` was attempted after that assertion and returned:

```text
LegacyDockerLifecycleInspectError: docker: command not found
(podman also not found)
```

Real migration, seed, PostGIS, RLS, RPC, parity, query-plan, smoke and local-DB
E2E verification are therefore recorded as failed/blocked, never as passed.
Their exact status is present in the other P2A.5 reports and the
development-only diagnostics endpoint.

The deterministic local seed checks, evidence validation, 135 unit tests, 43
standard E2E tests, lint, production build and `git diff --check` pass
independently of Docker. Six real local-database E2E tests remain opt-in and
were skipped by the standard suite.

One corrective migration was prepared after static security review:
`20260801100000_p2a5_database_fixes.sql`. It resolves the anonymous safe-view
privilege incompatibility without exposing the archive base table and adds a
safe dataset-status RPC. It has not yet been executed on PostgreSQL.

No production connection, login, link, migration or seed has been attempted.
