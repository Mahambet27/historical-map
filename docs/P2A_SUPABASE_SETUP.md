# P2A Supabase setup

P2A migrations and seed are prepared for local verification. The latest
execution status is recorded in the P2A.5 reports; this document never
authorizes a remote application.

## Requirements

- PostgreSQL supported by the target Supabase project;
- PostGIS extension in the `extensions` schema;
- public anonymous role managed by Supabase;
- staging project and database backup before first application.

Do not expose a service-role key to Vite or the browser.

## Migration order

Apply in filename order:

1. `20260801090000_p2a_core_schema.sql`;
2. `20260801090100_p2a_rls.sql`;
3. `20260801090200_p2a_read_functions.sql`;
4. `20260801090300_p2a_indexes.sql`.
5. `20260801100000_p2a5_database_fixes.sql`.

The P2A.5 corrective migration fixes safe archive-view execution without
granting anonymous access to the base archive table and adds a bounded public
dataset-status RPC.

The legacy `docs/database/historical_platform_schema.sql` is reference only.
If its UUID tables already exist in the target database, stop and resolve the
schema conflict in staging; do not drop or coerce them automatically.

## Seed workflow

```text
npm run db:seed:build
npm run db:seed:validate
npm run db:geometry:validate
npm run db:seed:generate
npm run db:seed:compare
```

Review `supabase/seed/p2a_seed_report.json`, then apply
`supabase/seed/p2a_seed.sql` manually to staging. The seed is transactional and
uses stable-ID upserts. Re-running generation without local data changes must
leave generated files unchanged.

## Browser environment

```text
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=PUBLIC_ANON_OR_PUBLISHABLE_KEY
VITE_HISTORICAL_DATA_SOURCE=auto
```

Modes:

- `local`: never constructs the Supabase client;
- `auto`: health-checks once, then server or visible local fallback;
- `supabase`: requires server data and does not silently fallback.

No private variable, SQL credential or service role may use a `VITE_` prefix.

## Local Supabase verification

Prerequisites: Docker-compatible container runtime, Node.js and npm. Supabase
CLI is invoked through `npx`; do not run `supabase login` or `supabase link`.

The project `.env` may contain a remote browser URL. Local verification scripts
do not load it. They obtain local endpoints from `supabase status` and reject
non-loopback database/API URLs.

Start and inspect the local stack:

```text
npm run db:assert-local
npm run db:local:start
npm run db:local:status
```

Regenerate the seed and rebuild the local database from migrations:

```text
npm run db:assert-local
npm run db:seed:build
npm run db:seed:validate
npm run db:seed:generate
npm run db:seed:compare
npm run db:migrations:verify
npm run db:local:reset
```

Run database verification:

```text
npm run db:schema:verify
npm run db:seed:verify
npm run db:seed:idempotency
npm run db:postgis:verify
npm run db:security:test
npm run db:rpc:test
npm run db:compare:local
npm run db:query-plan:test
npm run db:smoke
npm run test:e2e:local-db
```

Stop while retaining a local backup:

```text
npm run db:assert-local
npm run db:local:stop
```

Remove only this project's local containers and volumes:

```text
npm run db:assert-local
npm run db:local:cleanup
```

**Never use a production project ref during local verification.** The guard
must report `project linked: no`. Do not substitute a remote URL into any
`P2A_LOCAL_*` variable.

## RLS and function verification

Run `npm run db:security:test` only against disposable/local Supabase after
migrations. It executes `supabase/tests/p2a_security_checks.sql`, which is
transaction-wrapped and checks public reads,
private metadata, denied writes, archive URL masking, bbox/limit guards,
function `search_path` and absence of dynamic SQL.

Also verify through an anonymous client:

- `p2a_dataset_metadata` returns one version;
- snapshot RPC rejects a world-sized bbox;
- evidence RPC exposes claims/source metadata but no reviewer identity;
- direct `archive_maps` read is denied;
- `p2a_public_archive_maps` masks restricted/unknown full URLs.

## Application checks

1. Start with `local` and verify Exhibition, SVG, stories, routes, evidence,
   HistoricalAgent and offline.
2. Switch staging to `auto`; verify server status and version match.
3. Simulate timeout/invalid response and verify the visible local fallback.
4. Switch to explicit `supabase`; verify failure is shown without fallback.
5. Open `/map` and verify no P2A request or repository chunk.

## Rollback

Application rollback is `VITE_HISTORICAL_DATA_SOURCE=local` followed by a new
build/deploy. Database rollback is a reviewed manual operation described in
`P2A_ROLLBACK.md`; no production tables are dropped automatically.
