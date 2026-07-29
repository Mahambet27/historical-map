# 3D assets вне exhibition production manifest

Ни один GLB не признан глобально неиспользуемым: все шесть исходных моделей
связаны с карточками `src/data/places.json`. В P0.5 только Bory Tastagan входит в
выставочный production manifest; остальные модели перемещены без изменения в
`public/models/source` и продолжают обслуживать основную `/map`.

| Файл | Exhibition | Основная карта | Рекомендация |
|---|---|---|---|
| `source/amirsana_3d_model.glb` | не используется | используется | Сохранить; оптимизировать отдельным этапом основной карты |
| `source/Manyrak_3d_model.glb` | не используется | используется | Сохранить; превышает дополнительный production budget |
| `source/orange-temple-ruin.glb` | не используется | используется | Сохранить; превышает дополнительный production budget |
| `source/sak_2_3d_model.glb` | не используется | используется | Сохранить; оптимизировать отдельно |
| `source/yrgyzbai_3d model.glb` | не используется | используется | Сохранить; нормализовать имя только после проверки ссылок |
| `source/bory_tastagan_3d_model.glb` | source оригинал | используется как архивный source | Не удалять; production-копия находится в `exhibition/bory-tastagan.glb` |

Автоматическое удаление не выполнялось.

