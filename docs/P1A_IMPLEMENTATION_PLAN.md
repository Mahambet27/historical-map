# P1A — Historical Change, Period Comparison and Educational Story

Дата аудита: 29 июля 2026  
Область: только Exhibition P1A. P0/P0.5, `/map`, backend, SQL и исторические
геометрии не заменяются.

## Текущее состояние

### Выбор года и snapshot

- `ExhibitionPage` хранит `selectedYear` отдельно от `activeSnapshot`.
- `resolveYearSelection()` ограничивает год диапазоном `-3000…2026`, выбирает
  эпоху через `getEraAtYear()` и snapshot через
  `getHistoricalSnapshotAtYear()`.
- Точный год пользователя не заменяется годом snapshot. Snapshot предоставляет
  только курированный текст, камеру и связанные объекты.
- Внутри периода выбирается содержащий год snapshot; между периодами —
  последний предшествующий.

### Выбор геометрии

- `getGeometriesAtYear()` фильтрует записи по `validFromYear/validToYear`.
- `ExhibitionMap` собирает GeoJSON через `buildTerritoryCollection()` и
  обновляет существующий source в одном animation frame.
- Выбор сущности реализован через Mapbox `feature-state`; смена темы не вызывает
  `setStyle`.
- SVG fallback использует тот же временной набор геометрий.
- Исторические контуры уже помечены как `reconstruction`, имеют confidence и
  verification status.

### Comparison

- `ExhibitionComparePanel` выбирает два года только из шести snapshots.
- Карта добавляет геометрии второго года в тот же source с отдельным цветом.
- Есть простая легенда A/B/overlap, но overlap фактически не вычисляется.
- Нет modes, геометрической разницы, worker, кеша, error fallback или
  технической telemetry.

### Экскурсия и lesson

- Существующая экскурсия проходит шесть timeline snapshots с таймером
  `TOUR_STEP_MS`, pause/play, speed и очисткой timeout.
- При скрытии вкладки экскурсия останавливается.
- `ExhibitionStoryPanel` показывает текущий snapshot; отдельной
  образовательной story model нет.
- Grade 7 lesson содержит три открытых вопроса и локальные session answers.
  Он остаётся fallback и не заменяется до проверки нового player.

### Локальный агент

- `HistoricalAgent` работает без AI/API и выбирает только записи
  `exhibitionAnswerPack`.
- Actions изменяют год, выбирают сущность, открывают comparison, sources или
  lesson.
- Новые P1A-команды можно добавить расширением текущего allow-list:
  `SHOW_CHANGE`, `START_STORY`, `OPEN_COMPARISON`.

## Данные, пригодные для повторного использования

- 1465 и 1511: snapshots, две версии геометрии Казахского ханства, события
  `formation-kazakh-khanate` и `kasym-khan-consolidation`, личности Керей,
  Жанибек и Касым, места Chu Valley/Saraishyk/Turkistan.
- 1511 и 1521: одна курированная временная тема правления Касыма и две
  последовательно валидные реконструкции.
- 1936 и 1991: сущности Казахской ССР и Республики Казахстан, событие
  независимости и официальный Конституционный закон.
- Источники: e-history по образованию ханства и Касыму, Cambridge History,
  Britannica, официальный Adilet и United Nations.

## Граница исторической достоверности

- Геометрическая `intersection/difference/union` — визуальный расчёт над
  демонстрационными реконструкциями, а не историческое доказательство.
- Нельзя автоматически выводить направление расширения, причины конфликтов,
  политические оценки или точные границы.
- Для 1511→1521 существующие данные подтверждают период правления и укрепления,
  но не дают достаточной основы для подробной новой причинной цепочки. Узкие
  интерпретации маркируются `needs_review`.
- Для 1936→1991 официальный источник подтверждает закон о независимости;
  более широкие причинные объяснения требуют Britannica/Cambridge либо статуса
  `needs_review`.
- Контекстные политические сущности и их полигоны уже имеют `needs_review` и не
  должны повышаться до reviewed в P1A.

## Реализация без backend

1. Добавить immutable curated dataset `historicalChanges.js` и чистые функции
   поиска/обратного отображения.
2. Показать ненавязчивый prompt только при переходе между curated endpoints.
3. Добавить lazy `HistoricalChangePanel` с фактами, интерпретациями,
   confidence, review status и source context.
4. Расширить comparison modes `overlay/changes`; Turf загружать внутри
   module worker только при запросе change-mode.
5. Кешировать worker result по `fromYear:toYear:entityId`, завершать worker при
   закрытии панели, а при ошибке сохранять исходные полигоны.
6. Добавить локальную story data/state machine и lazy player. Player управляет
   годом, камерой, сущностями, comparison/change panel и source context, но не
   загружает 3D.
7. Хранить ответы только в React state текущей сессии; telemetry содержит
   question id/correctness, но не текст ответа.
8. Расширить существующий агент и diagnostics, не создавая нового агента и не
   добавляя Supabase/SQL.

## План проверки

- Unit: change selection/reverse/fallback, source integrity, prompt policy,
  story schema/timers/visibility/questions, comparison cache/error и agent
  actions.
- E2E: significant transition → prompt → change → sources → comparison modes;
  story navigation/question; mobile/reduced-motion/offline; `/map` и diagnostics.
- Release: lint, Vitest, Chromium Playwright, production build,
  `git diff --check`, bundle/worker/Turf/precache measurements.

