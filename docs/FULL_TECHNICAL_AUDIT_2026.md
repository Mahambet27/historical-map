# Historical Map Full Technical Audit

Дата аудита: 26 сентября 2026. Репозиторий: `Mahambet27/historical-map`. Проверяемый commit: `e1d34e84ccdd289dc9da72cbe24bdbe9cde06f30` (`Add era year timeline and sourced historical data pipeline`).

Область: локальный checkout, исходники, зависимости, данные, SQL, сборка и доступные автоматические проверки. Production не изменялся; миграции, seed, публикация, рефакторинг и замена библиотек не выполнялись. Начальное рабочее дерево было чистым. Результат — этот документ, без изменения функциональности. Все оценки готовности ниже — инженерное суждение относительно полноценного государственного исторического GIS, а не оценка качества презентации.

В отчёте различаются: **подтверждено исходниками**, **подтверждено текущим запуском**, **риск, требующий отдельной проверки**. Существующие отчёты в `docs/`, результаты в `.p2a5/` и release manifests не считаются доказательством текущего production-состояния. Живой облачный Supabase, права реального production-проекта, его заголовки и географическая достоверность источников не аттестованы этим аудитом.

## Executive Summary

**Основной публичный продукт сейчас показывает интерактивную SVG-схему.** В `src/app/App.jsx` маршруты `/` и `/map` создают `ExhibitionPage forceOfficialDemo initialForceSvgFallback`; `/exhibition` тоже получает `initialForceSvgFallback`. `/demo` передаёт тот же флаг через `demo/DemoEntryPage.jsx`. Это осознанный default в коде, а не только аварийное поведение при плохом интернете.

Mapbox GL JS действительно установлен и используется. Старый GIS-интерфейс назначен маршруту **`/legacy-map`, не `/map`**. Его видимость в текущем E2E нестабильна: два теста полного прогона получили hidden-container и пустую страницу, повтор отдельно прошёл (детали ниже). В `ExhibitionMap.jsx` есть отдельная WebGL-ветка с историческими GeoJSON-слоями, но публичные маршруты её первоначально обходят. Под SVG нет скрытой Mapbox-карты: компонент возвращает SVG вместо контейнера WebGL.

Главный барьер — не выбор движка. Это сочетание схематичных исторических геометрий, отсутствия единого источника данных для renderer и repository, незавершённой проверки БД и отсутствия эксплуатационно проверенного автономного GIS. Переключение импорта на MapLibre не решит эти проблемы.

Что существует: работающий React-интерфейс, языки RU/KK/EN, timeline, карточки и источники, сценарии и сравнения, SVG fallback, отдельный просмотр GLB, локальный набор данных, repository abstraction, 18 SQL-таблиц, RPC/RLS, PWA shell и инструменты упаковки. Что не следует объявлять готовым: научно достоверная карта всего Казахстана, 3D-объекты на географической карте, подтверждённый production PostGIS, настоящий Admin CMS, полная автономность всех маршрутов.

## Current Architecture

Стек по `package-lock.json`: React 18.3.1 / React DOM, Vite 7.3.6, Mapbox GL JS 3.17.0, Supabase JS 2.108.2, `@google/model-viewer` 4.3.1, Turf difference/intersect/union/helpers. Three.js 0.183.2 присутствует транзитивно внутри model-viewer; собственной интеграции Three.js с картой нет. MapLibre не установлен. JavaScript/JSX, глобальный CSS, собственный router на History API; серверного приложения в этом checkout нет. Инструменты: ESLint, Vitest/jsdom, Playwright, axe, Lighthouse CI, glTF Transform, Workbox через vite-plugin-pwa, Rollup visualizer, `pg` для локальных DB-проверок.

| Подсистема | Файлы | Реальная роль |
|---|---|---|
| Вход и маршрутизация | `src/main.jsx`, `src/app/App.jsx`, `router.jsx`, `i18n.jsx` | SPA, lazy routes, ErrorBoundary, локализация |
| Публичный historical UI | `src/features/exhibition/ExhibitionPage.jsx` | Время, слои, выбор, stories, сравнения, panels, operator/kiosk |
| SVG renderer | `ExhibitionMapFallback.jsx`, `mapDataUtils.js` | Проецирование локальных координат в SVG, клики по объектам |
| Historical WebGL | `ExhibitionMap.jsx`, `historicalBasemapPolicy.js`, `mapStyleUtils.js` | Mapbox renderer, собственные GeoJSON-слои, пустая фоновая подложка |
| Legacy GIS | `features/map/MapExperience.jsx` → `MapCanvas.jsx` → `components/map/MapView.jsx` | Mapbox styles, DEM, маршруты, геолокация, places |
| Данные | `src/data/exhibition/*`, `src/data/*.json`, `*.js` | Основной встроенный контент и геометрии |
| Data access | `src/dataAccess/*`, `services/*`, exhibition hooks | local/supabase/auto, cache, RPC, fallback |
| SQL | `supabase/migrations/*`, `supabase/seed/*` | Подготовленная read-only historical DB, отдельно от legacy schema |
| Offline/release | `vite.config.js`, `scripts/release/*`, `config/releaseChannel.js` | PWA, локальная упаковка, health и recovery |
| Data pipeline | `scripts/data-import/*`, `data-sources/*` | Реестр, лицензии, нормализация предоставленных локальных файлов |

`src/MapView.jsx` — отдельная старая копия; активный lazy import указывает на `src/components/map/MapView.jsx`. Нельзя делать вывод о поведении маршрута только по старой копии. Аналогично `docs/database/schema.sql` и `historical_platform_schema.sql` — описания/предыдущие модели, а не доказательство применения текущих migrations.

Выставочный `features/agent/historicalAgentService.js` выбирает ответы и actions из локального `exhibitionAnswerPack`; это детерминированный помощник, а не подключённый LLM/RAG backend. Legacy `AiAssistant.jsx` имеет другой поток с Wikipedia. Наличие chat UI не доказывает наличие внешней AI-модели.

## Application Routes

| Route | Компонент / режим | Renderer и состояние |
|---|---|---|
| `/` | `ExhibitionPage`, official demo | Основная публичная historical map, SVG default, local repository |
| `/map` | Тот же путь | Тоже SVG; прежнее значение URL устарело |
| `/exhibition` | `ExhibitionPage`, explorer/hero | SVG default; repository зависит от конфигурации/release policy |
| `/demo` | `DemoEntryPage` → `ExhibitionPage` | SVG + локальный официальный сценарий, startup/health/kiosk/recovery |
| `/legacy-map` | `MapExperience` → `MapCanvas` → активный `MapView` | Настоящий Mapbox WebGL при наличии пригодного token/сети/GPU |
| `/exhibition/diagnostics`, `/demo/diagnostics` | `ExhibitionDiagnosticsPage` | Диагностика и release metadata, не карта |
| `/timeline` | `TimelinePage` | Каталог временных состояний, отдельный от состояния exhibition |
| `/events`, `/people`, `/heritage`, `/routes` | `CatalogPage` | Каталоги локального контента |
| `/events/:id` | `EventPage` | Карточка события |
| `/people/:id`, `/heritage/:id` | `CatalogPage` detail | Детали из встроенных наборов |
| `/museums`, `/education`, `/research`, `/about`, `/admin` | `SectionPage` | Статические страницы; разделы наполнения/CMS — заглушки |
| Остальные | `NotFoundPage` | 404-интерфейс |

`LandingPage` импортируется статически и существует в `RouteContent`, однако `/` перехватывается выше в `AppRoutes`. Это недостижимая ветка главного маршрута и потенциально лишний initial code. Отдельного detail route `/routes/:id` нет.

## Current Map Rendering

Схемы прохождения данных:

