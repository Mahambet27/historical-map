# P2A.5 Migration Execution Report

Date: 2026-08-01T06:07:50.857Z

Target: disposable local-only PostgreSQL database `p2a5_migration_verify`.
No linked or remote project is used.

## Result

Overall status: **failed**

| Migration | Status | Duration | Warning or correction |
| --- | --- | ---: | --- |
| Not executed | blocked | 0 ms | No migration result |

## Created objects

- 18 P2A tables;
- PostGIS extension in the `extensions` schema;
- one safe archive view;
- nine P2A helper/read functions;
- 18 anonymous SELECT policies;
- five GiST and fifteen selective B-tree indexes.

## SQL error

`Local database is not reachable on the configured loopback endpoint.`

The disposable verification database is removed after the run. The main local
Supabase database is reset separately so PostgREST and anonymous-role behavior
can be tested against the same migration chain.
