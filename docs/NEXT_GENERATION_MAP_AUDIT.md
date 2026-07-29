# Next Generation Map — технический аудит

Дата аудита: 29 июля 2026  
Область: текущий `main`-workspace с незакоммиченным развитием `/exhibition`.

## Резюме

Текущая выставочная карта уже имеет правильную основу для P0: отдельный lazy-loaded
маршрут, локальный проверяемый набор исторических данных, SVG fallback, точный год,
отдельный выбор эпохи, feature-state для hover и очистку Mapbox-инстанса при unmount.
P0 следует закрыть без добавления новых исторических слоёв, AI-агентов и миграций БД:
централизовать темы, состояния панелей и quality modes, убрать `setData` из сценария
простого выбора, добавить безопасное переключение paint/layout, диагностику и
неперсональную performance-телеметрию.

## 1. Архитектура

### Маршруты и code splitting

- `/exhibition` подключается отдельно через `React.lazy` в `src/app/App.jsx`.
- `ExhibitionMap`, `HistoricalAgent` и `ExhibitionThreeD` дополнительно загружаются
  лениво.
- Основная `/map` всё ещё является адаптером над
  `src/components/map/MapView.jsx`; параллельно в корне остаётся более крупный
  `src/MapView.jsx`, который текущим маршрутом не импортируется.
- Логика `/exhibition` сосредоточена в `ExhibitionPage.jsx` (362 строки) и
  `ExhibitionMap.jsx` (278 строк). Это допустимо для P0, но дальнейшие P1–P3
  функции должны подключаться через отдельные реестры/хуки, а не расширять эти
  компоненты бесконечно.

### Данные

- Исторические сущности, геометрии, подписи, события, персоны, источники, места,
  уроки и timeline хранятся в `src/data/exhibition`.
- Геометрии небольшие и встроены в JS; крупных GeoJSON именно в exhibition-пакете
  не обнаружено.
- `historicalEntitiesService` проверяет наличие опубликованных remote entities,
  но намеренно возвращает целиком локальный атомарный набор, пока все связанные
  таблицы не публикуются одной версией. Это безопасное поведение для выставки.
- Цвета сущностей заданы в данных, но отдельного детерминированного style registry
  со стилями default/hover/selected/label/pattern пока нет.

### Mapbox sources/layers

Выставочная карта создаёт три источника:

1. `ex-territories` — fill, fill-extrusion и line;
2. `ex-places` — circle и symbol;
3. `ex-entity-label-points` — symbol.

Базовые Mapbox symbol-слои скрываются после каждого `style.load`. Hover использует
`setFeatureState`, но selected-состояние записано в properties, поэтому выбор
сущности сейчас приводит к полной пересборке коллекции и трём `setData`.

## 2. Bottlenecks и риски производительности

### Подтверждённые

- Эффект обновления карты зависит одновременно от года, snapshot, era, языка,
  сравнения, reduced motion, selected entity, style revision и quality. Даже
  изменение selected entity повторно строит территории, подписи и места.
- Камера вызывается тем же эффектом, поэтому несвязанные изменения могут повторно
  запускать `easeTo`.
- `src/styles/global.css` имеет около 64,9 КБ и содержит стили всей платформы и
  выставки в одном initial CSS.
- Последняя доступная production-сборка содержит:
  - `mapbox-gl` ~1 679 КБ raw;
  - legacy `MapView` ~255 КБ raw;
  - `ExhibitionPage` ~63 КБ raw;
  - `ExhibitionMap` ~12,9 КБ raw;
  - `places` ~81 КБ raw.
- В `public/models` шесть GLB-файлов размером примерно 7–15,9 МБ каждый
  (суммарно более 81 МБ). Они не входят в precache, что правильно для старта, но
  означает, что 3D нельзя считать гарантированно offline.

### Потенциальные

- Частая смена года может создавать очередь `easeTo`; при scrub следует либо
  останавливать предыдущий переход, либо использовать `jumpTo` в light/reduced
  mode.
- Нельзя применять тему через `map.setStyle`: это пересоздаст sources/layers и
  увеличит вероятность гонок. P0 должен менять только CSS variables и существующие
  paint/layout properties.
- Для будущих крупных GeoJSON потребуется отдельная стратегия тайлов/упрощения.
  В текущем exhibition-пакете эта оптимизация преждевременна.

## 3. Таймеры, listeners и утечки

- Tour timeout очищается при изменении зависимостей и unmount.
- Kiosk warning/reset timeouts и глобальные pointer/keyboard/touch listeners
  очищаются.
- Mapbox instance удаляется через `map.remove()`, что снимает его listeners и
  освобождает WebGL context.
- Hover feature-state сбрасывается при mouseleave.
- Подтверждённых утечек в `/exhibition` не найдено.
- Загрузчики `model-viewer` сохраняют глобальный script (намеренно для повторного
  использования). Promise-listeners одноразовые, но ошибки CDN означают, что 3D
  зависит от сети даже при наличии локальных GLB.