```text
Пользователь → / или /map
→ AppRoutes → ExhibitionPage (officialDemo, force SVG)
→ local repository для части контента + прямые импорты entityGeometries/entities/labels
→ ExhibitionMap → ExhibitionMapFallback
→ SVG territories / labels / places / routes / water / условный terrain
→ выбор объекта, панели, timeline, stories, comparison; GIS zoom/pan отсутствует

Пользователь → /exhibition
→ ExhibitionPage (force SVG, обычный explorer)
→ local / auto / supabase repository по env/release + локальные прямые импорты
→ тот же SVG renderer и historical UI
→ слои, источники, учебные сценарии, review в разрешённом режиме

Пользователь → /demo
→ DemoEntryPage → bootstrap/health → ExhibitionPage (official, local, SVG)
→ встроенный curated dataset и локальные assets
→ SVG + отдельно открываемый model-viewer
→ операторское меню, сценарий, reset, язык, kiosk

Пользователь → /legacy-map
→ MapExperience → MapCanvas → components/map/MapView
→ useMapData/placesService → legacy Supabase tables либо places.json;
  eraPlaces / popularPlaces / regionContours / protectedAreas
→ useMapLifecycle → useMapbox → Mapbox GL JS
→ cloud basemap + DEM + GeoJSON + DOM markers + Directions route
→ zoom/pan, камера, геолокация, поиск, фильтры, карточки и маршруты

Условная WebGL-ветка exhibition (не текущий default маршрутов)
→ ExhibitionMap без forceFallback и с token
→ Mapbox Map + createHistoricalBasemapStyle()
→ фон без tile sources + исторические GeoJSON/labels/extrusion/archive image
→ NavigationControl, easeTo/jumpTo, feature selection
```

Координаты данных имеют форму `[longitude, latitude]`; это не случайные экранные пиксели. Но формат lon/lat не подтверждает точность исторического контура. `projectExhibitionCoordinate` в `mapDataUtils.js` использует:

```text
x = 34 + (longitude - 38) / 63 * 832
y = 398 - (latitude - 31) / 32 * 354
```

Это линейное преобразование географических градусов в фиксированный viewport `900 × 430`, похожее на аффинную цилиндрическую схему. Нет CRS pipeline, корректного масштаба расстояний/площадей, тайлов, геодезической точности, Web Mercator camera или встроенного pan/zoom. Подложка охватывает 38–101°E, 31–63°N: это регион Евразии, не точная обрезка по Казахстану.

**Дефект перехода из fallback, установленный статически:** `mapFailed` инициализируется из `forceFallback`. Пока он true, вместо `containerRef` рендерится только SVG. При снятии force-флага effect выходит из-за отсутствующего `containerRef.current`; сброс `mapFailed(false)` есть только после успешной загрузки Mapbox style. Следовательно, операторское выключение SVG не гарантирует переход к WebGL без изменения жизненного цикла. В рамках аудита это не исправлялось.

## SVG Map Analysis

| Элемент и файл | Что действительно изображено | Fallback / production-решение |
|---|---|---|
| `ExhibitionMapFallback.jsx` | SVG paths из geographic-like массивов, интерактивная схема | Сохранить как явно обозначенный облегчённый режим; основному GIS нужен renderer с камерой и реальными геоданными |
| `entityGeometries.js` | 27 вручную заданных Polygon, обычно несколько вершин; все создаются с `geometryType: reconstruction` | Сохранять исходные версии как учебные реконструкции; заменить точные официальные/научные слои лицензированными и проверенными геометриями |
| Второй path с offsetY 6/9 и drop shadow | Иллюзия объёма SVG | Допустима для схемы; это не высота, DEM или 3D-объект |
| `historical-terrain-subtle` в `ExhibitionMap.jsx` и SVG terrain path | Один условный полигон `[67.5,39.5]…[82,39.5]…`, заливка | Не terrain engine; заменить DEM/hillshade в настоящем terrain-режиме |
| `environmentSnapshots.js`, `hydrologySnapshots.js`, `historicalRiverSnapshots.js` | Ручные зоны, обобщённый Арал и русла; часть demo | Сохранить с uncertainty, не выдавать за измеренные исторические береговые линии |
| `src/data/historicalBorders.js` | Legacy GeoJSON-контуры культурных/политических областей по era index | Рендерятся на настоящей карте, но данные от этого не становятся точными; мигрировать в общую temporal-модель |
| `regionContours.js`, `protectedAreas.js`, `tarbagatai.geojson` | Локальные GeoJSON-региональные контуры | Это реальные структуры GeoJSON; provenance/лицензия/точность требуют проверки отдельно |
| `public/archive-maps/qhm-evidence-overlay.svg`, thumbnail, `archiveMaps.js` | Собственная учебная схема, явно не архивный оригинал; второй archive record — placeholder | Сохранить как учебный overlay; настоящий архив требует прав и геопривязки |
| `ArchiveMapCompare.jsx`, SVG `<image>` | Визуальное сравнение/растягивание картинки | Не замена raster GIS. В SVG изображение растягивается на весь viewport, координаты углов не применяются как в WebGL image source |
| `ObjectPresentation.jsx`, `SelectedPlacePanel.jsx` | SVG-заглушка отсутствующей иллюстрации | Нормальный media fallback, не карта |
| `ExhibitionAtmosphere.jsx`, CSS | Декоративные эффекты | Сохранить опционально; не географические данные |

Дополнительный GIS-дефект: `getOuterRing` берёт только первый Polygon первого MultiPolygon; holes игнорируются. Territories/comparison местами прямо обращаются к `coordinates[0]`. Это не универсальный GeoJSON renderer: острова, анклавы и вырезы будут потеряны при загрузке сложных production-геометрий. SVG-группы с `role=button` находятся внутри `aria-hidden=true` SVG и не имеют полноценной клавиатурной семантики; legend даёт альтернативный доступ к территориям, но не автоматически ко всем слоям.

## Mapbox Dependencies

Таблица включает найденные прямые зависимости и пути обёрток; одинаковая библиотека в неактивной копии отдельно помечена. Сложность — относительная оценка переноса поведения, а не только замены import.

| Группа | Файл / функция | Зависимость | Замена / критичность | MapLibre |
|---|---|---|---|---|
| A Renderer | `package.json`, lock; `hooks/useMapbox.js` | `mapboxgl.Map`, lifecycle/events, GL CSS | Средняя/высокая; критична для legacy | Да, с регрессионной проверкой API/style |
| A Renderer | `features/exhibition/ExhibitionMap.jsx` | dynamic import, Map, NavigationControl, feature-state | Средняя; потенциальный GIS historical renderer | Да; lifecycle сначала исправить |
| A Renderer | `features/map/services/mapboxService.js` | loader и проверка token | Низкая; helper не является главным активным lifecycle | Да; убрать provider-specific token gate |
| B Basemap | `hooks/useMapbox.js`, `lib/mapConfig.js` | `mapbox://styles/mapbox/streets-v12`, `satellite-streets-v12` | Высокая по данным/стилю; критична для legacy | Нужны другие tiles, sprites, glyphs и style; URL не переносится автоматически |
| C Terrain | `hooks/useMapbox.js`; `layers/TerrainLayer.js` | raster-dem, terrain-rgb, fallback `mapbox-terrain-dem-v1`, `setTerrain` | Средняя/высокая; облачные DEM заменить | Да, собственный DEM и корректная encoding |
| D Routing | `features/map/services/directionsService.js`; `layers/RouteLayer.js` | `api.mapbox.com/directions/v5/mapbox/driving`, access token | Высокая; независимый внешний сервис | Не функция MapLibre; отдельный routing backend |
| E Markers/Popups | `components/map/markerUtils.js`, `components/map/MapView.jsx`, `hooks/useMapbox.js`, `layers/MarkersLayer.js` | Marker/Popup, HTML, DOM events | Средняя; для больших наборов нужны style layers/clustering | В основном совместимая концепция, проверить опции |
| F Camera | `hooks/useMapbox.js`, `components/map/MapView.jsx`, `ExhibitionMap.jsx`, `lib/cameraUtils.js` | flyTo/easeTo/jumpTo/fitBounds, refs и tour animation | Средняя; убрать связь UI с provider object | Да, адаптер камеры |
| F Bounds | `lib/mapHelpers.js` | `mapboxgl.LngLatBounds` | Низкая | Да |
| G Styles | `historicalBasemapPolicy.js`, `mapStyleUtils.js`, `layerRegistry.js`, `MapLayerManager.jsx`, `RegionLayer.js` | Style spec, paint/layout, fog, terrain/layer order | Средняя; fog/API и labels отдельно тестировать | Частично совместимо, не обещать drop-in parity |
| H Geolocation | `hooks/useMapbox.js`, активный `MapView.jsx` | GeolocateControl, navigator.geolocation, user Marker | Средняя; privacy и маршруты | Да; browser Geolocation не принадлежит Mapbox |
| Конфигурация | `config/env.js`, `.env.example`, `vercel.json` | pk token validation, cloud CSP allowlist | Низкая, но обязательная для режима без Cloud | Заменить policy/конфиг |
| Legacy duplicate | `src/MapView.jsx` | Повтор Map/Marker/Popup/terrain/Directions/Geolocation | Большой объём, сейчас не активный route | Не мигрировать вслепую; сначала доказать ненужность |
| Обёртки | `features/map/hooks/*`, `MapCanvas.jsx`, `MapExperience.jsx` | Протаскивание Mapbox API и refs | Средняя архитектурная связность | Сохранить UI, развязать lifecycle/data/camera |

