# Exhibition implementation

## Existing architecture

The project remains a React 18 + Vite application with a lightweight History API router. The
existing `/map` experience keeps its regional Mapbox view, Supabase-first places service, static
`places.json` fallback, routes, geolocation, tour, favourites, 3D viewer and rule-based chat guide.

`/exhibition` is deliberately isolated from `SiteLayout`. It uses:

- a lazy Mapbox view centered on all Kazakhstan, bounded to Central Asia;
- a local SVG map whenever Mapbox or its public token is unavailable;
- normalized exhibition data in `src/data/exhibition`;
- local-first historical services with a safe Supabase fallback boundary;
- six numeric timeline states from 550 BCE to 1991 CE;
- five separately selectable eras plus an exact global year slider from 3000 BCE to 2026;
- separate historical entities and time-valid geometries;
- label-free Mapbox basemap with coloured political territories, solid borders, extrusion and
  manually placed multilingual state labels;
- an offline, allow-listed educational agent that emits UI actions;
- lazy agent, Mapbox and 3D bundles;
- kiosk timers enabled only by `?kiosk=true`.

## Decisions

- Existing `0–5` era behavior was not changed.
- Demonstration geometry is labelled `reconstruction` and carries a confidence level.
- The local data release is loaded atomically. Partial remote tables never replace only part of a
  reviewed exhibition package.
- Mapbox is excluded from service-worker precache because it requires its online runtime; the
  lightweight SVG fallback remains in the main exhibition bundle.
- No AI key, service role key or secret is exposed to the browser.

## Implemented stages

1. Full-screen route and three-language start screen.
2. Kazakhstan-wide live map plus offline fallback.
3. Timeline, six-step autoplay story and manual controls.
4. Entity card, curated comparison, people/events links and source panel.
5. Grade 7 mini-lesson, accessibility controls and a lazy local 3D demonstration.
6. Grounded local agent with allow-listed map tools.
7. 60-second warning and 90-second kiosk reset.
8. SQL/PostGIS design and operating, verification and AI architecture guides.

## P0 next-generation hardening

The P0 pass is complete without starting the P1 layer catalogue:

- six deterministic era themes and persisted `era/light/dark/atlas/high-contrast`
  map palettes;
- a complete entity style registry with default, hover, selected, label and
  review-pattern states;
- Mapbox theme updates through paint properties, never a style reload;
- source updates split by territories, labels and places;
- selection moved from GeoJSON properties to feature-state, so selecting an
  entity no longer calls `setData`;
- rapid territory updates coalesced into one animation frame;
- explicit `closed/compact/expanded` panel state and keyboard shortcuts;
- persisted exhibition `auto/high/light` quality modes with device, network and
  reduced-motion detection;
- animation/tour pause when the page becomes hidden;
- local non-personal performance metrics and `/exhibition/diagnostics`;
- Supabase and Mapbox kept in on-demand chunks and excluded from the PWA
  precache; the local SVG/data path remains available.

The full pre-implementation audit and the deferred P1–P3 plan are in
`docs/NEXT_GENERATION_MAP_AUDIT.md`.

## P0.5 exhibition release hardening

- The CDN script was replaced with one cached dynamic import of the official
  `@google/model-viewer` package. The same loader is used by Exhibition and the
  existing place presentation.
- The production Bory Tastagan model is generated from an unchanged archived
  source. Container cleanup, weld, WebP 2048 texture conversion and Meshopt
  compression reduce it from 7,172,396 B to 1,365,176 B without geometry
  simplification.
- A same-origin Meshopt decoder and a 45,282 B WebP poster support the optimized
  model. The poster remains visible through loading, timeout and error states.
- High quality starts loading only after the 3D panel opens. Light quality and
  save-data require an explicit load action.
- The viewer has explicit idle, viewer-loading, model-loading, ready, error and
  timeout states, a 15-second timeout, retry and close actions.
- The app shell does not precache GLBs. The user may explicitly confirm a
  1.3 MiB download into `qazaq-heritage-3d-v1`; progress and readiness are shown,
  and stale cache versions are removed.
- `/exhibition/diagnostics` reports manifest, poster, WebGL, network hints,
  cache/offline availability and the last session load result without requesting
  the GLB.
- Audit, optimization and budget automation lives under `scripts/3d`; source
  models remain in `public/models/source`.

The initial findings are recorded in `docs/3D_RELEASE_AUDIT.md`. Duplicate and
non-exhibition inventories are in `docs/3D_DUPLICATE_ASSETS.md` and
`docs/UNUSED_3D_ASSETS.md`.

### Expert-review boundary

All contextual political entities added for neighbouring-state visualization
carry `verificationStatus: needs_review`. Their names are useful for exhibition
context, but their demonstration polygons, temporal bounds and label points must
be reviewed by a historian/cartographer before a published scientific release.
This includes the Western Turkic, Turgesh, Karluk, Oghuz, Kimak and Karakhanid
polities; Abu'l-Khayr's state, Moghulistan, Nogai, Timurid and Sibir polities;
Dzungar, Bukhara and Khiva khanates; and the Russian and Qing empires.

No P0 change added a production AI agent, changed the historical SQL schema or
claimed these reconstructed geometries as definitive borders.
