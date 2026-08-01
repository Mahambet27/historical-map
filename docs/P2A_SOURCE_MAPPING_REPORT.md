# P2A source mapping report

Dataset version: `p2a-2026-08`  
Generated seed records: 226  
Seed validation: 0 errors, 81 warnings  
Geometry validation: 55 records, 0 errors, 81 warnings

`verified` учитывается отдельно в
`supabase/seed/p2a_seed_report.json`; таблица ниже сохраняет запрошенные
колонки. Для tables без собственного source column связь может находиться в
`metadata.sourceIds`. Story-level sources представлены на steps/questions.

| Dataset | Records | With sources | Without sources | Reviewed | Needs review | Demo only | Imported | Skipped | Reason |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| archive_maps | 2 | 2 | 0 | 1 | 1 | 0 | 2 | 0 | — |
| educational_questions | 13 | 13 | 0 | 8 | 5 | 0 | 13 | 0 | — |
| educational_stories | 3 | 0 | 3 | 2 | 1 | 0 | 3 | 0 | Sources are step/question scoped |
| educational_story_steps | 27 | 27 | 0 | 0 | 0 | 0 | 27 | 0 | Status inherited from story |
| environment_snapshots | 3 | 3 | 0 | 0 | 2 | 1 | 3 | 0 | Broad contextual source only |
| historical_entities | 21 | 5 | 16 | 5 | 16 | 0 | 21 | 0 | Source IDs retained in metadata |
| historical_events | 6 | 6 | 0 | 0 | 6 | 0 | 6 | 0 | Missing status mapped conservatively |
| historical_geometries | 27 | 7 | 20 | 6 | 20 | 0 | 27 | 0 | One additional record is verified |
| historical_names | 63 | 15 | 48 | 15 | 48 | 0 | 63 | 0 | Generated deterministically from entity names |
| historical_people | 4 | 4 | 0 | 0 | 4 | 0 | 4 | 0 | Missing status mapped conservatively |
| historical_places | 16 | 8 | 8 | 0 | 16 | 0 | 16 | 0 | Approximate/local points are not upgraded |
| historical_routes | 2 | 1 | 1 | 0 | 2 | 0 | 2 | 0 | — |
| historical_sources | 9 | 0 | 9 | 7 | 0 | 0 | 9 | 0 | Source rows are provenance records themselves; 2 verified |
| hydrology_snapshots | 5 | 0 | 5 | 0 | 4 | 1 | 5 | 0 | — |
| route_segments | 4 | 4 | 0 | 0 | 4 | 0 | 4 | 0 | — |
| source_claim_sources | 12 | 12 | 0 | 0 | 0 | 0 | 12 | 0 | Normalized claim/source joins |
| source_claims | 8 | 8 | 0 | 2 | 5 | 0 | 8 | 0 | One additional claim is verified |

## Explicitly skipped datasets

| Dataset | Records | Reason |
| --- | ---: | --- |
| entityLabels | 24 | Derived presentation labels; normalized names are generated from entities |
| timeline | 6 | Client navigation snapshots; snapshot RPC reads normalized records |
| eras | 5 | Client navigation configuration remains local in P2A |
| historicalChanges | 3 | P1A interpretation model awaits a reviewed normalized change schema |
| sourceDisputes | 1 | Demo-only structure is not imported as a real scholarly dispute |
| lessons | 1 | Legacy lesson stays local; newer stories/questions are imported |
| threeDModels | 1 | Binary/media delivery is outside P2A historical data foundation |

Skipped records remain available through local/offline datasets and are never
silently presented as server-verified content.
