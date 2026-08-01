# P2A.5 Query Plan Report

Date: 2026-08-01T06:08:54.383Z

Overall status: **failed**

| Function/query | Parameters | Planning ms | Execution ms | Rows | Index usage | Sequential scans |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Not executed | — | 0 | 0 | 0 | — | — |

The seed dataset is intentionally small. A sequential scan can be the correct
planner choice at this size and is not by itself classified as an index defect.
The direct spatial probe records whether the GiST path becomes attractive for a
bounded envelope; production-scale recommendations should be based on staging
cardinality and representative statistics.

Error: `Local database is not reachable on the configured loopback endpoint.`
