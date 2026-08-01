# P2A.5 RLS Security Report

Date: 2026-08-01T06:08:19.199Z

Overall status: **failed**

The checks execute inside a transaction against the local database, switch to
the real `anon` role, and always roll back their fixtures.

| # | Assertion | Result |
| ---: | --- | --- |
| 1 | SQL security checks | not executed |

Additional anonymous REST write-denial checks for entities, geometries,
sources, claims and archive maps are performed by `npm run db:rpc:test`.

Error: `Local database is not reachable on the configured loopback endpoint.`
