# MapLibre / Self-Hosted Migration Plan

## Goal

Move Qazaq Heritage Map toward a government-ready deployment mode that does not require Mapbox Cloud at runtime, while preserving the existing historical data model, timeline, UI, 3D assets, PostGIS work, tests, and exhibition mode.

The migration must be incremental. The current Mapbox implementation remains available until MapLibre parity is verified.

## Principles

- Do not rewrite the historical data layer.
- Do not break the existing `/map` or `/exhibition` experience while migration is in progress.
- Keep historical evidence, confidence metadata, chronology validation, and PostGIS schemas renderer-agnostic.
- Separate the map renderer from tile, terrain, routing, and geocoding providers.
- Production government mode must be able to run without requests to `api.mapbox.com`.
- Prefer infrastructure that can be hosted in Kazakhstan.

## Current Mapbox Coupling

The current project directly depends on Mapbox in several areas:

1. `mapbox-gl` renderer and CSS.
2. Mapbox style URL (`mapbox://styles/mapbox/satellite-streets-v12`).
3. Mapbox Terrain RGB (`mapbox://mapbox.terrain-rgb`).
4. Mapbox Directions API.
5. `Marker`, `Popup`, `GeolocateControl`, camera and layer APIs.
6. Token validation in `src/config/env.js`.

Most GeoJSON sources, layers, filters, camera operations, markers, popups, and terrain concepts are portable to MapLibre with limited changes. Mapbox-hosted styles, tiles, terrain and routing need replacement providers.

## Target Architecture

```text
React UI / Timeline / Historical Data
                |
        Map Engine Adapter
        /                \
   Mapbox mode        MapLibre mode
  (legacy/demo)      (self-hosted)
                         |
            ------------------------
            |          |           |
        Vector tiles  DEM       Routing
        Tile server   tiles     optional
            |
        PostGIS / reviewed GeoJSON
```

## Environment Contract

```bash
VITE_MAP_PROVIDER=mapbox|maplibre
VITE_MAPBOX_TOKEN=...
VITE_MAP_STYLE_URL=...
VITE_TERRAIN_TILES_URL=...
VITE_VECTOR_TILES_URL=...
VITE_ROUTING_BASE_URL=...
```

During the first phase only `VITE_MAP_PROVIDER` is introduced. Existing Mapbox behavior remains the default.

## Phase 1 — Provider Boundary

- Introduce a map provider configuration.
- Add a renderer adapter module.
- Move direct `mapboxgl` imports out of high-level screens.
- Keep Mapbox as the default implementation.
- Add unit tests for provider selection.

Exit criteria:
- Existing Mapbox experience is unchanged.
- `MapView` no longer owns provider selection.

## Phase 2 — MapLibre Renderer

- Add `maplibre-gl`.
- Implement MapLibre renderer adapter.
- Use a non-Mapbox style endpoint.
- Port markers, popup, geolocation, camera, GeoJSON layers and filters.
- Add side-by-side smoke tests for Mapbox and MapLibre modes.

Exit criteria:
- Historical markers, polygons, labels, timeline filtering and camera navigation work in MapLibre.

## Phase 3 — Self-Hosted Basemap and Terrain

Recommended production direction:

- MapLibre GL JS
- Martin or Tegola for vector tiles
- PostgreSQL + PostGIS
- PMTiles for static/offline packages where appropriate
- self-hosted raster/vector basemap
- self-hosted DEM/terrain tiles

Exit criteria:
- Browser network log shows no Mapbox runtime requests in government mode.
- Terrain works without `mapbox://` URLs.

## Phase 4 — Routing Independence

Current routing uses Mapbox Directions.

Options for self-hosting:

- Valhalla
- OSRM
- GraphHopper

Historical/educational routes that are curated should remain local GeoJSON and should not depend on a routing API.

Exit criteria:
- Mapbox Directions is optional and disabled in government mode.

## Phase 5 — 3D

Keep two independent forms of 3D:

1. Terrain/elevation rendered by MapLibre.
2. Historical reconstruction models stored as local GLB/GLTF assets.

For map-anchored models, use a MapLibre custom layer with Three.js (or another renderer) after the base renderer migration is stable.

Exit criteria:
- Local GLB assets render without Mapbox Cloud.
- 3D assets can be packaged for offline exhibition deployments.

## Phase 6 — Government Deployment Profile

Add a dedicated profile such as:

```bash
VITE_MAP_PROVIDER=maplibre
VITE_HISTORICAL_DATA_SOURCE=local
VITE_MAP_STYLE_URL=/tiles/style.json
VITE_TERRAIN_TILES_URL=/terrain/{z}/{x}/{y}.png
VITE_ROUTING_BASE_URL=/routing
```

Requirements:

- no Mapbox token required
- no Google/Mapbox runtime dependency for core features
- deployable inside Kazakhstan-controlled infrastructure
- documented data provenance
- checksums/release package
- offline exhibition mode remains available

## Immediate Next Change

Create `src/features/map/runtime` with a small provider interface and move renderer creation behind that interface before adding MapLibre itself.

This is intentionally conservative: first isolate vendor-specific code, then replace it.
