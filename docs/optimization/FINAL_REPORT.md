# Final optimization report

Дата: 2026-07-27.

| Метрика                     |           До |                После |                       Изменение |
| --------------------------- | -----------: | -------------------: | ------------------------------: |
| Initial JS без Mapbox, gzip |    109,41 KB |             52,89 KB |                          -51,7% |
| Mapbox/map chunk, gzip      |    464,00 KB |            536,52 KB |        on-demand вместо preload |
| Initial CSS, gzip           |     12,37 KB |              7,15 KB |                          -42,2% |
| `dist` total                | 95 950 445 B |        ~96 006 947 B | +PWA/SEO files; media unchanged |
| Lighthouse landing          |  не измерено | 99 / 100 / 100 / 100 |                Perf/A11y/BP/SEO |
| Lighthouse map shell        |  не измерено |  99 / 100 / 96 / 100 |                Perf/A11y/BP/SEO |
| LCP landing                 |  не измерено |             1 590 ms |                  local headless |
| LCP map shell               |  не измерено |             1 597 ms |                  local headless |
| CLS                         |  не измерено |                    0 |                    обе страницы |
| INP                         |          n/a |                  n/a |      нет полевых взаимодействий |
| Vite build                  |       6,49 с |               6,50 с |  core build почти без изменения |
| Unit tests                  |            0 |                   14 |                         6 files |
| Target coverage lines       |            0 |               87,50% |    utils/services/config/logger |
| ESLint errors               |            0 |                    0 |                   без регрессии |
| Production audit            |   1 moderate |                    0 |                      исправлено |
| Unused direct dependencies  |          >=1 |  0 найденных вручную |             model-viewer удалён |
| E2E scenarios               |            0 |                    5 |                  Chromium + axe |

## Что исправлено

- Устранён initial preload Mapbox/vendor; pages и map boundaries lazy-loaded.
- Создан `src/features/map` с composition, states, hooks, services, config и performance utilities.
- Добавлены quality modes и облегчённый режим.
- Route/data requests поддерживают cancellation.
- Добавлены error boundaries, redacting logger, Web Vitals callback и optional monitoring seam.
- Добавлены unit tests, coverage, Playwright, axe, Lighthouse CI, CodeQL и GitHub CI.
- Добавлены безопасный PWA update prompt, ограниченный precache и offline document.
- Исправлен WCAG AA contrast, touch targets/focus-visible, dynamic document language.
- Добавлены SEO/social metadata, robots/sitemap и Vercel security headers.

## Проверки

- `npm run format:check` — pass
- `npm run lint` — pass
- `npm run test:run` — 14/14 pass
- `npm run test:coverage` — pass, 87,50% lines
- `npm run build` — pass
- `npm run test:e2e` — 5/5 Chromium pass
- `npm run analyze` — pass, `dist/stats.html`
- `npm audit --omit=dev` — 0 vulnerabilities

## Риски и ручная проверка

- Firefox/WebKit binaries и full matrix не запускались локально; workflow подготовлен.
- Реальные Mapbox token/domain restrictions, GPS и Directions должны быть проверены на Preview.
- Terrain/3D/AI/tour/favorites требуют ручного regression pass на desktop и physical mobile.
- GLB и исходные изображения не перекодированы без visual approval.
- MapView остаётся большим migration hotspot; compatibility seam сохранён ради отсутствия
  поведенческой регрессии.
- Lighthouse JSON — локальная synthetic проверка shell; полевые INP/LCP собираются через callback.

## GitHub / Vercel

1. Подтвердить production hostname и заменить canonical/sitemap при необходимости.
2. Добавить `VITE_MAPBOX_TOKEN`; optional `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_SENTRY_DSN`.
3. Проверить CSP violations на Preview, затем перевести Report-Only в enforced policy.
4. Включить branch protection для CI/CodeQL/Lighthouse.
5. Установить Firefox/WebKit в scheduled CI и выполнить full browser matrix.

## Commits

Коммиты не создавались. Worktree уже содержал незакоммиченные изменения до аудита, включая файлы,
которые требовалось дополнить. Автоматическая фиксация смешала бы пользовательские изменения с
аудитом. Рекомендуемая разбивка остаётся указанной в ТЗ после ручного review/staging.
