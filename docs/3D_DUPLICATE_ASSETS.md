# 3D и media duplicate audit

SHA-256 проверен для всех GLB/GLTF и локальных PNG/JPEG/WebP/MP4 в `public` и
`src/assets`.

## Точные дубликаты

| Файл A | Файл B | Размер | SHA-256 | Используется | Рекомендация |
|---|---|---:|---|---|---|
| `public/images/amirsana/1.jpg` | `src/assets/images/amirsana/1.jpg.png` | 186 294 B | `EBC657B6376EF9A71AEB3461D3A84F7CAEE7EF43570CCED5EBE8917D7E47D272` | public-копия используется карточкой; import-копия не найдена в активном графе | Не удалять в P0.5; отдельно проверить import history и неверное `.png` расширение |

## GLB

Одинаковых GLB hash не найдено. `source/bory_tastagan_3d_model.glb` и
`exhibition/bory-tastagan.glb` не являются дубликатами: второй файл имеет WebP
2048² и Meshopt compression и является production derivative.

Автоматическое удаление не выполнялось.
