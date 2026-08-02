# P2A.7 — Scientific GIS readiness audit

Дата аудита: 1 августа 2026  
Область: локальные Exhibition datasets P0–P2A.6. Remote Supabase, миграции,
P2B и P3 не рассматриваются.

## Методика

Аудит выполнен до изменения исторических datasets. Статусы не повышались и
исторические факты не добавлялись. `reviewed` в таблице включает существующие
`reviewed` и `verified`; записи без `verificationStatus` считаются
непроверенными, а не reviewed.

`Approximate` включает явно заданные `approximate`, `generalized`,
`coarse_reconstruction`, `schematic`, `unknown` и записи с `low` confidence.
`Без claim evidence` означает отсутствие отдельного `sourceClaims` record для
subject ID. Для claims и presentation-only labels показатель носит
инвентаризационный характер. `Exhibition ready` рассчитан консервативно:
`reviewed`, непустые `sourceIds`, корректный период и отсутствие unknown
license. Это не означает готовность к научной публикации.

## Сводная таблица

| Dataset | Записей | Reviewed / verified | needs_review | demo_only | disputed | Approximate | Без sourceIds | Без claim evidence | Без reviewer metadata | Exhibition ready | Не готово к научной публикации |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| entities | 21 | 5 | 16 | 0 | 0 | 18 | 16 | 20 | 21 | 5 | 16 |
| geometries | 27 | 7 | 20 | 0 | 0 | 24 | 20 | 26 | 27 | 6 | 21 |
| labels | 24 | 0 | 0 | 0 | 0 | 0 | 24 | 24 | 24 | 0 | 24 |
| events | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 6 | 0 | 6 |
| people | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 4 | 0 | 4 |
| places | 8 | 0 | 8 | 0 | 0 | 8 | 0 | 7 | 8 | 0 | 8 |
| routes | 2 | 0 | 2 | 0 | 0 | 2 | 1 | 1 | 2 | 0 | 2 |
| route segments | 4 | 0 | 4 | 0 | 0 | 4 | 0 | 4 | 4 | 0 | 4 |
| environment | 3 | 0 | 2 | 1 | 0 | 3 | 0 | 2 | 3 | 0 | 3 |
| hydrology | 6 | 0 | 5 | 1 | 0 | 6 | 6 | 6 | 6 | 0 | 6 |
| rivers | 6 | 0 | 6 | 0 | 0 | 6 | 0 | 6 | 6 | 0 | 6 |
| archive maps | 2 | 1 | 1 | 0 | 0 | 2 | 0 | 2 | 2 | 1 | 1 |
| claims | 8 | 3 | 5 | 0 | 0 | 4 | 0 | 8 | 5* | 2 | 6 |
| historical changes | 3 | 2 | 1 | 0 | 0 | 1 | 0 | 2 | 3 | 1 | 2 |
| stories | 3 | 2 | 1 | 0 | 0 | 0 | 3 | 2 | 3 | 0 | 3 |
| questions | 13 | 8 | 1 | 0 | 0 | 0 | 0 | 13 | 13 | 8 | 5 |

\* Три claims имеют `reviewedBy/reviewedAt`; пять требуют reviewer metadata.

## Наблюдения по наборам

- **Entities и geometries.** Основная научная брешь: 16 сущностей и 20
  геометрий без источников. Только одна геометрия имеет отдельный territorial
  extent claim. Все полигоны являются реконструкциями; даже sourced contours
  нельзя трактовать как точные административные границы.
- **Labels.** Это derived presentation records. Они наследуют имя и статус
  активной сущности/геометрии, но сами не содержат evidence metadata.
- **Events и people.** Все имеют broad source links, но не имеют собственного
  verification status. До адаптации readiness они должны считаться
  `scientific_review_required`.
- **Places.** Все восемь координат approximate и `needs_review`; отдельный
  coordinate claim есть только для Отырара.
- **Routes и segments.** Геометрии являются schematic/generalized учебными
  направлениями. UNESCO source подтверждает общий контекст, но не точную
  линию, длину, длительность или порядок остановок.
- **Environment.** Три учебные зоны с broad contextual source, без
  palaeoenvironmental GIS evidence. Одна запись `demo_only`.
- **Hydrology.** Шесть Aral contours не имеют sourceIds. Один `demo_only`,
  остальные `needs_review`; ранний контур — coarse reconstruction.
- **Rivers.** Шесть generalized corridors имеют broad contextual source, но
  не claim-level river geometry evidence.
- **Archive maps.** Одна project-owned reviewed overlay пригодна для
  выставочного показа. Unknown/restricted rights должны блокировать full image
  export и precache.
- **Claims.** Восемь claims имеют источники; три reviewed/verified. Пять
  остаются `needs_review`. Claims сами являются evidence records, поэтому
  отсутствие claim-on-claim не является дефектом модели.
- **Changes.** Переход 1511→1521 и вложенные интерпретации нельзя автоматически
  представлять как полностью подтверждённое объяснение.
- **Stories/questions.** Story-level `sourceIds` отсутствуют: evidence хранится
  на steps/questions. Официальный сценарий должен фильтровать каждый step, а не
  доверять только статусу story.

## Научная и выставочная граница

Материал пригоден для образовательной выставки только при явной маркировке
реконструкции и неопределённости. Научная публикация GIS-контуров пока
невозможна без:

1. claim-level territorial/coordinate/route/hydrology evidence;
2. reviewer identity и review timestamp;
3. документированной spatial precision и reconstruction method;
4. проверки лицензий и прав на каждый экспортируемый media asset;
5. исторической и картографической проверки временных диапазонов и геометрий.

Автоматические validators P2A.7 могут находить технические ошибки, gaps,
overlaps и несовместимые ссылки, но не определяют историческую истинность и не
повышают `verificationStatus`.

