# Qazaq Heritage Map: migration plan

## Current foundation

The original application is a React/Vite client with a Mapbox GL map, local JSON/GeoJSON datasets, era and category filters, place cards, route rendering, lazy 3D presentations, local favorites, RU/KK/EN map copy, and optional Supabase reads with a static-data fallback.

## Completed in phases 1–2

1. Keep the existing map implementation and datasets intact.
2. Introduce an application shell and dependency-free client routing.
3. Make the public landing page the initial route and load Mapbox only on `/map`.
4. Add the Qazaq Heritage Map visual system, responsive navigation, and shared language state.
5. Add platform routes, catalogs, a timeline, entity detail shells, and a flagship event demo.
6. Preserve lazy loading for map data, 3D, panels, and the assistant.

## Next phases

1. Move historical entities to a normalized repository API backed by Supabase/PostGIS.
2. Add verified sources, editorial status, confidence levels, and entity relationships.
3. Replace demonstration polygons and routes only after expert review.
4. Add authenticated editorial and moderation workflows with RLS.
5. Add route-level tests, accessibility automation, service-worker versioning, and performance budgets.

The current pages intentionally label unverified reconstructions and do not present demonstration geometry as authoritative historical borders.