В exhibition basemap **нет** `mapbox://` tile source: `sources: {}`, только background. Это не Mapbox Streets, скрытый под SVG. Однако наличие Mapbox SDK/token и условной WebGL-ветки ещё не является гарантией нулевых обращений к Mapbox при её включении. Надписи выставочной WebGL-ветки задают `text-font`, но базовый style не содержит `glyphs`; работу symbol layers надо проверить при реальном включении этой ветки.

## Historical Data Model

Фактические размеры JS-наборов измерены импортом модулей, а не взяты из README:

| Набор | Файл в `src/data/exhibition/` | Записей | Оценка |
|---|---|---:|---|
| Eras | `eraRegistry.js` / `eras.js` | 5 | Единый реестр текущих эпох, не полное покрытие истории |
| Entities | `entities.js` | 21 (5 основных + 16 контекстных) | Идентификаторы, тексты, связи и даты; типы требуют mapper в SQL |
| Territories/borders | `entityGeometries.js` | 27 | Temporal GeoJSON; 6 reviewed, 20 needs_review, 1 verified; точность контуров не доказана |
| Labels | `entityLabels.js` | 24 | Отдельные label points/rotation/size, ручная картографическая вёрстка |
| Events / people | `events.js`, `people.js` | 6 / 4 | Структурированные связи, источники, периоды, очень малый охват |
| Heritage presentation | `places.js` | 11 | Карточки exhibition; отдельно legacy `src/data/places.json` |
| Historical settlements | `historicalSettlements.js` | 8 | Lon/lat, интервалы, названия, route/source IDs, approximate precision |
| Routes / segments | `historicalRoutes.js`, `routeSegments.js` | 2 / 4 | Шёлковый путь и demo кочевого цикла; не современная транспортная сеть |
| Environment | `environmentSnapshots.js` | 3 | Демонстрационные зоны |
| Water / rivers | `hydrologySnapshots.js`, `historicalRiverSnapshots.js` | 6 / 6 | Обобщённые временные реконструкции |
| Sources / claims / disputes | `sources.js`, `sourceClaims.js`, `sourceDisputes.js` | 9 / 8 / 1 | Полезное начало evidence-модели, не покрытие всех геометрий |
| Archive maps | `archiveMaps.js` | 2 | Учебный SVG и будущий placeholder |
| Stories / questions / lesson | `stories.js`, `lessons.js` | 3 / 13 / 1 | Локальные образовательные сценарии |
| Curated snapshots / changes | `timeline.js`, `historicalChanges.js` | 6 / 3 | Ограниченный набор интерпретированных переходов |
| 3D catalogue | `threeDModels.js` | 1 | Оптимизированная выставочная модель |

В JS хранятся практически все historical entities, границы, timeline, evidence, сценарии. В JSON: `places.json`, `cities.json`, `districts.json`, `settlements.json`, реестр источников `data-sources/open-data-sources.json`, seed JSON и release/coverage reports. Настоящий файл GeoJSON: `src/data/tarbagatai.geojson`; кроме него GeoJSON Feature/FeatureCollection конструируется в JS для borders, contours, protected areas, territories, water, routes. Наличие расширения `.js` не делает геометрию не-GeoJSON.

Официальный современный контур и Казахская ССР заданы одним и тем же очень грубым Polygon примерно из десяти позиций. `republic-1991` помечен `verified/high`, но ссылка на закон о независимости сама по себе не является источником координат границы. Здесь нужно разделить достоверность исторического факта, источника, интервала и пространственной реконструкции.

Реестр open data: 14 источников, 6 enabled. `scripts/data-import/importer-core.mjs` требует `--input=...`, сам сетевые загрузки не делает; ставит provenance/hash/license/review metadata. В `src/data/imported/{normalized,staging,rejected}` на момент аудита нет импортированного массива: валидатор подтвердил **0 записей**. Подготовленный pipeline нельзя считать уже наполненной национальной базой.

Seed: **226 строк, 18 таблиц**. Геометрий 27, places 16, hydrology 5. Текущий JS содержит 6 water snapshots и дополнительный набор 6 rivers: seed и новые runtime-наборы не полностью совпадают. Это сигнал для повторной генерации и parity-check, а не основание автоматически править seed. Каталога музеев с координатами/коллекциями нет, `/museums` — placeholder. Regions/districts и legacy POI существуют отдельно от новой evidence/temporal-модели.

Готовность к PostGIS: структуры пригодны как вход для нормализации, но source arrays и polymorphic subject IDs не равнозначны полной ссылочной целостности. Национальному масштабу нужны coverage metrics по областям/эпохам, редакционная ответственность, versioned publication, точные лицензии, CRS/provenance, spatial indexes и ограничения выдачи/тайлинг. Сейчас основной масштаб — curated demo.

## Timeline

`selectedYear`, `selectedEraId` и `activeSnapshot` — state в `ExhibitionPage.jsx`. URL `era/year` читается через `historicalYearModel.js` и обновляется `replaceState`. `ExhibitionYearSlider.jsx` хранит draft input и вызывает обновление через requestAnimationFrame. Hook repository отдельно имеет debounce 250 ms, AbortController и защиту от устаревшего ответа.

```text
URL / era button / slider / ±1 / key-year / playback
→ normalizeHistoricalYear (0 → 1), clamp и resolveYearSelection/resolveEraSelection
→ selectedYear + selectedEraId + curated activeSnapshot
→ getGeometriesAtYear / temporal place-water-route builders / repository snapshot
→ availability + uncertainty + layers + карточки
→ SVG redraw или WebGL source.setData
```

Текущие границы реестра: **−800…−300, 552…942, 1465…1847, 1936…1990, 1991…2026**. `historicalYear.js` вычисляет общий min/max −800…2026. Утверждение README о диапазоне −3000…2026 устарело. Между эпохами есть крупные пробелы. Наличие числового года не означает наличие данных; slider привязан к active era и при отсутствии эпохи возвращает null.

BCE/CE поддержаны отрицательными числами и локализованными подписями; переход −1 ↔ 1 пропускает нулевой год. Геометрии фильтруются по включительным `validFromYear/validToYear` (null означает открытый конец). Для places/routes/water используются temporal builders; события входят в availability и каталоги, но единый event layer, фильтрующий все события на главной карте по точному году, не обнаружен. People/events в отдельных страницах не наследуют автоматически exhibition state.

