# Architecture Phase 1 — HistoricalSnapshot for the main SVG

Дата: 2026-09-28. Ветка: `architecture/unified-historical-snapshot`.
Base commit: `bf7c2f9` (`docs: add full technical audit`).
Статус: реализация выполнена в working tree, без commit/push.

## Реальный data flow

Основные `/`, `/map`, `/exhibition` и `/demo` используют выставочную страницу и fallback-ветку `ExhibitionMap`. Изменён именно `src/features/exhibition/ExhibitionMapFallback.jsx`, не legacy-карта.

Раньше fallback самостоятельно обращался к `getFallbackEntitiesAtYear`, `getEntityLabelsAtYear` и каталогу `allHistoricalEntities`; дополнительные слои получал через `p1bData` и temporal GeoJSON builders.

Теперь:

```text
entityGeometries + entities + labels + eraRegistry + events + people
                           + существующий p1bData из ExhibitionMap
    → buildExhibitionSnapshot(year, p1bData) — feature boundary
    → buildHistoricalSnapshot({year, datasetVersion, data, metadata}) — domain
    → createFallbackViewModel(snapshot, presentationOptions)
    → прежняя SVG-разметка ExhibitionMapFallback
```

Сравнение двух лет также строит два независимых snapshot. Результат существующего geometry-difference worker остаётся готовым overlay; его вычисления и данные не менялись. Archive image и условный terrain path — прежние presentation-элементы.

## Реализованные файлы

| Файл | Изменение |
|---|---|
| `src/domain/history/historicalSnapshot.js` | JSDoc-контракт, schemaVersion=1, temporal predicate, проверка года |
| `src/domain/history/buildHistoricalSnapshot.js` | Чистый builder, фильтрация и отделённая копия source records |
| `src/domain/history/historicalSnapshot.test.js` | Контракт, интервалы/aliases/BCE, сохранность, immutability, determinism |
| `src/features/exhibition/exhibitionSnapshot.js` | Сбор существующих источников и SVG view model |
| `src/features/exhibition/exhibitionSnapshot.test.js` | Parity с прежними слоями на существующих данных и границах периодов |
| `src/features/exhibition/ExhibitionMapFallback.jsx` | Основной SVG переведён на snapshot, JSX-разметка не менялась |
| `docs/ARCHITECTURE_PHASE1_REPORT.md` | Этот отчёт |

Всего 7 файлов: 1 изменённый tracked + 6 новых untracked. Новые файлы намеренно не staged; обычные `git diff --stat` и `git diff --name-only` показывают только tracked изменение. Все новые файлы видны в `git status --untracked-files=all`. Непустой tracked diff есть.

## Контракт и временная семантика

Обязательные поля: `schemaVersion`, `datasetVersion`, `year`, `era`, `territories`, `borders`, `places`, `events`, `people`, `metadata`.

Дополнительные поля для уже существующих слоёв: `entities`, `labels`, `environment`, `hydrology`, `routes`, `routeSegments`. `entities` — справочник для разрешения ID, а не утверждение существования всех entities в выбранном году. `era` содержит исходную запись реестра или null в пробеле покрытия. `datasetVersion` обязателен и передаётся источником; текущий локальный адаптер использует существующий `LOCAL_DATASET_VERSION`. Supabase publication version этим этапом не унифицируется: дополнительный `p1bData` остаётся предоставленным feature-слоем, что отмечено metadata.

Territories сохраняют исходные geometry records целиком. Borders в локальном адаптере — те же существующие Polygon records, контуры которых SVG уже обводил stroke. Новые линии/границы, координаты, факты или реконструкции не генерируются. Geometry, sourceIds, evidence, confidence и другие вложенные поля сохраняются без переименования или проекции.

Интервалы включительные. Поддержанные aliases, в порядке приоритета:

- начало: `validFromYear`, `validFrom`, `yearFrom`, `fromYear`, `startYear`, `periodStart`, `birthYear`;
- конец: `validToYear`, `validTo`, `yearTo`, `toYear`, `endYear`, `periodEnd`, `deathYear`.