- В legacy-карте есть несколько timers, route animation frames и marker listeners.
  У неё существуют cleanup-хуки, но две параллельные реализации `MapView`
  увеличивают риск расхождения исправлений. Их консолидация — отдельная работа,
  не блокирующая P0 exhibition.

## 4. Supabase и SQL

- `docs/database/historical_platform_schema.sql` уже описывает entities,
  translations, sources, temporal PostGIS geometries, events, people, relations,
  media, lessons, questions, progress, reviews и source links.
- Для основных публичных исторических таблиц включён RLS и добавлены read-only
  published policies.
- Runtime пока читает remote только как probe и не смешивает частичный remote
  пакет с локальным.
- SQL не содержит моделей P3-агентов, expert feedback/approval, prompt versions и
  agent runs. Добавлять их в P0 нельзя; сначала нужен отдельный review миграции,
  индексов, retention и RLS.
- `schema.sql` и `historical_platform_schema.sql` описывают разные поколения
  модели (heritage places и historical platform). До миграции нужен единый
  порядок применения и idempotent DDL.

## 5. PWA/offline

- Service worker использует prompt update, очищает старые caches и precache-ит
  HTML/JS/CSS/SVG/webmanifest до 500 КБ на файл.
- `mapbox-gl`, legacy MapView, изображения, модели и stats намеренно исключены.
- Локальные JSON обслуживаются через `NetworkFirst` с таймаутом 4 секунды.
- `/exhibition` сохраняет контент, timeline и SVG fallback без Mapbox token/сети.
- Риск: формулировка «offline 3D» неверна, пока `model-viewer` загружается с CDN.
- Риск: изменение схемы runtime cache должно сопровождаться новым cache name;
  сейчас используется фиксированный `qhm-json-v1`.

## 6. UI, темы, панели и доступность

- Сейчас есть одна тёмная визуальная система и ручной high-contrast флаг.
- Выбор темы эпохи, режим карты и сохранение настройки отсутствуют.
- Панель представлена `string | null`; состояния
  `closed/compact/expanded` отсутствуют.
- Клавиатурные shortcuts для timeline/panels отсутствуют.
- Есть reduced-motion CSS и runtime camera fallback, language switch,
  aria-live года и SVG fallback.
- Переводы RU/KK/EN присутствуют. Терминальные read-outs в Windows показывают
  mojibake из-за декодирования консоли; это не следует исправлять массовой
  перекодировкой без отдельной проверки файлов в браузере.

## 7. Тесты

- Есть Vitest для year/era model, political geometry/style utilities и quality
  profile основной карты.
- Есть Playwright-сценарий `/exhibition`, проверяющий старт, пять эпох, точный год,
  disclaimer и sources panel.
- Нет unit-тестов выбора темы, полноты style registry, panel state model,
  exhibition quality auto-detection и keyboard shortcuts.
- Нет diagnostics-route smoke test и проверки, что selection не вызывает
  `setData`.

## 8. План по приоритетам

### P0 — выполнено в текущем цикле

1. Централизованные era themes, map palettes и entity style registry.
2. Смена темы без `setStyle`, через CSS variables и `setPaintProperty`.
3. Состояния panel `closed/compact/expanded` и базовые shortcuts.
4. Режимы `auto/high/light` с local persistence и детекцией ограничений.
5. Разделение обновлений source, camera, theme и feature-state selection.
6. Неперсональная telemetry: map init, first interactive, first timeline update,
   source update duration, fallback usage и приблизительный FPS.
7. `/exhibition/diagnostics` с проверками Mapbox config/WebGL, Supabase config,
   PWA/offline capabilities, local data и 3D prerequisites.
8. Unit/e2e regression tests, lint и production build.

### P1 — не входит в текущую реализацию

- Natural Earth political context, физическая география, климат/экология,
  curated routes, демография, экономика и archaeology.
- Перед началом нужны source licensing review, layer registry, zoom thresholds,
  quality budgets и стратегия versioned offline data.

### P2 — не входит в текущую реализацию

- AI-Agent Platform с orchestrator и специализированными агентами.
- Перед началом нужны контракт ответа, source/confidence policy, redaction,
  rate limits, streaming protocol, prompt/version storage и безопасные map actions.

### P3 — не входит в текущую реализацию

- Lessons/quizzes, progress, achievements и expert-review workflow.
- Перед началом нужны auth/roles, RLS матрица, audit log, retention, moderation,
  idempotent migration и rollback plan.

## 9. Критерий закрытия P0

P0 закрыт: темы и quality modes детерминированы и протестированы,
панели имеют явную state model, selection работает через feature-state,
theme switch не пересоздаёт Mapbox style, diagnostics доступны отдельным маршрутом,
fallback остаётся рабочим, а lint, unit tests, Chromium e2e и production build
проходят без регрессий.
