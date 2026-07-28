# Bundle report

## Результат

Baseline `index.html` заранее подключал `mapbox`, `vendor`, React и Mapbox CSS. После изменения
границ chunks стартовая страница подключает только application entry, React и основной CSS.
Mapbox загружается после перехода на `/map` через два lazy boundary:
`App -> MapExperience -> MapCanvas`.

| Метрика                     |        До |     После |  Изменение |
| --------------------------- | --------: | --------: | ---------: |
| Initial JS без Mapbox, gzip | 109,41 KB |  52,89 KB |     -51,7% |
| Initial CSS, gzip           |  12,37 KB |   7,15 KB |     -42,2% |
| Map payload, gzip           | 464,00 KB | 536,52 KB | +72,52 KB* |
| Modules transformed         |       109 |       124 |        +15 |

\* До изменений Mapbox был отдельным chunk, но загружался на каждой странице. После изменений
on-demand `MapView` chunk включает Mapbox, map runtime и Supabase client. Это больший именованный
файл, но нулевой сетевой расход на landing до запроса карты. Следующий безопасный этап — перевести
оставшиеся прямые imports Mapbox на `mapboxService.loadMapbox()` и снова отделить renderer без
возврата initial preload.

`@google/model-viewer` удалён из dependency graph как неиспользуемая npm-зависимость. 3D viewer
по-прежнему подключается только после явного открытия 3D через существующий runtime loader.

Команды:

- `npm run analyze`
- `npm run build:stats`

Обе создают `dist/stats.html`; файл намеренно не коммитится вместе с `dist`.
