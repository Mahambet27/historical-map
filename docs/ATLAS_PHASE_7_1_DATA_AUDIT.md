# Atlas Phase 7.1 — аудит локальных routes/events

## Результат

Новых записей, одновременно удовлетворяющих требованиям review, периода,
источников и геометрии, не найдено. Подключено: **0 маршрутов, 0 событий**.
Слои остаются пустыми по данным; существующие сообщения Atlas об отсутствии
проверенной геометрии сохранены. Код приложения и исторические данные не изменены.

Аудит касается файлов проекта. Статусы ниже прочитаны из локальных записей;
новая внешняя историческая экспертиза, импорт и повышение статусов не выполнялись.

## Проверенные наборы

| Набор | Результат | Решение |
| --- | --- | --- |
| `src/data/exhibition/historicalRoutes.js` | 2 маршрута, оба `needs_review`; собственной геометрии нет | Не допускать |
| `src/data/exhibition/routeSegments.js` | 4 LineString-сегмента, все `needs_review`, confidence `low` | Не допускать геометрию без review |
| `src/data/exhibition/events.js` | 6 событий с периодами и sourceIds; нет verificationStatus и собственной геометрии | Не допускать |
| `src/data/exhibition/sourceClaims.js` | Дата независимости 1991 года `verified`; направление Шёлкового пути `needs_review` | Достоверность даты не переносить на местоположение |
| `src/data/exhibition/sources.js` | 9 источников: 7 `reviewed`, 2 `verified`; ссылки событий/маршрутов разрешаются в реестр | Статус источника не подтверждает любую связанную геометрию |
| `supabase/seed/p2a_seed_data.json` | Те же 2 маршрута, 4 сегмента и 6 событий; все `needs_review`; геометрии событий нет | Это производная копия, не независимый reviewed-набор |
| `review-packages/qazaq-heritage-scientific-review/routes.geojson` | Те же 4 сегмента; `needs_review`, `scientific_review_required`, `schematic` | GIS-экспорт не является одобрением геометрии |
| `review-packages/qazaq-heritage-scientific-review/review-checklist.csv` | Для проверенных routes/events поля решений историка и картографа пусты | Отдельного одобрения пространственных записей нет |
| `src/data/imported/{staging,normalized,rejected}` | Только README, записей для подключения нет | Нечего подключать |
| `reports/open-data-import-summary.json` | `imported = 0`, `accepted = 0` | Подтверждённых импортов нет |
| `data-sources/open-data-sources.json` | Реестр потенциальных источников, не одобренный географический набор | Не заменяет импорт и review |
| `docs/database/minimal_seed.sql`, `seed.example.md` | Seed мест и иллюстративный пример; нет одобренных routes/events | Не использовать точки мест как геометрию событий |
| `src/data/exhibition/historicalChanges.js` | Есть reviewed/verified описания изменений и ссылки на события; нет собственных геометрий этих событий | Не превращать контур государства или ссылку на город в точку события |

Другие локальные географические наборы (`places`, `settlements`,
`entityGeometries`, границы и контуры) описывают места и территории, а не
подтверждённые маршруты или местоположения событий. Release-пакеты содержат
сборки/манифесты, а не дополнительный reviewed-набор routes/events.
Локальная UI-очередь review хранит заметки отдельно и не повышает статус
исходных записей.

## Маршруты и пространственное evidence

- `silk-road-southern-kazakhstan`: период −200…1500, источники
  `unesco-silk-roads`, `cambridge-kazakh-history`, статус `needs_review`.
- `silk-sayram-taraz`, `silk-taraz-otrar`, `silk-otrar-turkistan`,
  `silk-turkistan-syganak`: период 700…1500, существующие LineString,
  источник `unesco-silk-roads`, статус `needs_review`.
- `claim-silk-road-direction`: `educational_reconstruction`, `needs_review`;
  примечание источника в проекте прямо описывает обобщённое направление между
  городами, а не записанный точный трек.
- `nomadic-seasonal-cycle-demo`: демонстрационный цикл, без источников,
  сегментов и геометрии. Не исторический маршрут, готовый к публикации.

Наличие корректного GeoJSON или reviewed-записи источника само по себе не
доказывает достоверность линии. Координаты сегментов сохранены без изменений,
но в Atlas не допущены.

## События

| ID | Период | Источники в проекте | Недостающие данные |
| --- | --- | --- | --- |
| `saka-archaeological-record` | −550…−300 | `britannica-kazakhstan-history` | Review и геометрия события |
| `formation-turkic-khaganate` | 552 | `britannica-turkic-peoples` | Review и геометрия события |
| `formation-kazakh-khanate` | 1465…1466 | `e-history-kazakh-khanate`, `cambridge-kazakh-history` | Review и геометрия события |
| `kasym-khan-consolidation` | 1511…1521 | `e-history-kasym`, `cambridge-kazakh-history` | Review и геометрия события |
| `kazakh-ssr-status` | 1936 | `britannica-kazakhstan-history` | Review и геометрия события |
| `independence-kazakhstan` | 1991 | `adilet-independence-law`, `un-kazakhstan` | Геометрия события и review пространственного утверждения |

`claim-independence-1991` подтверждает в локальном наборе дату 16 декабря
1991 года (`event_date`, `verified`, `official_document`), но не содержит
координат. `placeIds: ["almaty"]` не является подтверждённой точкой принятия
акта. Поэтому координаты Алматы, центроиды и точки территориальных подписей
не используются для создания геометрии этого события.

## Что необходимо для наполнения

1. Для маршрута — уже проверенная линия и доказательная связь источника с
   её геометрией/периодом; review как маршрута, так и используемых сегментов.
2. Для события — датировка, source/evidence и существующая пространственная
   запись именно этого события с подходящим review-статусом. Географическая
   область не должна автоматически превращаться в выдуманный точечный маркер.
3. Отдельная содержательная экспертиза должна предшествовать изменению
   `needs_review` на `reviewed`/`verified`. В этом аудите такие изменения не сделаны.

**Fake coordinates: NO.** UI, MapLibre, terrain, timeline, confidence/review
правила и 3D не изменялись. Commit/push не выполнялись.

## Итог проверок

- Профильные unit tests: **PASS**, 14/14 (`atlasHistoricalOverlays.test.js`,
  `atlasHistoricalGeometry.test.js`).
- `npm run build`: запуск выполнен, но итоговый код завершения предыдущей
  инструментальной сессии недоступен. Артефакты созданы; **PASS не подтверждён**.
- Atlas E2E, Chromium, один worker, существующие self-hosted/terrain настройки:
  **FAIL** — 10 passed, 1 skipped, 1 failed. Desktop-сценарий достиг лимита
  60 секунд в `AxeBuilder.analyze()` (`e2e/atlas.spec.js:81`). Assertions и
  тайм-ауты не изменялись. Другие сценарии текущего прогона прошли.
- `git diff --check`: **PASS**.

Итог: **ATLAS PHASE 7.1 PARTIAL**. Повторные длительные прогоны после просьбы
завершить работу не запускаются; неподтверждённые результаты не отмечены PASS.
