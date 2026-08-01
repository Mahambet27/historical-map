# P2A rollback

## Immediate application rollback

Set:

```text
VITE_HISTORICAL_DATA_SOURCE=local
```

Rebuild and deploy. In this mode:

- Supabase repository and SDK are not instantiated;
- local P0–P1C datasets remain authoritative;
- Exhibition, routes, stories, evidence, archive educational overlay,
  HistoricalAgent, SVG fallback, Review Queue and PWA continue to work;
- `/map` remains independent of P2A.

No page reload is required for the in-session Retry action, but changing an
environment variable requires a normal application rebuild.

## Auto-mode operational rollback

If server health, response validation or dataset version fails in `auto`, the
application activates the visible local fallback. Operators should inspect
safe diagnostics, fix staging/server data and use Retry. Do not suppress the
fallback reason or change server statuses to make the check pass.

## Database rollback

Generated seed is enclosed in a transaction and can roll back before commit on
error. After a committed staging/production migration:

1. stop server traffic by deploying application `local` mode;
2. take a database backup and record applied migration versions;
3. revoke execute/select grants if an immediate containment step is required;
4. prepare and peer-review a dedicated down migration for the exact target;
5. preserve exported data and audit logs;
6. remove P2A objects only after dependency inspection.

P2A intentionally provides no automatic `DROP TABLE ... CASCADE` script.
Never run destructive rollback against production by copying commands from
documentation without a reviewed recovery plan.

## Local P2A.5 stop and cleanup

Stop the local stack without deleting project files:

```text
npm run db:assert-local
npm run db:local:stop
```

Remove only the `historical-map` local Supabase containers and local database
volume:

```text
npm run db:assert-local
npm run db:local:cleanup
```

Before either command, the guard confirms:

- no `supabase/.temp/project-ref`;
- no service-role variable;
- no non-loopback database/API target;
- no production environment flag.

Local cleanup is not a SQL rollback and does not delete migrations, seed files,
reports or local JS datasets. Never use a production project ref during local
verification.
