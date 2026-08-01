# P1B — Historical Environment, Cities and Routes

Дата аудита: 29 июля 2026  
Область: только Exhibition P1B. P0, P0.5, P1A, `/map`, backend и
существующие политические геометрии не заменяются.

## 1. Текущие Mapbox sources и layers

`ExhibitionMap` создаёт Mapbox только после lazy import и использует один style
`mapbox://styles/mapbox/dark-v11`. Стандартные подписи базовой карты скрываются.

| Source | Layers | Назначение |
| --- | --- | --- |
| `ex-territories` | `ex-territories-fill`, `ex-territories-extrusion`, `ex-territories-line` | Временные политические геометрии; `promoteId: "id"` для hover/selection через feature-state |
| `ex-places` | `ex-places-dot`, `ex-places-label` | Точки мест текущего timeline snapshot |
| `ex-entity-label-points` | `ex-entity-labels` | Крупные собственные подписи государств |
| `ex-comparison` | `ex-comparison-fill`, `ex-comparison-line` | Overlay и вычисленная геометрическая разница P1A |

Hover не вызывает `setData`: меняется только feature-state source
`ex-territories`. Selection также использует feature-state.

## 2. Фактический порядок слоёв

Сейчас порядок определяется последовательностью `addLayer`:

1. слои базового Mapbox style;
2. territory fill;
3. territory extrusion;
4. territory line;
5. place dots;
6. place labels;
7. entity labels;
8. comparison fill;
9. comparison line.

Явного `moveLayer` или централизованного реестра порядка нет. После `style.load`
слои создаются заново в той же последовательности, однако P1B нельзя полагаться
на порядок вызовов из разных модулей. Нужна идемпотентная
`ensureExhibitionLayerOrder(map)`.

Планируемый P1B-порядок:

1. base;
2. environment;
3. hydrology;
4. territory fill;
5. territory extrusion;
6. territory line;
7. trade routes;
8. nomadic routes;
9. military/diplomatic routes;
10. historical places;
11. archaeology;
12. events;
13. entity labels;
14. place labels;
15. comparison/selected overlays.

## 3. Обновление данных при смене года

- `ex-territories` и `ex-comparison` обновляются вместе в одном
  `requestAnimationFrame`.
- `ex-entity-label-points` обновляется отдельным effect при изменении года или
  языка.
- `ex-places` обновляется отдельным effect по `activeSnapshot` и языку; сейчас
  показываются только `activeSnapshot.placeIds`.
- palette применяется paint-обновлениями без `setStyle`.
- камера использует story override, snapshot или era camera.
- visibility текущих групп меняется через `setLayoutProperty`.

P1B должен объединять обновления environment/hydrology/routes/places в один
кадровый batch, не пересоздавать sources и записывать длительность source
updates в telemetry.

## 4. SVG fallback

`ExhibitionMapFallback` повторно использует временные political geometries,
собственные entity labels и comparison. Проекция линейная и ограничена
демонстрационным регионом Казахстана. Точки мест сейчас частично захардкожены в
локальном `knownPoints` и зависят от `activeSnapshot.placeIds`.

Fallback пока не использует переданный `activeLayers`, не отображает
исторические названия, routes, environment или hydrology. P1B расширит его
плоскими SVG path/circle слоями из тех же selector-функций, что и Mapbox.
Extrusion в SVG добавляться не будет.

## 5. Данные, пригодные для повторного использования

- `places.js`: Тараз, Туркестан, Сарайчик и другие современные точки.
- `sources.js`: UNESCO Silk Roads, Cambridge History, Britannica и локальные
  официальные источники.
- `entities.js` и `entityGeometries.js`: временные государства и связи.
- `events.js`: formation/consolidation/independence события.
- `stories.js` и story state machine: RU/KZ/EN, вопросы, session answers,
  timer cleanup, visibility pause.
- `panelState.js`: compact/expanded и общий focus trap в `ExhibitionPage`.
- `qualityMode.js`, era themes, telemetry и localStorage patterns.
- P1A worker/lazy-data подход, Mapbox feature-state и SVG projection.

## 6. Реализация без backend

Без изменения Supabase/PostGIS можно добавить:

- небольшие immutable временные datasets и чистые selectors;
- historical name lookup и локальный поиск;
- сохранённые реконструированные route segments;
- layer registry/reducer с localStorage;
- постоянные Mapbox sources/style layers;
- route journey state machine;
- новые story, questions и deterministic agent actions;
- URL parsing;
- diagnostics и session-only telemetry;
- CSS/canvas atmosphere без внешних ресурсов.

Тяжёлые datasets будут изолированы dynamic import. P1B-данные не должны
загружаться маршрутом `/map`.

## 7. Граница исторической и географической достоверности

- Имеющийся `unesco-silk-roads` подтверждает общий исторический контекст, но
  сам по себе недостаточен для утверждения точной линии и полного порядка
  остановок конкретного маршрута.
- Координаты существующих `places.js` пригодны как ориентиры интерфейса, но
  новые исторические записи должны помечать их как `approximate`.
- Для Тараза, Отырара, Сайрама/Испиджаба, Туркестана, Сыганака, Сарайчика и
  Баласагуна можно создать локальную учебную модель; точные периоды названий,
  функции города и route membership без отдельного локального источника
  получают `needs_review`.
- Локальных подтверждённых GeoJSON палеосреды и временных контуров Арала нет.
  Демонстрационные зоны и контуры разрешены только как `needs_review` или
  `demo_only`, без интерполяции.
- Точный список товаров, длительность караванного пути и точные сезонные
  маршруты не добавляются.
- Demo seasonal cycle создаётся только как архитектурный пример
  `needs_review`, без утверждения конкретного этнографического пути.

## 8. План реализации

1. Добавить схемы данных, небольшие curated/demo datasets, selectors,
   валидацию ссылок и historical place names.
2. Добавить layer registry/state/localStorage и URL parser.
3. Расширить Mapbox постоянными environment/hydrology/route/place sources,
   централизованным порядком и feature-state selection.
4. Расширить SVG fallback теми же выбранными данными.
5. Добавить Layer Panel, Route Panel, Historical Geography Panel и journey
   state machine/player.
6. Добавить лёгкий atmosphere renderer с quality/reduced-motion/visibility
   guards.
7. Расширить story dataset второй историей и четырьмя P1B-вопросами.
8. Расширить текущий local agent, telemetry и diagnostics.
9. Добавить unit/E2E проверки, включая desktop/mobile, URL, offline, fallback
   и отсутствие P1B-загрузки на `/map`.
10. Выполнить lint, Vitest, Chromium E2E, production build и
    `git diff --check`; зафиксировать bundle/precache/performance.

