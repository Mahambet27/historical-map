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
- separate historical entities and time-valid geometries;
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
