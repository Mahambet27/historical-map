# P2A security model

## Trust boundary

The browser is untrusted. It receives only a public anon/publishable key and
calls bounded read functions. Service-role credentials, SQL credentials,
private access tokens and reviewer identity never enter Vite variables,
telemetry, diagnostics, cache or seed.

## Anonymous access

- RLS is enabled on every P2A table.
- Public records must have verification status
  `verified/reviewed/needs_review/demo_only`.
- `metadata.public=false` is excluded.
- Anonymous INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER grants are
  revoked; no mutation policies exist.
- Review Queue remains localStorage-only and is not synchronized.

`verified` is retained because it already exists in P1C and is stronger than
`reviewed`; it is never produced by the importer.

## Archive rights

RLS cannot mask individual columns, so `anon` has no direct SELECT grant on
`archive_maps`. `p2a_public_archive_maps` and evidence RPC return a full image
URL/georeference only for public-domain, open, permission-granted or explicitly
educational-use material. Restricted/unknown rows expose safe metadata and
thumbnail only.

## RPC safety

- fixed `search_path`;
- no dynamic SQL;
- no table name or SQL fragment parameters;
- bbox validation and maximum area;
- bounded record counts;
- a story is fetched by ID, not as an unbounded collection;
- source body and private archive fields are not returned;
- PostGIS filters use `ST_Intersects` and `ST_MakeEnvelope`.

## Client safety

- Supabase SDK is a dynamic import;
- local mode does not instantiate the client;
- auto mode uses AbortController and a 3–5 second timeout;
- explicit supabase errors do not trigger a silent source change;
- cached values are cloned and remove review notes, token-like fields and
  restricted URLs;
- telemetry stores only safe codes, counts, durations and approximate bbox
  area buckets;
- diagnostics never includes full Supabase URL or keys.

## Prepared security tests

`supabase/tests/p2a_security_checks.sql` contains twelve transaction-wrapped
checks. They were not executed because no local Supabase/Postgres environment
was connected during P2A implementation.

## Residual risks

- policies and functions need execution against the exact target Postgres and
  Supabase versions;
- broad sources and missing territorial claims remain scientific-quality
  warnings;
- archive permissions require institution-specific legal review;
- future authenticated editorial work needs a separate P2B threat model and
  must not weaken P2A anonymous policies.