Legacy `/legacy-map` использует другую шкалу: `selectedEra` — числовой индекс из шести категорий, POI сравниваются по `Number(p.era)`, layer filter — по `era`. Это не полноценный from/to timeline и не тот же year-state, что в exhibition. Сведение этих двух моделей нужно выполнять явно, сохранив поведение фильтров.

`getHistoricalSnapshotAtYear` даёт curated состояние; его нельзя путать с научной реконструкцией на каждый год. Отдельные периоды используют один неизменный контур на десятилетия. Площадные сравнения через Turf/worker — геометрические вычисления над этими реконструкциями, не доказательство исторического прироста территории.

Проверки есть: `timeline:validate`, `science:validate:temporal`, unit/E2E year/navigation tests. Текущий temporal validator: 0 errors, 81 warnings. Особый риск интерфейса: availability выставляет `exact`, если хотя бы одна запись любого набора точно совпала с годом. Это не означает, что все видимые границы документированы именно на этот год. Реестр также содержит ссылки вроде `saka-groups`, тогда как entity называется `saka-communities`; validation featured IDs следует расширить.

## 3D

| Возможность | Текущее состояние |
|---|---|
| A. Модель в карточке | `components/places/ObjectPresentation.jsx`: model3d/modelPoster и model-viewer; `ExhibitionThreeD.jsx`: отдельная панель, poster, timeout 15 s, retry, camera controls, offline download UI |
| B. 3D на карте | GLB custom layer, общая сцена/камера, географическая постановка и picking отсутствуют |
| C. Terrain | Настоящий DEM только в legacy Mapbox; exhibition terrain — залитый схематичный полигон |
| D. Extrusion | WebGL `fill-extrusion` территорий: 14 000/26 000 м для выразительности; SVG offset 6/9 px. Это не здания и не измеренные высоты |
| E. GLB на координаты | Пока не реализовано: нет Mercator transform, elevation placement, метрического scale/orientation и custom render lifecycle |

В `public/models/source` 6 исходных GLB, в `public/models/exhibition` 1 оптимизированный. Legacy карточки ссылаются на пять крупных source-моделей и оптимизированный Bory Tastagan, поэтому удалять весь source-каталог сейчас нельзя. `scripts/3d/optimize-models.mjs` — существующий путь обработки; аудит не запускал оптимизацию и не менял assets.

Текущий `3d:audit`: source-файлы 6.84–15.15 MiB, 206 298–501 950 треугольников, 4096² textures, без compression. Выставочный GLB: **1 365 176 B (~1.30 MiB), 206 298 triangles, 2048² texture, EXT_meshopt_compression**. Poster: **45 282 B**. `3d:budget` проходит (лимиты 15 MiB / 250 KiB); это size budget, не GPU/triangle/frame-time budget.

Model-viewer импортируется локально; Meshopt decoder указан локальным URL `/vendor/meshoptimizer/meshopt_decoder.js`. Это не Google Cloud API. В установленном `@google/model-viewer/lib/features/loading.js:28–29` defaults для Draco и KTX2 указывают на `www.gstatic.com`. Текущая выставочная модель использует Meshopt; добавление Draco/KTX2-моделей без локальных override создаст внешнюю зависимость. Эти decoders/transcoders нужно локализовать перед строгим offline release.

