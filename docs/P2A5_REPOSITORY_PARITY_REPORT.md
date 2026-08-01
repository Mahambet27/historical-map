# P2A.5 Repository Parity Report

Date: 2026-08-01T06:08:47.225Z

Overall status: **failed**

Compared years: 1465, 1511, 1991

Compared domain fields:

- stable IDs for entities, geometries, places, routes, segments, environment and hydrology;
- verification status, confidence and source relations;
- geometry types and place coordinates;
- claim/source relationships;
- story, step and question IDs.

Documented adapter difference: local `entityLabels` remains a local-only
presentation dataset. The database snapshot derives language names from
`historical_names`, so label object shape and ordering are intentionally not
compared.

| Scope | Local | Database |
| --- | --- | --- |
| All compared scopes | match | match |

Error: `Local Supabase status is unavailable.`
