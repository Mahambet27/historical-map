# Optimization baseline

Дата измерения: 2026-07-27. Ветка: `optimization/full-audit`.

## Исходное состояние

| Метрика                   |                       Baseline |
| ------------------------- | -----------------------------: |
| `npm ci`                  |                        39,08 с |
| ESLint                    |               0 ошибок, 5,79 с |
| Production build          | 6,49 с Vite / 7,48 с wall time |
| Transform modules         |                            109 |
| Initial app JS без Mapbox |                 109,41 KB gzip |
| Mapbox JS                 |   1 678,79 KB / 464,00 KB gzip |
| CSS total                 |       66,96 KB / 12,37 KB gzip |
| `dist` total              |               95 950 445 bytes |
| Production audit          |                     1 moderate |
| Full install audit        |      1 low, 2 moderate, 8 high |

Vite предупреждает о chunk больше 500 KB. Важнее размера: сгенерированный `index.html`
содержит `modulepreload` для Mapbox и vendor, поэтому объявленный lazy route не защищает первый
экран от загрузки 464 KB gzip Mapbox.

## Найденные проблемы

- **P0:** Mapbox JS/CSS и vendor preload на каждой странице из-за `manualChunks`.
- **P0:** `src/components/map/MapView.jsx` содержит 1297 строк и смешивает lifecycle, route,
  markers, filters, camera, layers и UI; рядом остаётся неиспользуемый legacy-файл
  `src/MapView.jsx` на 2350 строк.
- **P0:** нет unit/E2E, coverage, Lighthouse CI и стабильного error boundary.
- **P1:** public assets занимают большую часть `dist`; шесть GLB — 7–16 MB каждый.
- **P1:** production dependency audit содержит prototype pollution в транзитивной зависимости.
- **P1:** console-логирование распределено по Mapbox/service коду; часть diagnostics раскрывает
  длину и префикс токена.
- **P1:** отсутствуют CSP/headers, CodeQL и проверяемые performance budgets.
- **P2:** нет Prettier/EditorConfig, web-vitals callback и управляемого PWA update.

## Самые большие assets

| Файл                                       |      Bytes |
| ------------------------------------------ | ---------: |
| `public/models/yrgyzbai_3d model.glb`      | 15 888 468 |
| `public/models/orange-temple-ruin.glb`     | 15 881 764 |
| `public/models/Manyrak_3d_model.glb`       | 15 505 240 |
| `public/models/amirsana_3d_model.glb`      | 15 390 412 |
| `public/models/sak_2_3d_model.glb`         | 11 700 208 |
| `public/models/bory_tastagan_3d_model.glb` |  7 172 396 |
| `public/images/boritostagan/bt-3.mp4`      |  2 847 633 |
| `public/images/amirsana/c3.png`            |  2 325 044 |

## План и границы

1. Убрать initial preload Mapbox, добавить stats и budgets.
2. Вынести независимые map config/performance/services/hooks, сохранив поведение.
3. Добавить unit, smoke E2E, accessibility, CI, PWA, observability и security headers.
4. Повторить измерения и оформить отчёты.

Без отдельного согласования нельзя менять исторические данные, геометрию границ, алгоритмический
смысл маршрутов, визуальную систему, удалять оригинальные медиа/GLB или публиковать реальные ключи.