**Будущий MapLibre + Three.js + GLB/GLTF + координаты + terrain без Mapbox Cloud технически возможен.** В официальной документации есть [custom layer с Three.js и terrain](https://maplibre.org/maplibre-gl-js/docs/examples/adding-3d-models-using-threejs-on-terrain/) и [DEM terrain](https://maplibre.org/maplibre-gl-js/docs/examples/sky-fog-terrain/). Для этого проекта это ещё работа: собственные tiles/DEM/style/glyphs, лицензированные модели, единицы/оси/высоты, LOD, лимиты памяти, dispose, context-loss recovery и тесты на целевом GPU. Примеры подтверждают реализуемость стека, а не готовность данного приложения.

## Backend / PostGIS

Есть действительная клиентская реализация Supabase repository и SQL, а не только текстовый план. Однако факт применения этих SQL в рабочей БД аудитом не установлен. Старый `.p2a5/verification.json` содержит `passed:false` и недоступность loopback DB; это исторический результат августа, не новая успешная проверка. На проверенных локальных портах 54321/54322 слушатель не обнаружен. Миграции/seed не применялись и облачная БД не изменялась.

Пять миграций: core schema, RLS, read functions, indexes, P2A5 corrections. PostGIS устанавливается в `extensions`, геометрии SRID 4326. GiST есть для geometries, places, route segments, environment, hydrology; обычные индексы — для year/status/subject/order. RPC используют bbox validation, spatial intersection, temporal predicates и пределы выдачи. Большие data-volume query plans этим аудитом не измерялись.

18 таблиц: `p2a_dataset_metadata`, `historical_entities`, `historical_names`, `historical_geometries`, `historical_events`, `historical_people`, `historical_places`, `historical_sources`, `source_claims`, `source_claim_sources`, `historical_routes`, `route_segments`, `environment_snapshots`, `hydrology_snapshots`, `archive_maps`, `educational_stories`, `educational_story_steps`, `educational_questions`.

RPC: `get_historical_geometries`, `get_historical_places`, `get_historical_routes`, `get_subject_evidence`, `get_exhibition_snapshot`, `get_educational_story`, `get_p2a_dataset_status`. Важные меры: фиксированный search_path у security-definer функций, explicit public predicates, bounded results; это требует проверки под реальными ролями. Поздняя миграция меняет archive view на `security_invoker=false, security_barrier=true`, сохраняя явное маскирование полей. Прямой доступ anon к archive_maps отозван.

RLS запрещает anon writes и допускает чтение `verified`, `reviewed`, **`needs_review`, `demo_only`** при public metadata. Это read-only policy, а не строгий редакционный publication gate. Для публичного государственного каталога правила статуса нужно согласовать отдельно. Защита base table не заменяет проверку фильтра каждого security-definer RPC и его EXECUTE grants.

Источник истины сейчас неоднозначен:

- Official `/`, `/map`, `/demo`: local repository принудительно.
- Обычный exhibition: local/supabase/auto; auto откатывается к local при ошибке, explicit supabase оставляет ошибку.
- **Territories и labels** в обоих renderers импортируются напрямую из `entityGeometries.js` / `entities.js` / `entityLabels.js`; snapshot.geometries не передаётся в renderer как единственный источник.
- Places/routes/environment/water частично объединяются из snapshot и локального P1B loader. Bbox hook по умолчанию статический, не связан с viewport callback renderer.
- `placesService.js` — второй контракт для legacy таблиц `places`, `place_translations`, `place_images`, `eras`; это не новые historical_* tables.

Конкретный риск parity: `LocalHistoricalRepository.getPlaces()` добавляет exhibitionPlaces как `needs_review` и фильтрует их только по bbox, не по тем же time/status predicates, что rich settlements. Local bbox intersection — сравнение envelopes, не точный ST_Intersects. `getRoutes()` не выполняет полноценную viewport-фильтрацию. На маленьком pack это терпимо; при национальной базе различия станут пользовательскими дефектами.

Для production: отдельное воспроизводимое DB-окружение, fresh migration/seed/idempotency, anon/authenticated tests, status/release policy, backup/restore, concurrency/load, source parity и version pinning. Включение Supabase URL само по себе не решает эти задачи.

## Offline / Exhibition

Offline образовательное ядро существует: локальные JS-данные, SVG, перевод, сценарии, poster/GLB assets и упаковочный локальный сервер. Это пригодная основа выставочного стенда; она не равна автономной национальной GIS с тайлами и маршрутизацией.

`vite.config.js`: Workbox generateSW, registration prompt, navigation fallback `/index.html`, max precache file 900 KiB. Precache patterns HTML/JS/CSS/SVG/webmanifest; исключены images/models, MapView, Mapbox, model-viewer, Supabase chunks, stats. Posters добавляются через includeAssets. JSON — runtime NetworkFirst, 4 s timeout, 30 entries, 24 h; model-viewer JS — CacheFirst, 2 entries, 1 year. Это означает, что первый запуск без сети и полное покрытие legacy/media не гарантированы.

**Подтверждённый по коду разрыв offline GLB:** `offlineModelCache.js` записывает Response в отдельный cache `qazaq-heritage-3d-v1`; `ExhibitionThreeD.jsx` проверяет cache.match для статуса, но model-viewer продолжает получать обычный `model.src`. В SW нет runtime route для `.glb`, компонент не читает cached Response в blob URL. Поэтому сообщение «3D готово офлайн» подтверждает наличие записи в cache, но не доступность загрузки viewer при сетевом отказе. При локальном HTTP-сервере с GLB-файлом эта проблема может не проявляться: localhost продолжает отдавать файл без внешнего интернета.

`build-offline-exhibition.mjs` / `package-config.mjs` создают пакет с локальным сервером и launcher, исключают `.env`, `.git`, source GLB, sourcemaps и тестовые артефакты. Но legacy карточки продолжают ссылаться на source GLB: такой пакет следует ограничить выставочным scope либо явно решить доступность legacy assets. `exhibition:offline:serve` в package.json указывает на старый `2026.08-rc1`, тогда как package-config собирает `2026.08-stable1`: риск запуска устаревшего пакета.

Health-check проверяет доступность файлов и policy; это не exhaustive renderer/network/GPU test. `/demo` запускает health GET для GLB даже без открытия 3D — учитывать в traffic/initial-load. Для government mode нужен самостоятельный build profile с нулевыми внешними запросами, локальными tiles/DEM/fonts/decoders и проверкой холодного старта на чистом устройстве с отключённым uplink. Нужны также обновление/rollback, контроль целостности, перенос на другой ПК и права оператора. Эти свойства нельзя вывести из наличия manifest или успешного SVG-теста.

## External Dependencies

Инвентаризация ниже отделяет исполняемые запросы от ссылок/реестров. Это статический охват исходников; полный сетевой HAR всех интеракций, облачных стилей и динамического DB-контента не получен. URL из `.env` и tokens в отчёт не включены.

| Domain | Purpose | File / источник | Required / optional | Self-host |
|---|---|---|---|---|
| `api.mapbox.com` | styles/tiles/glyph resources и Directions | `useMapbox.js`, `directionsService.js`, `RouteLayer.js`, старый MapView | Нужен cloud legacy режиму; не SVG | Заменить сервис/наборы; не просто скопировать коммерческие tiles |
| `*.tiles.mapbox.com`, `events.mapbox.com` | SDK tiles/telemetry endpoints, CSP allowance | Mapbox SDK, `vercel.json` | Условно при SDK/cloud режиме | Устранить зависимость в government profile |
| `www.mapbox.com`, `apps.mapbox.com`, `www.openstreetmap.org` | Attribution/feedback links | Mapbox controls, подтверждены E2E accessibility context | Переход пользователя | Сохранить требуемую атрибуцию лицензированных данных; изменить provider links по новой поставке |
| configured Supabase host (`*.supabase.co` обычно) | REST/RPC/storage; возможный WebSocket SDK | `supabaseClient.js`, `SupabaseHistoricalRepository.js`, `placesService.js` | Условно, official local без него | Да, совместимый backend/собственный deployment |
| `ru.wikipedia.org` | opensearch + page summary | `components/chat/AiAssistant.jsx` | Опциональная legacy-помощь | Заменить локальным лицензированным пакетом; API самого сайта не «переносится» |
| `www.google.com` | Переход в Google Maps Directions | `InfoPanel.jsx`, `SelectedPlacePanel.jsx`, `ObjectPresentation.jsx`, старая копия MapView | Только переход пользователя | Собственный navigation UI/backend вместо Google |
| `adilet.zan.kz`, `www.un.org`, `e-history.kz`, `doi.org`, `www.britannica.com`, `www.unesco.org` | Цитаты, внешние source links | `data/exhibition/sources.js`, source panels | Не авто-fetch карты, переход по ссылке | Только разрешённые копии/metadata; права отдельно |
| `unpkg.com` | Разрешён в CSP script-src | `vercel.json` | Runtime import viewer сейчас локальный; разрешение не доказательство запроса | Удалить лишнее разрешение при последующем hardening |
| `fonts.googleapis.com`, `fonts.gstatic.com` | Предполагаемая зависимость из задания | В first-party runtime import не найдены | Не требуются текущим CSS | Шрифты локально при добавлении |
| `www.gstatic.com` | Draco decoder / KTX2 transcoder defaults | `@google/model-viewer/lib/features/loading.js:28–29` | Условно для соответствующих сжатых моделей; текущий Meshopt локальный | Да, локальные URL/config с лицензиями |
| `www.w3.org` | SVG namespace | SVG/data URLs | Не сетевой запрос | Не применимо |
| `qhm.local` | Base URL при валидации относительных ссылок | `evidenceValidation.js` | Не сетевой запрос | Не применимо |
| `historical-map.vercel.app` | canonical/OG/deployment references | `index.html`, release config | Metadata, не API карты | Сменить origin для локального/госразвёртывания |

Data-source registry domains: `data.egov.kz`, `data.unesco.org`, `wikidata.org`, `pleiades.stoa.org`, `whgazetteer.org`, `geonames.org`, `naturalearthdata.com`, `openstreetmap.org`, `hydrosheds.org`, `earthdata.nasa.gov`, `dataspace.copernicus.eu`, `si.edu`, `opencontext.org`. Это описанные потенциальные источники; importer требует локальный input, автоматических runtime-запросов к ним нет. Разрешение импорта и self-host данных зависит от metadata/license policy; enabled всего 6 из 14 записей.

Отдельно: `ObjectPresentation` допускает iframe `modelViewerUrl` и произвольные media URLs из данных; текущие model3d локальные, но будущая DB-запись может добавить новый домен. Нужна allowlist на ingestion и renderer. `@google/model-viewer` — npm-библиотека, не автоматическая зависимость от Google API. Development/CI обращается к npm registry и при установке браузеров к Playwright CDN; эти запросы не являются пользовательским runtime.

## Performance

Проверки выполнялись на Windows, Node 24.12.0, npm 11.6.2. `npm.ps1` блокируется системной execution policy; использован `npm.cmd`. Первичный esbuild в sandbox не мог читать родительский каталог; успешные запуски тестов/сборки выполнены вне этого ограничения. Исходники для диагностики не правились.

Установка: `npm install --package-lock=false --ignore-scripts --no-audit --no-fund` завершилась успешно; lockfile не изменён. Затем выполнен `npm ci --ignore-scripts --no-audit --no-fund` для возвращения точных lockfile-версий. Один промежуточный E2E/analyze попал на незавершённую установку и получил missing modules; эти попытки не используются как оценка качества приложения. Итоговые результаты после восстановления окружения приведены ниже.

| Проверка | Результат текущего аудита |
|---|---|
| npm install | Успешно с `--package-lock=false --ignore-scripts`; затем чистый `npm ci --ignore-scripts` по исходному lockfile, 1064 packages |
| `npm run lint` | PASS, exit 0 |
| `npm run test:run` | Первый запуск: 21 файл / 231 тест PASS. Повтор при одновременной build/E2E-нагрузке завершился worker timeout; финальный `--maxWorkers=2`: снова 21/231 PASS, 21.39 s |
| `npm run build` | PASS, exit 0, 19.29 s на первом успешном запуске |
| `npm run analyze` | PASS после восстановления lockfile dependencies; `dist/stats.html` создан; build phase 2m12s под параллельной нагрузкой, это не пользовательский load time |
| `npm run test:e2e -- --workers=4` | **НЕ PASS: 96 passed, 3 failed, 6 skipped, 1 did not run**, 3.5 min, Chromium |
| Повтор только трёх упавших E2E, `--workers=1` | 3 PASS, 11.8 s; полный прогон этим не заменяется |
| `npm run 3d:audit` / `3d:budget` | PASS / PASS; семь GLB, один production GLB и poster проходят size budget |
| `science:validate:temporal` | 0 errors / 81 warnings |
| `science:validate:spatial` | 0 errors / 0 warnings; это формальная проверка, не научная аттестация |
| `science:validate:evidence` | 0 errors / 35 warnings, в том числе отсутствие extent claims/reviewer metadata |
| `timeline:validate` | PASS: 5 эпох, нулевого года нет |
| `data:sources:validate` | PASS: 14 источников, 6 enabled |
| `data:import:validate` | PASS на **нуле** staged/normalized records |
| `db:geometry:validate` | 55 seed geometries/points/lines, 0 errors / 81 warnings, включая assumed SRID/provenance |
| Live DB security/RPC/migration/load | Не выполнены: доступная изолированная DB не установлена; SQL не применялся |

Падения полного E2E:

1. `e2e/app.spec.js:36`: serious axe `color-contrast`, текст #17212a на #071722 в `.ex-time-dock`, измеренное отношение 1.11 вместо ожидаемых 4.5. Снимок основного экрана визуально подтверждает плохо читаемый нижний текст в этом прогоне. Повтор прошёл; требуется проверять после окончания theme/font/render transitions, а не объявлять проблему постоянно воспроизводимой.
2. `e2e/exhibition-p1c.spec.js:135` и `exhibition-p2a.spec.js:184`: `.map-experience` остаётся hidden; снимок показывает header и пустую область. Mapbox controls присутствуют в accessibility context, то есть существование Map instance не гарантирует видимую карту.
3. Статический кандидат причины legacy layout: `SiteLayout.jsx:17` добавляет `site-shell--map` **только для `/map`**, хотя реальный legacy находится на `/legacy-map`; CSS задаёт необходимую высоту main именно внутри этого класса (`global.css:590`). Это подтверждённое несоответствие route/style, но полного причинного browser trace с измеренными layout boxes аудит не получил.

Оба legacy теста принимают также `.route-loading` как успешную видимость. Поэтому их быстрый успешный повтор не доказывает, что конечная карта отрисовалась корректно. Нужна отдельная регрессия с ожиданием конечного canvas, ненулевой высотой и состоянием после загрузки. Никакие тесты ради зелёного результата не менялись. Шесть local Supabase tests opt-in пропущены; mock repository tests не заменяют их. Один `did not run` учитывается отдельно, без объявления его успешным.

Существующие Playwright тесты действительно загрузили production GLB до `data-3d-status=ready`, проверили poster/error/manual load и отсутствие раннего GLB в обычном exhibition. Они запускают Vite dev server, поэтому не доказывают работу production service worker, CSP и холодного offline-старта. Ручной подключённый браузер через CUA недоступен; `agent-browser` CLI в PATH не найден. Визуальная проверка выполнена по новым скриншотам Playwright, включая `/` 1366×768 и неудачный `/legacy-map`.

Сгенерированные E2E-снимки, которые перезаписали tracked `artifacts/visual`, сохранены в ignored `test-results/audit-visual`; девять tracked screenshots восстановлены из исходного HEAD. Логи запуска находятся в системном TEMP (`historical-map-audit-*.log`); временные trace/video/error-context могут содержать публичные SDK URLs/token, поэтому не добавлены в отчёт/коммит.

Размеры успешной сборки, decimal kB, minified / gzip:

| Chunk | kB | gzip kB | Значение |
|---|---:|---:|---|
| mapbox-gl | 1679.14 | 464.24 | Тяжёлый lazy renderer, не нужен initial SVG |
| model-viewer | 1038.49 | 296.59 | Lazy 3D, больше лимита precache |
| supabase | 210.64 | 55.03 | Условный DB-client |
| react | 141.84 | 45.59 | Shared runtime |
| ExhibitionPage | 114.70 | 35.97 | Основная историческая страница |
| places | 81.32 | 20.74 | Статические legacy данные |
| useHistoricalRepositoryStatus | 69.24 | 22.91 | Shared historical data/dependencies, имя chunk не равно содержимому |
| stories | 60.85 | 16.87 | Тексты/сценарии |
| MapView | 45.60 | 15.54 | Active legacy UI без отдельного SDK chunk |
| ExhibitionMap | 31.98 | 9.74 | Renderer UI/GeoJSON helpers |
| index | 22.34 | 7.91 | Entry, не весь initial waterfall |

Инвентаризация итогового analyze `dist/assets`: 138 JS-файлов, **4 792 138 B суммарно / 1 449 721 B gzip**; 2 CSS-файла, **131 125 B / 24 616 B gzip**. Это все chunks, включая отложенные, а не initial download. `public/` суммарно **95 018 879 B** (~90.62 MiB), включая исходные модели и медиа.

Стандартная сборка сформировала 113 precache entries, 1407.25 KiB; analyze-запуск после clean install — 142 entries, 1782.08 KiB. Эти manifests не объявляются тождественными; нужен pin build mode/environment при сравнении release. Это размер precache, не измеренный first-load transfer. Initial `/` требует entry/React/CSS/ExhibitionPage/shared imports, но не обязательно Mapbox или model-viewer. Точные LCP/INP/TTFB/FPS на целевом киоске не измерены; старые Lighthouse JSON не выдаются за новые измерения. Предупреждение Browserslist о старой базе и Rollup о смешанных static/dynamic imports подтверждают, что часть объявленного lazy data не отделяется в chunks.

Крупные assets: `images/amirsana/c3.png` ~2.22 MiB, `images/kubas-at/ka-1.jpeg` ~1.63 MiB, `images/boritostagan/bt-3.mp4` ~2.72 MiB; source GLB суммарно существенно больше оптимизированной модели. Обычный Vite build копирует `public/models/source` в dist; исключение есть только у специального packaging script.

Вероятные bottlenecks: большие DOM marker lists с повторным созданием; monolithic exhibition state; локальная фильтрация массивов и повторные GeoJSON builders; static imports всех базовых наборов; multi-polygon SVG loss; частые timeline updates; вычисление/сериализация payload size; крупные models без LOD. Turf difference вынесен в worker — сохранить. `chunkSizeWarningLimit: 2000` лишь подавляет предупреждения ниже 2 MB, не уменьшает bundle.

## Code Quality

| Файл | Строк, включая завершающую пустую | Оценка |
|---|---:|---|
| `src/MapView.jsx` | 2339 | Старая большая копия, не target текущего lazy route |
| `src/components/map/MapView.jsx` | 1287 | Активный god component: selection, routes, geolocation, UI, markers |
| `src/features/exhibition/ExhibitionPage.jsx` | 2195 | Новый god component: десятки state/ref/effects, режимы и panels |
| `src/features/exhibition/ExhibitionMap.jsx` | 933 | Layers, camera, data conversion, interaction и fallback lifecycle вместе |
| `src/hooks/useMapbox.js` | 749 | Cloud/provider-specific lifecycle и слои |

`features/map/hooks/useMapLifecycle.js` оборачивает существующий `useMapbox`, не устраняет его связность. `src/layers/*`, старый MapView и активный MapView содержат пересекающиеся реализации. Нужно сначала проверить import graph, потом удалять доказанно неиспользуемое; весь legacy нельзя назвать dead code, поскольку `/legacy-map` работает через него.

Private API: активный `components/map/MapView.jsx` читает `source._data` (примерно строки 439–443); `layers/RouteLayer.js` тоже. Это нестабильный внутренний контракт SDK. `map.__hm*` — собственные ad-hoc поля проекта: не private Mapbox API, но дополнительная скрытая связь между lifecycle и слоями.

API-запросы: legacy assistant делает Wikipedia fetch прямо в UI; старый MapView содержит Directions fetch; активная реализация уже использует directionsService. Hardcode: геометрии, camera snapshots, высоты extrusion, years, release names, scientific status. Смешение статических imports с repository исключает единый источник истины.

В `ExhibitionYearSlider.scheduleChange` таймер 125 ms только очищает ref, а `onChange` вызывается в RAF: это не полноценный debounce данных, хотя repository hook имеет свой debounce. В `CachedHistoricalRepository` обновляемые diagnostics поля перекрываются поздним spread `getHistoricalRepositoryDiagnostics()`; часть метрик может оставаться старой. Это мешает достоверной performance-диагностике.

Документация объёмная, но местами расходится с кодом: старое значение `/map`, диапазон −3000, предыдущие package paths. Нужна документация, привязанная к release/commit, а не накопление взаимоисключающих «готово» отчётов.

## Security

**Подтверждённой критической утечки приватного credential в проверенных tracked файлах не обнаружено.** Выполнен поиск private Mapbox token, private-key markers, Supabase secret prefix и JWT role=service_role без вывода значений. Это pattern scan текущего дерева, не полная проверка git history, облачных секретов и всех dependency advisories.

`.env` существует, исключён из git; tracked `.env*` — только `.env.example`. Mapbox value имеет публичный `pk.` формат. Supabase значения не раскрывались и их production-права не проверялись. Публичный anon/publishable key не является service secret; безопасность зависит от фактических RLS/grants. `configValidator.js` запрещает отдельное поле serviceRoleKey, но принимает любой JWT подходящей формы в anonKey, не проверяя role claim. Ошибочное помещение service-role JWT в `VITE_SUPABASE_ANON_KEY` было бы критической утечкой; текущий scan такой факт не установил. Проверка уже в браузере не предотвращает попадание `VITE_*` в bundle.

XSS: `markerUtils.js` и protected-area Popup используют `escapeHtml` перед setHTML. Небезопасный dangerouslySetInnerHTML в first-party коде не найден. React text escaping не валидирует URL: external source/media/iframe URLs всё равно требуют scheme/origin allowlist, особенно при будущей загрузке из CMS. Для текущих статических source links непосредственная эксплуатация не показана.

`/admin` доступен публично, но представляет текстовую заглушку, а не защищённую административную систему. Надпись «Требуется авторизация» — не authentication. Read/write CMS endpoints, session model, server-side RBAC и audit trail отсутствуют. Local review queue сохраняет статусы в браузере и экспортирует JSON; это не серверное утверждение научного материала.

Геолокация есть в legacy: браузер спрашивает разрешение; при построении маршрута координаты могут отправляться Mapbox Directions. В government profile этот поток нужно локализовать/отключить по продуктовой политике. Публичные diagnostics показывают health/version — сами по себе это не admin bypass, но производственный набор диагностических деталей следует ограничить.

`vercel.json` задаёт CSP, включая self/blob workers, Mapbox/Supabase connect-src и `unpkg.com` script-src. Wikipedia fetch legacy assistant не входит в connect-src: при применении этого CSP запросы будут блокироваться. Это статически установленный конфликт deployment policy и функции; dev E2E без Vercel headers его не обнаружит. Заголовки локального offline server нужно проверять отдельно от Vercel-конфига.

RLS/RPC review выполнен статически: запрет anon writes есть, но политика допускает demo/needs_review, polymorphic refs и source arrays не обеспечивают все связи, security-definer обход требует явных фильтров. Нельзя заявлять production security pass без запуска SQL security suite на реальной изолированной БД. Dependency vulnerability scan через актуальный advisory service отдельно не выполнен; deprecation warnings npm не равны подтверждённым эксплуатируемым CVE.

В read-functions migration явно отозван PUBLIC EXECUTE для `p2a_validate_bbox`, но для основных read RPC приведены только GRANT anon без аналогичного REVOKE PUBLIC. Фактические privileges/default privileges надо проверить отдельно; один GRANT anon не доказывает исключительность этой роли. Поздний `get_p2a_dataset_status` уже содержит явный REVOKE PUBLIC. Это замечание к hardening, не доказанный доступ к приватным данным: публичные предикаты read RPC проверены в коде.

## Critical Problems

| Priority | Проблема | Доказательство / последствие |
|---|---|---|
| P1: блокирует GIS release | Основные URL всегда начинают с SVG | App route flags; нет pan/zoom GIS, географической подложки и DEM |
| P1: научная достоверность | Условные полигоны воспринимаются как проверенные границы | 27 ручных контуров, 20 needs_review; verified современный контур тоже грубый |
| P1: целостность данных | Renderer читает локальные territories/labels независимо от Supabase | Прямые imports в `ExhibitionMap`, fallback и builders; разные источники могут показывать разные версии |
| P1: эксплуатация | Production PostGIS/RLS/parity не подтверждены | Подготовленные SQL ≠ выполненная миграция; старые DB checks blocked |
| P1: автономность | Нет собственных basemap/DEM/routing; неполный offline model path | Legacy cloud URLs; GLB cache не подключён к выдаче |
| P2: renderer | Fallback → WebGL lifecycle зациклен на отсутствии container | mapFailed early return и container guard |
| P2: геометрия | SVG теряет MultiPolygon части и holes | getOuterRing / coordinates[0] |
| P2: продукт | CMS/музеи/разделы выглядят как навигация готовой платформы | SectionPage placeholders |
| P2: release | Несовпадение offline serve package и сборки | rc1 в npm script против stable1 в package-config |
| P2: сопровождение | Два больших MapView и новый 2195-строчный orchestrator | Риск расхождения поведения, тяжёлые изменения и тестирование |
| P2: политика | CSP блокирует Wikipedia helper; публикационные статусы слишком широкие | vercel connect-src / p2a_is_public_record |
| P2: QA/layout/accessibility | Полный E2E не зелёный, три падения исчезли в одиночном повторе | Наблюдались низкий контраст и пустой legacy; route-specific height привязан к старому URL, тест допускает loading вместо конечной карты |

Ни один пункт не исправлялся в рамках этого аудита. Критическая эксплуатируемая security-уязвимость не объявляется без доказательства; перечисленные P1 — прежде всего блокеры заявленного GIS/государственного продукта.

## What Should Be Preserved

Сохранить UI и локализацию, работу с selectedYear, сценарии и source/evidence panels, отделение entities от temporal geometries, явную неопределённость, SVG как fallback, model-viewer для отдельных карточек, error/retry states, worker для geometry difference, repository contract/cache/cancellation, существующие RLS/RPC/seed инструменты и тесты. Сохранить исходные datasets/assets для воспроизводимости, добавив версионирование и происхождение. Публичные маршруты и дизайн менять только как отдельное согласованное развитие.

## What Should Be Rebuilt

Нужно переработать границы ответственностей, а не переписывать весь проект: один temporal snapshot как вход обоих renderers; lifecycle/camera/provider adapter; GIS-canvas для основной карты; источник tiles/DEM; workflow верификации и publication; 3D geospatial layer; надёжный offline delivery; Admin CMS с server-side auth.

Удалять сейчас ничего не нужно. После проверки отсутствия imports/вызовов можно убрать старую `src/MapView.jsx`, недостижимую landing-ветку и дубли helpers. После замены provider убрать Mapbox-specific token/URLs/CSP. Source GLB архивировать вне публичной поставки только после исправления потребителей. Demo данные сохранять в отдельном release/dataset scope, а не стирать вместе с историей проекта.

## Recommended Target Architecture

```text
React UI (существующий дизайн)
  → route + timeline + selection state
  → HistoricalSnapshot contract {year, bbox, version, entities, geometries,
                                 labels, places, routes, evidence, uncertainty}
  → repository adapter
      online: read API / PostGIS published dataset
      offline: тот же versioned data pack
  → map adapter
      MapLibre: local style + vector/raster tiles + glyphs/sprites + DEM
      SVG: тот же snapshot, явно ограниченный fallback
  → optional Three.js custom layer: georeferenced GLB, scale/rotation/elevation/LOD

Editor CMS → authenticated API → review/audit → immutable publication version
Importer → quarantine/license/provenance → validation → expert approval → publication
```

Современные географические данные и исторические реконструкции должны быть разными слоями с собственными источниками и временными правилами. Self-host tiles не должны автоматически добавлять современные дороги/названия в древний период. DEM — отдельная физическая поверхность, а не доказательство древнего рельефа. Routing — отдельный сервис, не часть MapLibre. Для offline важны границы региона/zoom, объём хранилища, обновления, лицензии и целевой hardware.

## Migration Roadmap

План не выполнялся. Оценки рисков относительные. Phase 0 — первый шаг перед любыми реализациями; первая кодовая задача после него — единый snapshot и regression contract, а не замена всех библиотек.

| Phase | Цель и изменение | Файлы / области | Риск | Критерий готовности |
|---|---|---|---|---|
| 0 — Freeze / backup | Зафиксировать commit, lock, assets, dataset, baseline screenshots/tests; inventory DB/export если она есть | release metadata, docs, CI; backup вне production mutations | Потеря актуальных локальных/облачных данных | Восстановление копии проверено; baseline и владельцы утверждены |
| 1 — Architecture cleanup | Один snapshot для SVG/WebGL, выделить lifecycle/camera/data, убрать доказанные дубли | `ExhibitionPage`, `ExhibitionMap`, fallback, `MapView`, hooks, dataAccess | Регрессия UI/сценариев | Те же маршруты/дизайн; оба renderer получают одну версию; существующие tests проходят |
| 2 — Real GIS map | Включаемый GIS-canvas основной карты, zoom/pan/extent, корректные MultiPolygon/holes, географическая привязка | renderer, `mapDataUtils`, layerRegistry, map presets | Ошибочная научная интерпретация подложки | Контрольные координаты/сложные геометрии совпадают; fallback остаётся рабочим |
| 3 — MapLibre | Provider adapter и перенос SDK/API/CSS, lifecycle, camera и layers | package, useMapbox replacement, services, mapHelpers, styles | Различия Mapbox 3 API/style/fog | Feature parity на эталонном наборе и отсутствие runtime Mapbox SDK |
| 4 — Self-hosted tiles | Собственные style/tiles/glyphs/sprites, attribution, version/cache policy | hosting config, map constants, tile service/build scripts | Лицензии, размер и обновления данных | Холодный GIS-start при запрете Mapbox domains, корректные zoom/labels |
| 5 — Terrain | DEM pipeline, encoding, coverage, vertical datum, hillshade, budget | TerrainLayer/new provider, map styles, terrain assets | GPU memory, швы, неверные высоты | Контрольные отметки/стыки и целевые FPS; без cloud DEM |
| 6 — Historical layers | Верификация границ, routes/water/places; provenance/claims/precision и публикационные правила | exhibition data, import scripts, science validators, schema | Главный риск — научные данные и права | У каждого опубликованного слоя период, источник геометрии, reviewer и версия; demo отделено |
| 7 — Timeline | Общая temporal policy для всех слоёв, пробелы, BCE/CE, availability по слоям | year model, registry, slider, snapshot queries | Неверные переходы и ложное exact | Нет year zero; interval boundaries и unknown покрыты тестами; URL воспроизводит состояние |
| 8 — 3D models | GLB custom layer на координатах; metadata scale/axes/heading/elevation, LOD | новые renderer adapters, `threeDModels`, scripts/3d | Несовместимость shared WebGL, память/права | Модель стоит на измеренной точке, корректна на terrain, disposal/context loss проверены |
| 9 — PostGIS | Fresh migrations/seed/parity, versioned read API, spatial/time indexes | supabase migrations/tests, seed, repositories, DB scripts | Потеря данных, slow queries, grants | Реальные RLS/RPC/idempotency/restore/load tests проходят; renderer не обходит repository |
| 10 — Admin CMS | Auth/RBAC, draft/review/publish, media/license validation, audit log | `/admin`, backend/CMS API, новые policies | Несанкционированная публикация/загрузка | Server-side permission tests, reviewer workflow и rollback публикации работают |
| 11 — Offline government deployment | Полный локальный пакет tiles/DEM/data/models/fonts, локальный HTTP, updates/rollback | Vite PWA, package/serve scripts, cache handlers, deployment config | Объём, cold cache, права и устройство | Чистый ПК, нет uplink, все заявленные сценарии и restart работают; внешний traffic = 0 |
| 12 — Security / load testing | CSP/URL controls, supply-chain scan, auth tests, DB load, GPU/soak/accessibility | CI, e2e, security SQL, monitoring/config | Ложная уверенность от mocks | Измеренный target budget/SLO, независимый review, нет release blockers |
| 13 — Production | Staged rollout, подписанная/контролируемая версия, monitoring и операционный runbook | release pipelines/docs/hosting | Несогласованность данных и кода | Приёмка GIS/историка/безопасности/оператора, проверенный rollback, явное решение о выпуске |

Научная верификация и проектирование DB-контракта должны сопровождать ранние фазы, хотя внедрение PostGIS обозначено Phase 9. Нельзя ждать последней фазы, чтобы обнаружить, что геометрии не имеют подтверждённых источников.

## Final CTO Assessment

Это работающий образовательный прототип с развитой презентационной оболочкой и частично реализованной GIS/backend-инфраструктурой. Это ещё не полноценный национальный исторический GIS и не готовая государственная автономная система.

Реально работают локальный исторический интерфейс, timeline и навигация по эпохам, карточки/источники, SVG-слои и сценарии, каталог, отдельная GLB-панель, сборка и unit-проверки. Настоящий Mapbox renderer в legacy существует. Но полнота контента, научная точность, server-side editorial workflow и эксплуатационная готовность существенно отстают от объёма UI.

Demo-поведение: грубые территории, условный terrain, художественная extrusion, учебный archive overlay, небольшой stories/people/events pack, local review без серверной публикации. Нельзя использовать это как источник точных государственных границ, кадастр, научно подтверждённые измерения территории или production CMS.

Сильные инженерные заготовки — temporal/evidence model, fallback, repository boundary, проверочные скрипты, локальная 3D-оптимизация. Слабые стороны — нарушение этой boundary прямыми imports, масштабные stateful компоненты, несогласованные схемы/документация, ограниченные данные и неподтверждённая эксплуатация БД/offline.

Сложность доведения до полноценной Historical Map of Kazakhstan высокая: потребуются GIS, историческая редакция, backend, data licensing и QA, а не только frontend-разработчик. Уход от Mapbox Cloud реалистичен и по интерфейсу управляем; основной объём — собственные данные/tiles/DEM/routing и проверка эквивалентного поведения. Календарную оценку без целевого покрытия, zoom, hardware, нагрузки и состава команды давать было бы недостоверно.

| Готовность к целевому продукту | Оценка | Основание |
|---|---:|---|
| Real GIS | 3/10 | Legacy engine есть, главная карта — SVG, verified national layers отсутствуют |
| 3D | 3/10 | Viewer/оптимизированный asset есть, geospatial placement нет |
| PostGIS | 4/10 | Серьёзная схема/RPC/repository, но runtime/security/parity не аттестованы |
| Offline | 5/10 | Локальная демонстрация и shell есть, полный GIS/media cold start не гарантирован |
| Government deployment | 2/10 | Нет подтверждённых данных, автономной инфраструктуры, CMS и эксплуатационной приёмки |

Рекомендуемый первый implementation step после freeze: **единый versioned HistoricalSnapshot для SVG и WebGL с regression tests текущих маршрутов, затем корректный GIS renderer на том же контракте**. Смена движка до этого закрепит нынешние расхождения. После аудита функциональные изменения не выполнялись.
