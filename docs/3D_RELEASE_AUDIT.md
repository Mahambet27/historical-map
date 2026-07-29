# P0.5 — аудит 3D release readiness

Дата: 29 июля 2026  
Область: `src/features/exhibition`, активная `/map`, legacy-копии, `public/models`,
Vite/Workbox и production build.

## Итог

Текущий 3D-функционал не готов к автономной выставочной эксплуатации:

- `@google/model-viewer` не установлен локально;
- exhibition и активный `ObjectPresentation` создают module script с
  `https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js`;
- неактивная корневая копия `src/MapView.jsx` также содержит eager CDN script;
- exhibition использует только `bory_tastagan_3d_model.glb`;
- все шесть моделей используются карточками основной `/map`, поэтому ни одну
  нельзя удалять автоматически;
- модели не используют Draco или Meshopt;
- каждая модель содержит одну JPEG-текстуру 4096×4096;
- текущий fallback не имеет poster, retry и timeout и не обрабатывает ошибку
  загрузки самой GLB;
- GLB правильно исключены из обязательного PWA precache.

## Загрузка viewer и модели

| Путь | Текущее поведение |
|---|---|
| `src/features/exhibition/ExhibitionThreeD.jsx` | При открытии lazy-панели добавляет CDN script; после его загрузки немедленно создаёт `<model-viewer loading="eager">` с Bory Tastagan GLB |
| `src/components/places/ObjectPresentation.jsx` | Компонент lazy-loaded только после команды «Показать 3D», затем добавляет CDN script и загружает GLB выбранного места |
| `src/MapView.jsx` | Не участвует в активном маршруте, содержит eager CDN script при mount и сломанную legacy-ссылку на отсутствующий `./ObjectPresentation` |
| `index.html` | Статического model-viewer script нет |

На landing, обычном `/exhibition`, движении timeline и активном `/map` GLB не
запрашиваются до открытия 3D UI. Однако CDN остаётся обязательным условием
создания custom element.

## Инвентаризация GLB

| Файл | Исходный размер | Используется | Количество текстур | Максимальное разрешение текстуры | Compression | Рекомендация |
|---|---:|---|---:|---:|---|---|
| `amirsana_3d_model.glb` | 15 390 412 B (14,68 MiB) | `/map`, не exhibition | 1 | 4096×4096 JPEG, 891 413 B | нет | Сохранить как source; оптимизировать отдельно для основной карты |
| `bory_tastagan_3d_model.glb` | 7 172 396 B (6,84 MiB) | `/map` и exhibition | 1 | 4096×4096 JPEG, 1 209 639 B | нет | Production-кандидат; resize 2048, WebP, weld/dedup/prune/Meshopt |
| `Manyrak_3d_model.glb` | 15 505 240 B (14,79 MiB) | `/map`, не exhibition | 1 | 4096×4096 JPEG, 1 286 652 B | нет | Сохранить как source; превышает желательный дополнительный бюджет |
| `orange-temple-ruin.glb` | 15 881 764 B (15,15 MiB) | `/map`, не exhibition | 1 | 4096×4096 JPEG, 1 230 965 B | нет | Сохранить как source; превышает максимальный дополнительный бюджет |
| `sak_2_3d_model.glb` | 11 700 208 B (11,16 MiB) | `/map`, не exhibition | 1 | 4096×4096 JPEG, 1 297 843 B | нет | Сохранить как source; оптимизировать отдельно для основной карты |
| `yrgyzbai_3d model.glb` | 15 888 468 B (15,15 MiB) | `/map`, не exhibition | 1 | 4096×4096 JPEG, 1 438 145 B | нет | Сохранить как source; превышает максимальный дополнительный бюджет |

Все GLB созданы генератором `Tripo`, имеют один mesh, один primitive, один
material, одну texture и ноль animations. В `extensionsUsed` присутствуют
`KHR_materials_volume` и `FB_ngon_encoding`; compression extensions
`KHR_draco_mesh_compression` и `EXT_meshopt_compression` отсутствуют.

## Геометрическая сложность

| Файл | Vertices | Triangles | Mesh / primitives / materials |
|---|---:|---:|---|
| `amirsana_3d_model.glb` | 264 811 | 501 950 | 1 / 1 / 1 |
| `bory_tastagan_3d_model.glb` | 108 922 | 206 298 | 1 / 1 / 1 |
| `Manyrak_3d_model.glb` | 256 331 | 501 194 | 1 / 1 / 1 |
| `orange-temple-ruin.glb` | 269 962 | 500 864 | 1 / 1 / 1 |
| `sak_2_3d_model.glb` | 192 268 | 354 012 | 1 / 1 / 1 |
| `yrgyzbai_3d model.glb` | 263 503 | 501 380 | 1 / 1 / 1 |

