# P2A.8 — аудит official demo release

Дата аудита: 1 августа 2026 года  
Область: локальный репозиторий после P2A.7. Исторические данные, геометрии,
источники, claims и verification statuses во время аудита не изменялись.

## 1. Текущий production build

`npm run build` запускает Vite 7. Production build включает React-приложение,
разделённые chunks Mapbox, model-viewer и Supabase, а также PWA через
`vite-plugin-pwa`. Workbox создаёт `sw.js`, удаляет устаревшие caches и
precache-ит HTML, JS, CSS, SVG и webmanifest. JSON обслуживается стратегией
NetworkFirst с timeout 4 секунды. Модели, изображения, Mapbox, Supabase и
крупные chunks исключены из precache.

Vercel использует SPA rewrite на `index.html`, immutable cache для `/assets`
и `/models`, security headers и report-only CSP. Автоматического deployment
script в проекте нет. CI выполняет format, lint, unit, build и Chromium E2E.

## 2. Обязательные assets official demo

- `index.html`, hashed application JS/CSS и `sw.js`;
- `manifest.webmanifest`, `offline.html`, иконки;
- `exhibition-release.json` и `exhibition-preflight.json`;
- локальные P2A datasets, которые входят в application chunks;
- neutral historical basemap policy и SVG fallback;
- official story `formation-and-consolidation-kazakh-khanate`;
- poster `/models/exhibition/posters/bory-tastagan.webp` — 45,282 bytes;
- production model `/models/exhibition/bory-tastagan.glb` — 1,365,176 bytes;
- локальный Meshopt decoder;
- RU/KZ/EN translations.

Fatal startup допустим только при отсутствии application bundle либо
локального dataset. Отсутствие Mapbox, WebGL, service worker или GLB должно
давать degraded mode, но не блокировать карту.

## 3. Assets и функции, требующие сети

При наличии public Mapbox token `ExhibitionMap` загружает Mapbox GL runtime и
может обращаться к Mapbox API/tiles. Neutral style не содержит modern
Mapbox sources, поэтому labels, roads, buildings и administrative geography
не запрашиваются. `/map` отдельно использует Mapbox styles, terrain и
Directions API; его поведение не относится к official demo.

Режим data source `auto` может выполнить Supabase health request перед
локальным fallback. External source links открываются только действием
пользователя. CDN runtime для Exhibition не требуется.

## 4. Уже доступное offline-поведение

Historical entities, geometries, routes, places, stories, evidence,
hydrology, rivers и SVG fallback локальны. Poster, production GLB,
model-viewer dependency и Meshopt decoder локальны. PWA shell и prompt
обновления реализованы. Offline после предварительной загрузки уже покрыт
E2E, но отдельного воспроизводимого Windows package и integrity verification
нет.

## 5. Оставшиеся Mapbox-запросы

В `/exhibition` Mapbox создаётся только при валидном public token и отсутствии
forced SVG fallback. Ошибка переключает presentation на fallback. До P2A.8
нет отдельного offline build flag, короткого network policy timeout и
явного запрета повторных попыток на уровне release channel. `/map` сохраняет
собственные Mapbox tiles, terrain и Directions requests без изменений.

## 6. 3D assets

Production registry использует один оптимизированный
`bory-tastagan.glb` размером около 1.30 MiB и poster WebP. Model-viewer
загружается лениво только после действия пользователя. В `public/models/source`
находятся шесть исходных моделей суммарно более 80 MiB. Обычный Vite build
копирует их в `dist`, поэтому offline package обязан применять allowlist и
исключать `models/source`.

## 7. Поведение без интернета

Без Mapbox token приложение сразу использует SVG. При сетевой ошибке Mapbox
имеется runtime fallback. Repository `auto` после неудачного Supabase health
переходит на local. Эти гарантии пока распределены между компонентами и не
объединены startup status. В offline release data source должен быть
принудительно `local`, telemetry отключена, Mapbox необязателен.

## 8. Повреждённый service-worker cache

Workbox умеет очищать устаревшие caches и показывать update prompt, а 3D имеет
свой versioned cache. Пользовательского scoped recovery UI пока нет.
Оператор не может безопасно проверить manifest, удалить только QHM caches,
перерегистрировать SW и перезапустить `/demo`.

## 9. Текущий kiosk mode

`kiosk=true` включает inactivity warning/reset и сохраняет существующую
страницу без hard reload. Reset закрывает основное состояние Exhibition.
Нет fullscreen prompt, cursor inactivity policy, безопасного Esc menu,
скрытого operator menu, recording mode и единого тестируемого reset model.

## 10. Восстановление оператором до P2A.8

Доступны browser reload, PWA update prompt, SVG query fallback и локальный
reset Exhibition. Нет stop/status scripts, PID-scoped server management,
health command, checksum verification, cache recovery panel и аварийной
карточки. Оператору пришлось бы диагностировать проблему вручную.

## 11. Пути случайного открытия research/debug UI

- `/exhibition?scientificReview=true` в development;
- `/exhibition/diagnostics`;
- review queue, agent и lesson controls обычного `/exhibition`;
- development-only diagnostics и repository retry;
- query-параметры P1B/P1C.

P2A.8 должен отделить `/demo`, где official mode нельзя отключить, а research
panels и debug controls недоступны независимо от query.

## 12. План online и offline release packages

Online package должен содержать Vercel checklist, safe env example, проверки
маршрутов, cache purge и rollback без credentials и без deployment.

Offline package должен собираться из production output по allowlist:
application shell, local data chunks, release/preflight manifests, SVG
fallback, poster, один production GLB, Meshopt, PWA, operator documentation и
локальный Node static server. После сборки создаются SHA-256 checksums и
выполняется повторная integrity-проверка. Исключаются `.env`, Git, source
maps, source GLB, restricted archive media, review state, telemetry logs и
абсолютные локальные пути.

