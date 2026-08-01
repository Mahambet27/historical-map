# P2A — PostGIS Data Foundation and Read-Only Migration

Дата аудита: 1 августа 2026  
Область: read-only PostGIS foundation, repository abstraction и безопасный
fallback. P0–P1C, локальные datasets, offline, Review Queue и внешний UX
остаются совместимым baseline. Удалённые миграции и seed не выполняются.

## 1. Локальные datasets

| Dataset | Записей | Стабильный ID / основные связи | Источники и статусы |
| --- | ---: | --- | --- |
| `entities.js` | 21 | `id`; `eventIds`, `people`, `capitals`, relations | 5 reviewed с sources; 16 needs_review без sources |
| `entityGeometries.js` | 27 | `id`, `entityId`; временной диапазон | 7 с sources; 20 без; 6 reviewed, 1 verified, 20 needs_review |
| `entityLabels.js` | 24 | `id`, `entityId`; временной диапазон | производные UI-labels, собственного статуса нет |
| `events.js` | 6 | `id`; `entityIds`, `personIds`, `placeIds` | 6/6 с sources; собственного verification status нет |
| `people.js` | 4 | `id`; `entityRoles`, `eventIds`, `placeIds` | 4/4 с sources; собственного verification status нет |
| `places.js` | 11 | `id`, coordinates | лёгкие Exhibition points; source/status отсутствуют |
| `historicalSettlements.js` | 8 | `id`; entities/events/people/routes | 8/8 с sources; все needs_review и approximate |
| `historicalRoutes.js` | 2 | `id`; segment/place/entity/event IDs | 1 с sources, 1 без; обе needs_review |
| `routeSegments.js` | 4 | `id`, `routeId`, from/to place | 4/4 с sources; все needs_review |
| `environmentSnapshots.js` | 3 | `id`; временная geometry | 3/3 с broad source; 2 needs_review, 1 demo_only |
| `hydrologySnapshots.js` | 5 | `id`, `featureId`; временная geometry | без sources; 4 needs_review, 1 demo_only |
| `sources.js` | 9 | `id` | 2 verified, 7 reviewed |
| `sourceClaims.js` | 8 | `id`, subject type/id, `sourceIds` | 1 verified, 2 reviewed, 5 needs_review |
| `sourceDisputes.js` | 1 | `id`, subject type/id | demo_only structural example |
| `archiveMaps.js` | 2 | `id`, `sourceId/sourceIds` | 1 reviewed project-owned; 1 needs_review/unknown licence |
| `historicalChanges.js` | 3 | `id`; entities/events/people/places | 1 verified, 1 reviewed, 1 needs_review |
| `timeline.js` | 6 | `id`; entities/events/people/places | 6/6 с sources; status не выделен |
| `eras.js` | 5 | `id`; временной диапазон | навигационная модель, status/sources отсутствуют |
| `stories.js` | 3 | `id`; steps, `questionIds` | 2 reviewed, 1 needs_review |
| `storyQuestions` | 13 | `id`; source IDs | 13/13 с sources; 8 reviewed, 1 needs_review, 4 legacy без status |
| `lessons.js` | 1 | `id`; state/object/person IDs | legacy local lesson без отдельного status |
| `threeDModels.js` | 1 | `id` | reviewed; локальный asset metadata |

Отдельные legacy datasets `/map` (`places.json`, `settlements.json`,
`eraPlaces.js`, `historicalBorders.js`, `popularPlaces.js`,
`regionContours.js`, `protectedAreas.js`, `tarbagatai.geojson`) не включаются
в P2A seed: они обслуживают существующую карту, имеют другую domain-модель и
не должны заставлять `/map` загружать P2A.

## 2. Идентификаторы и связи

- Каноническими являются существующие строковые `id`; UUID draft не является
  источником идентичности.
- `entityId/entityIds`, `eventIds`, `personIds`, `placeIds`, `routeIds`,
  `segmentIds`, `questionIds` и `sourceIds` сохраняются без переименования
  значений.
- Claim-source становится нормализованной связью
  `source_claim_sources(claim_id, source_id)`; совместимый `sourceIds` остаётся
  в local domain model.
- Geometry version ссылается на subject через `subject_type/subject_id`, чтобы
  поддержать entity, environment, hydrology, place и route без потери ID.
- Review Queue и telemetry являются runtime state и не входят в seed.

## 3. Существующие Supabase services

- `src/lib/supabaseClient.js` статически импортирует SDK и создаёт singleton
  при наличии URL/anon key.
- `placesService.js` читает legacy `places`, translations, images и eras,
  затем молча переходит на `places.json`.
- `historicalEntitiesService.js` пробует `historical_entities`, но всегда
  возвращает атомарный local package, пока remote package неполон.
- `supabaseStatus.js` проверяет legacy tables `places` и `eras`.
- timeline, sources и educational services полностью локальны.