Используется первое определённое поле; явный null означает открытую границу. Отсутствующие даты не выдумываются: undated records остаются доступными. Если нет interval aliases, поле `year` означает точное совпадение года. Контракт рассчитан на числовые исторические годы, а не ISO date strings. Отрицательные BCE сохраняются. Нулевой, дробный, бесконечный или нечисловой входной year отклоняется.

Domain не импортирует React, DOM, Mapbox, SVG, локальные datasets или UI policy. Builder не выполняет I/O, не использует clock/random и не мутирует вход. `structuredClone` отделяет вложенные геометрии и metadata результата от input. Порядок записей сохраняется, поэтому одинаковый input даёт одинаковый output.

View model оставляет существующие GeoJSON builders и их совместимые дополнительные выборки (локализованное имя, последний применимый hydrology snapshot, route grouping). Они получают только temporal records snapshot. Это сохраняет старое поведение без изменений общих helpers, которыми пользуются другие ветки. Official-demo policy, порядок выбранной территории, цвета и отображение неопределённости остаются presentation-правилами.

## Проверки после изменений

| Команда / проверка | Результат |
|---|---|
| `npm.cmd run lint` | PASS, exit 0 |
| `npm.cmd run test -- --run --maxWorkers=2` | PASS: 23 файла, 323 теста, 61.94 s |
| `npm.cmd run build` | PASS, exit 0; Vite build 11.68 s, PWA сгенерирован |
| `npm.cmd run 3d` | Exit 1: в package.json нет script `3d` |
| `npm.cmd run 3d:budget` | PASS: GLB 1 365 176 B / лимит 15 MiB, poster 45 282 B / 250 KiB |
| `npm.cmd run 3d:audit` | PASS: 7 существующих GLB; assets не менялись |
| Дополнительная проверка полного SVG/legend markup | PASS: точное равенство `renderToStaticMarkup` до/после на 432 сценариях |

Использован `npm.cmd`, поскольку PowerShell блокирует npm.ps1. Для `npm run test` передан `--run`, чтобы существующий Vitest script завершился после проверки вместо watch mode. Скрипт `3d` не добавлялся ради формального успеха: проверены существующие команды проекта. Build сохранил прежние предупреждения о Browserslist и смешанных static/dynamic imports.

Постоянные тесты проверяют создание, schemaVersion/year, BCE, before/inside/after interval, включительные края, все aliases, open bounds, точечный year, era gaps, все temporal collections, сохранение geometry/evidence/source/confidence, отсутствие input mutation и детерминированность. Adapter parity проверяет реальные temporal boundaries, RU/KK/EN, обычный и official-demo режимы, порядок территорий, labels, environment, water, places и routes, а также отсутствие непереданных optional layers.

Для дополнительного markup-сравнения исходный fallback получен через `git show HEAD:src/features/exhibition/ExhibitionMapFallback.jsx`. Временные baseline-component и test сравнили 9 годов × 3 языка × 2 official режима × 2 состояния загрузки слоёв × 2 режима comparison × 2 quality режима = 432 сценария, включая archive overlay. Полная SVG/legend-разметка совпала байт-в-байт. После проверки оба временных файла удалены; старая реализация не оставлена дублем. Лог: системный TEMP, `phase1-markup.log`.

Это проверка эквивалентности разметки, не новый screenshot/GPU benchmark. CSS, JSX renderer, routes, legacy `/legacy-map`, timeline UI, исторические datasets, models, package.json и lockfile не менялись. Полный browser E2E в этом этапе не запускался; старые результаты аудита не выдаются за текущую регрессию. WebGL branch пока не переведена на snapshot, согласно текущему ограниченному заданию.

## Итог

HistoricalSnapshot и чистый builder реализованы. Основной SVG использует новый data flow, включая comparison snapshots. Функциональных/визуальных расхождений в проверенных слоях и 432 render-сценариях не обнаружено. Новых dependencies нет; MapLibre не добавлен, Mapbox и SVG сохранены. Следующий этап может подключить WebGL к тому же контракту отдельно, без изменений legacy в этой фазе.
