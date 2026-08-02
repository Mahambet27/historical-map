# P2A.6 — Historical Basemap Audit

## Результат аудита до P2A.6

Exhibition использовал удалённый `mapbox://styles/mapbox/dark-v11`. Функция
`hideBaseMapLabels` после `style.load` скрывала все чужие `symbol` layers, но не
удаляла их sources и не скрывала современные `fill`, `line`, `fill-extrusion`
и raster layers.

Следовательно, до изменения:

1. Стандартные country/place/road/POI symbols скрывались, пока обработчик
   `style.load` успевал отработать.
2. Современные land, coast, water, roads, rail, admin borders и buildings
   оставались частью style и могли быть видны, особенно на большом zoom.
3. Между reload и повторным скрытием могли кратко появиться Mapbox labels.
4. Любая новая symbol-категория Mapbox автоматически считалась современной,
   но защита не распространялась на другие типы layers.
5. Glyphs загружались через Mapbox и использовались собственными symbol layers.

SVG fallback не использовал Mapbox, но имел декоративную синюю «воду»,
координатную сетку и отдельные точки из общего snapshot. Это не было строгим
визуальным эквивалентом исторической реконструкции.

## Собственные исторические данные

У проекта уже были локальные временные территории и label points, сущности,
settlements с диапазонами имён, routes/segments, environment zones и пять
демонстрационных Aral snapshots. Территории и подписи сущностей связаны с
выбранным годом. Settlements, routes, environment и hydrology фильтруются до
`setData`.

P1B environment, Aral outlines и route geometries имеют `needs_review` или
`demo_only`. Они являются учебными обобщениями, а не метрически точной
исторической географией. Шесть river corridors P2A.6 также явно помечены
`needs_review`, `generalized` и не интерполируются.

## Реализация после P2A.6

`/exhibition` использует локальный Mapbox style object
`Qazaq Heritage Neutral Historical Base`: один background layer, пустой
`sources`, сохранённый Mapbox glyph endpoint. Streets, coastlines, water,
roads, buildings, admin borders, settlements и POI физически отсутствуют в
style. `/map` не изменён.

Все разрешённые подписи объединены в `historical-labels-source` и четыре
слоя: `historical-state-labels`, `historical-place-labels`,
`historical-hydrology-labels`, `historical-route-labels`. HTML/DOM markers не
используются. Historical places остаются style layers и фильтруются по
валидности года; имя без активного исторического варианта не подменяется
современным.

Постоянный рельеф — слабая монохромная обобщённая форма без подписей. Он не
пересчитывается по timeline и отключается в light/high-contrast режимах.
Hydrology выбирается дискретно, без интерполяции; современный Aral snapshot не
переносится в прошлое.

## Контроль и остаточные риски

`validateHistoricalBasemap` проверяет runtime style и классифицирует видимые
чужие label/road/building/admin/hydrology layers. Timeline обновляет только
GeoJSON sources в одном animation frame; `setStyle` не используется.

Главный остаточный риск — научная точность demo/needs_review геометрий.
Исторический Aral до 1960 и river corridors являются coarse educational
reconstructions. До научной верификации их нельзя описывать как точные
береговые линии или русла. Glyph endpoint остаётся сетевым запросом Mapbox,
но он не содержит современную географию.