P2A не переиспользует эти partial reads для Exhibition snapshot. Новый
repository загружает Supabase SDK динамически и возвращает ту же domain-модель,
что local repository.

## 4. Текущий SQL draft

`docs/database/historical_platform_schema.sql` остаётся reference. Он создаёт
PostGIS/pgcrypto, UUID entities/sources/geometries/events/people, translation
tables, relations, lessons, media, reviews и базовые published-only policies.
Draft не изменяется разрушительно.

## 5. Конфликты SQL draft и JS-моделей

| Draft | Фактическая модель | Решение P2A |
| --- | --- | --- |
| UUID PK + slug | стабильные text IDs | новые P2A tables используют text PK |
| `draft/in_review/published/...` | verified/reviewed/needs_review/demo_only | отдельный verification_status check |
| translation rows | JSON RU/KZ/EN | JSONB для titles/descriptions/names |
| только MultiPolygon entity geometry | Polygon/MultiPolygon/Point/MultiPoint/LineString/MultiLineString | `geometry(Geometry,4326)` + type/SRID checks |
| один `source_id` geometry | массив `sourceIds` | text[] для совместимости |
| нет normalized claims | claim objects + sourceIds | `source_claims` + join table |
| нет routes/environment/hydrology/archive maps | P1B/P1C datasets | отдельные P2A tables |
| published-only public read | UI показывает reviewed/needs_review/demo_only | RLS разрешает три статуса и исключает `metadata.public=false` |
| review tables с auth users | P1C Review Queue localStorage-only | не импортировать и не синхронизировать |

## 6. Reviewed/verified данные

Без изменения статуса могут импортироваться:

- 5 reviewed entities;
- 7 geometry versions со статусом reviewed/verified;
- 9 source records;
- 3 reviewed/verified source claims;
- 2 reviewed/verified historical changes;
- 2 reviewed stories и 8 reviewed evidence questions;
- project-owned reviewed educational archive overlay.

События, люди, timeline и legacy places не имеют собственного status. Они
импортируются только с явно консервативным `needs_review`, а исходное отсутствие
статуса фиксируется в metadata; это не является повышением или научной
верификацией.

## 7. `needs_review`

В seed сохраняются без повышения: 16 entities, 20 geometries, 8 settlements,
2 routes, 4 route segments, 2 environment snapshots, 4 hydrology snapshots,
5 claims, 1 archive placeholder, 1 historical change, 1 story и 1 question.
Validator дополнительно сообщает записи без sources/status и неполные
claim-level territorial mappings.

## 8. `demo_only`

Сохраняются с явной маркировкой: 1 environment snapshot, 1 hydrology snapshot
и 1 dispute structure. Educational overlay является reviewed собственной
реконструкцией, но не архивным оригиналом.

## 9. Что нельзя импортировать как verified

- все `needs_review` и `demo_only`;
- events/people/places/timeline/legacy questions без собственного status;
- приблизительные settlements и route geometry;
- hydrology без sources;
- broad-source environment geometry;
- неизвестный institutional archive placeholder;
- derived labels, computed comparison geometry, telemetry и review state.

## 10. Первый read-only API

Минимальный набор: entities, geometry versions, places, routes/segments,
environment, hydrology, sources, claims/claim-source joins, archive metadata и
одна story по ID. Snapshot API обязан принимать год, bounded bbox, язык и
limit; evidence API — subject type/id.

## 11. Local fallback

- `local` никогда не импортирует Supabase SDK.
- `supabase` возвращает понятную ошибку без неявной смены источника.
- `auto` один раз выполняет health check с timeout и использует local при
  network/timeout/invalid response.
- исходные JS datasets продолжают поставляться в offline build;
  Review Queue остаётся local-only.

## 12. Ограниченная загрузка

- P2A modules загружаются только маршрутом Exhibition.
- Snapshot фильтруется по году/bbox и bounded limit.
- Evidence, routes, story и archive metadata запрашиваются отдельно.
- Bbox bucket/debounce предотвращает запрос на каждый pixel карты.
- bounded memory cache сохраняет stale snapshot во время refresh.
- `/map` не импортирует repository factory или Supabase SDK.

## 13. Миграция без потери ID

1. Собрать нормализованный deterministic JSON из JS modules.
2. Валидировать ссылки, статусы, годы, geometry и licences.
3. Генерировать transaction-safe `INSERT ... ON CONFLICT (id) DO UPDATE`.
4. Сохранить исходный status и provenance в каждой записи.
5. Сравнить seed report с local counts/IDs.
6. Применять migrations/seed только вручную в staging после SQL security tests.
7. Переключить `auto`, проверить version match и fallback.
8. Rollback приложения — `VITE_HISTORICAL_DATA_SOURCE=local`; SQL objects не
   удаляются автоматически.

## Граница P2A

P2A не содержит CMS, auth UI, editorial mutations, realtime, file upload,
collaboration, external AI, P2B или P3. Materialized views не создаются:
bounded functions, GiST/B-tree indexes и cache достаточны для foundation.