Для production exhibition Bory Tastagan уже укладывается в желательный файловый
бюджет 8 MiB, но 206 тысяч triangles и 4096² texture избыточны для kiosk/mobile.
Безопасный P0.5 pipeline должен оптимизировать контейнер и texture без изменения
ориентации, масштаба, UV, normals, alpha и material semantics. Агрессивное
упрощение геометрии не применяется автоматически без визуального сравнения.

## PWA и offline

- `vite.config.js` precache-ит только HTML/JS/CSS/SVG/webmanifest и явно игнорирует
  `**/models/**`.
- Последний `dist/sw.js` не содержит URL GLB.
- Runtime cache для выбранной GLB отсутствует.
- Poster отсутствует.
- При потере сети CDN viewer не загрузится; текущий UI показывает текстовый
  fallback, но без изображения и retry.
- После локализации model-viewer его lazy chunk сможет работать offline как часть
  app shell. Production GLB должна кешироваться только по явному действию.

## Дубликаты

- GLB с одинаковым SHA-256 не найдено.
- Найдена одна точная копия изображения:
  `public/images/amirsana/1.jpg` и
  `src/assets/images/amirsana/1.jpg.png`, 186 294 B,
  SHA-256 `EBC657B6376EF9A71AEB3461D3A84F7CAEE7EF43570CCED5EBE8917D7E47D272`.
- Расширение `.png` второй копии не соответствует фактическому JPEG-содержимому.
- Удаление не выполняется в P0.5.

## Release-решение

1. Скопировать исходные GLB без изменения в `public/models/source`.
2. Оптимизировать только Bory Tastagan в
   `public/models/exhibition/bory-tastagan.glb`.
3. Использовать локальный poster на основе существующего
   `public/images/boritostagan/bt-1.jpeg` с известным происхождением внутри
   проекта.
4. Подключить официальный `@google/model-viewer` одним dynamic import promise.
5. Добавить state machine, 15-second timeout, retry и ручную загрузку в light.
6. Добавить versioned cache `qazaq-heritage-3d-v1` по явному подтверждению.
7. Не включать GLB, Mapbox и Supabase в обязательный precache.
8. Не менять исторические данные, timeline, eras, lessons и геометрии.

## Результат P0.5

Аудит выполнялся до изменений; перечисленные выше CDN и fallback-риски описывают
исходное состояние. После hardening:

| Показатель | До | После |
|---|---:|---:|
| Bory Tastagan production GLB | 7 172 396 B (6,84 MiB) | 1 365 176 B (1,30 MiB) |
| Уменьшение | — | 80,97% |
| Texture | JPEG 4096×4096, 1 209 639 B | WebP 2048×2048, 293 958 B |
| Geometry | 206 298 triangles | 206 298 triangles |
| Compression | нет | `EXT_meshopt_compression`, `KHR_mesh_quantization`, `EXT_texture_webp` |
| Poster | отсутствовал | `posters/bory-tastagan.webp`, 45 282 B |

- Исходный GLB сохранён без перезаписи в
  `public/models/source/bory_tastagan_3d_model.glb`; остальные пять source GLB
  также сохранены.
- Production GLB проходит glTF validation без errors/warnings и модельный budget.
- `@google/model-viewer` загружается одним локальным dynamic import; CDN-ссылок
  больше нет. Для Meshopt используется локальный decoder
  `public/vendor/meshoptimizer/meshopt_decoder.js`.
- Poster и decoder входят в малый precache; GLB и ленивый model-viewer chunk в
  обязательный precache не входят. Viewer chunk получает отдельный same-origin
  runtime CacheFirst, а GLB сохраняется только после явного подтверждения в
  `qazaq-heritage-3d-v1`.
- High mode запрашивает GLB после открытия панели; light/save-data ждут ручного
  действия. Ошибка и 15-секундный timeout сохраняют poster и предлагают retry.
- `/exhibition/diagnostics` проверяет 3D readiness без запроса GLB.

## Финальная проверка release

- Local Playwright measurement: от открытия 3D-панели до состояния `ready` —
  8 597 ms в последовательном Chromium-сценарии.
- Production `model-viewer` chunk: 1 038 491 B raw / 296,59 kB gzip. Он не входит
  в initial bundle и не входит в precache; запрос появляется только после
  открытия 3D.
- Workbox: 46 precache entries, 602,71 KiB. GLB, Mapbox chunk и Supabase chunk
  отсутствуют; poster и Meshopt decoder присутствуют.
- Chromium E2E: 15/15; unit: 45/45; lint, build, `3d:audit`, `3d:budget` и
  `git diff --check` проходят.
- Offline E2E подтверждает, что уже открытая выставка остаётся рабочей без сети.
  Отдельный versioned cache production GLB покрыт unit-проверкой и явным UI
  подтверждением; отсутствие GLB оставляет рабочий poster fallback.
