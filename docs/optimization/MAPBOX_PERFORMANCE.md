# Mapbox performance

## Реализовано

- Map shell отображается до загрузки Mapbox.
- Chunk error обрабатывает Error Boundary с кнопкой повторной загрузки.
- Invalid/missing public token показывает безопасный fallback.
- Token prefix/length больше не логируются.
- Quality modes: `auto`, `high`, `balanced`, `light`.
- Auto учитывает viewport, `deviceMemory`, `hardwareConcurrency`, reduced motion, Save-Data и
  effective network type.
- Light отключает antialias, terrain exaggeration и transition fade, ограничивает pixel ratio.
- Route request вынесен в service, поддерживает `AbortSignal`, не логирует URL с токеном.
- Data loading отменяет Supabase requests при unmount.
- Existing lifecycle cleanup удаляет map instance, route, markers и refs.
- Sources/layers проверяются через `getSource`/`getLayer`; route GeoJSON обновляется `setData`.
- PWA не кэширует Mapbox JS/CSS, tiles, models или images.

## Ограничения

On-demand MapView остаётся 1 940,52 KB / 536,52 KB gzip. Это Mapbox GL JS плюс runtime карты,
а не initial application JS. Полная декомпозиция legacy MapView должна продолжаться отдельно:
основной компонент всё ещё содержит route/tour/filter UI, хотя lifecycle seam, services,
performance config и composition уже вынесены в `src/features/map`.

Ручная проверка обязательна для GPS permissions, реальных Directions responses, style switching,
terrain/sky на разных GPU, всех GLB и повторных open/close на слабом Android.
