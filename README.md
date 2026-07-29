# Qazaq Heritage Map

## Educational mission

Qazaq Heritage Map is an interactive educational atlas connecting the history of Kazakhstan with
time, geography, historical entities, events, people, heritage objects and reviewed sources.

## Exhibition mode

Open `/exhibition` for the full-screen presentation or `/exhibition?kiosk=true` for the stand mode.
The exhibition includes KK/RU/EN, a six-state guided story, manual timeline, entity cards, curated
1465/1511 comparison, a Grade 7 mini-lesson, local 3D demonstration and accessibility controls.

The historical timeline uses signed years (`-550` means 550 BCE). Era selection and the exact
global year (`-3000…2026`) are independent: moving to any year does not snap the control to a
nearby story snapshot. Historical entities are separate from their time-valid geometries, and
every geometry is labelled with reconstruction confidence. The exhibition map hides all Mapbox
symbol layers and renders only its own political territories, solid borders, extrusion, labels,
places and legend. Use `?quality=light` to disable extrusion on a lower-power device.
Historical boundaries are scholarly reconstructions and may be approximate.

The source panel shows citations and review status. The exhibition agent is an offline allow-listed
tool runner: it uses the reviewed local pack and never needs an AI API. Mapbox and 3D are lazy
chunks. If Mapbox, Supabase or the network is unavailable, the local diagram and all core
educational interactions continue to work.

See [Exhibition guide](docs/EXHIBITION_GUIDE.md),
[data verification](docs/DATA_VERIFICATION_GUIDE.md),
[AI architecture](docs/AI_AGENT_ARCHITECTURE.md) and
[PostGIS schema](docs/database/historical_platform_schema.sql).

### Running and deployment

```bash
npm install
npm run dev
npm run lint
npm run test:run
npm run build
```

Only public Mapbox and Supabase anon configuration belongs in `VITE_*`. AI provider keys,
Supabase `service_role` and publishing operations belong on the server. Deploy as an SPA with
history fallback to `index.html`; the included Vercel and PWA configuration already provides this.

### Roadmap

Next stages are historian-reviewed production geometries, a complete Supabase/PostGIS migration,
atomic published data releases, licensed narration, broader lessons and a server-side cited RAG
assistant. See `docs/EXHIBITION_IMPLEMENTATION.md` for the current architecture.

[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000&labelColor=ffffff)](#tech-stack)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff&labelColor=ffffff)](#tech-stack)
[![Mapbox](https://img.shields.io/badge/Mapbox-000000?logo=mapbox&logoColor=fff&labelColor=ffffff)](#tech-stack)
[![PWA-ready](https://img.shields.io/badge/PWA-ready-0F172A?labelColor=ffffff)](#pwa--mobile)
[![License TBD](https://img.shields.io/badge/License-TBD-6B7280?labelColor=ffffff)](#license)

Qazaq Heritage Map is an interactive historical and cultural map of Kazakhstan built for exploration, education, tourism, and mobile-first use. It combines Mapbox-based cartography, 3D terrain, multilingual place cards, route planning, an assistant-style guide flow, and a PWA-ready interface in one experience.

## Table of Contents

- [Description](#description)
- [Problem](#problem)
- [Solution](#solution)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Security Notes](#security-notes)
- [Performance Notes](#performance-notes)
- [PWA / Mobile](#pwa--mobile)
- [Roadmap](#roadmap)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

## Description

Qazaq Heritage Map presents historical, cultural, natural, and tourist places of Kazakhstan on a map that is designed for browsing, discovery, and storytelling. The project supports RU/KZ/EN interface switching, selected-place cards, route planning, 3D presentations, and a mobile experience that feels closer to a lightweight app than a static website.

## Problem

Historical and cultural places in Kazakhstan are often difficult to study interactively. Information is scattered across different sources, the geography is not always visualized clearly, and many existing resources are not convenient for tourists, students, researchers, or mobile users. That makes discovery slower and less engaging than it should be.

## Solution

This project brings historical, cultural, natural, and tourism-oriented places together on a single Mapbox map with era and category filters, search, multilingual descriptions, a selected-place panel, 3D previews, route support, and an assistant-style guide flow. The result is a more navigable and educational way to explore Kazakhstan.

## Features

- Mapbox map with layered geographic visualization
- Historical places and modern points of interest
- Popular Kazakhstan layer
- Era and category filters
- Search across places
- Selected place panel with details, media, and nearby places
- RU / KZ / EN interface
- 3D terrain experience
- `@google/model-viewer`-powered 3D presentations
- Assistant-style guide flow
- Route layer and route planning UI
- PWA manifest and install-ready mobile shell
- Mobile-first layout with safe-area support
- Lazy loading for heavy panels and 3D viewer
- Optimized image loading
- Safe environment handling with public-only frontend variables
- Missing Mapbox token screen
- Public platform landing page that does not load Mapbox
- Client-side routes for the map, timeline, events, people, heritage, routes, museums, education, research, about, and admin shells
- Interactive flagship event demo for the formation of the Kazakh Khanate

## Application Routes

- `/` - public platform landing page
- `/map` - existing interactive Mapbox experience
- `/timeline` - historical periods and time navigation
- `/events` and `/events/:eventId` - events catalog and detail pages
- `/people` and `/people/:personId` - people catalog and detail shells
- `/heritage` and `/heritage/:placeId` - heritage catalog and detail shells
- `/routes`, `/museums`, `/education`, `/research`, `/about`, `/admin` - platform sections

See [docs/MIGRATION_PLAN.md](./docs/MIGRATION_PLAN.md) for the phased architecture plan.

## Tech Stack

- React
- Vite
- Mapbox GL JS
- `@google/model-viewer`
- JavaScript / JSX
- CSS
- LocalStorage
- PWA manifest

## Architecture Overview

- Frontend - React application with map shell, panels, filters, and guide flows.
- Map layer - Mapbox GL JS rendering, route visualization, and historical overlays.
- Data layer - local JSON/JS datasets for places, eras, regions, borders, and categories.
- UI layer - reusable panels, cards, loaders, alerts, and place presentation components.
- Map feature layer - `src/features/map` composition, lifecycle seams, services, quality profiles,
  loading/error states, and performance utilities.
- Future backend - planned Supabase / PostgreSQL / PostGIS layer for moderation, publishing, and sync.

## Project Structure

- `src/app` - app entry composition and top-level wiring
- `src/components` - reusable UI and feature components
- `src/components/map` - map view, filters, sidebar, and map-specific helpers
- `src/components/places` - selected place panel, 3D presentation, and place UI
- `src/components/ui` - shared UI states such as error screens
- `src/config` - runtime configuration helpers
- `src/data` - historical and geographic datasets
- `src/features/map` - lazy map experience, hooks, services, config, and performance utilities
- `src/layers` - Mapbox layer setup and drawing helpers
- `src/styles` - global styling and mobile adjustments
- `public` - manifest, icons, and static assets

## Getting Started

```bash
npm install
cp .env.example .env
```

Set your Mapbox token in `.env`:

```bash
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here
```

Then run the app:

```bash
npm run dev
npm run build
npm run lint
npm run test:run
npm run test:e2e
npm run analyze
```

If you want to test the optional Supabase backend, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`. If you leave them blank, the app keeps working on static data.

## Environment Variables

- `VITE_MAPBOX_TOKEN` - public Mapbox access token used by the map.
- `VITE_APP_NAME` - optional app name override if the project is configured to read it.
- `VITE_SUPABASE_URL` - optional Supabase project URL for the future PostgreSQL backend.
- `VITE_SUPABASE_ANON_KEY` - optional Supabase public anon key for read-only frontend access.
- `VITE_SENTRY_DSN` - reserved optional monitoring DSN; no SDK is loaded when it is empty.

Important: `VITE_` variables are embedded into the client bundle, so they must never contain private API keys, secret keys, database passwords, or other sensitive credentials.
Supabase is optional here. If those variables are missing, the app keeps using the static data files.
Never use a `service_role` key in the frontend.

## Mapbox troubleshooting

### Local development

1. Create `.env.local` in the project root.
2. Add `VITE_MAPBOX_TOKEN=your_mapbox_public_token_here`.
3. Restart `npm run dev` after changing the environment file.

### Vercel

1. Open the project settings in Vercel.
2. Add an Environment Variable named `VITE_MAPBOX_TOKEN`.
3. Enable it for Production, Preview, and Development.
4. Start a new Redeploy so Vite embeds the variable in the client build.

### Mapbox

- Use a public token that begins with `pk.`.
- If URL restrictions are enabled, allow:
  - `http://localhost:5173/*`
  - `https://historical-map-x7za.vercel.app/*`
  - `https://*.vercel.app/*`
- Never put the real token in source files, documentation, `.env.example`, or Git.

## Security Notes

- Never commit `.env`.
- Restrict the Mapbox token by allowed URLs or domains.
- Do not store private API keys in frontend code or in `VITE_` variables.
- Use HTTPS in production.
- Validate external content before rendering it.
- Review [SECURITY.md](./SECURITY.md) before shipping changes that affect public inputs or third-party content.

## Performance Notes

- `MapSidebar` and `SelectedPlacePanel` are lazy-loaded.
- The 3D presentation is lazy-loaded.
- `@google/model-viewer` is not part of the initial bundle.
- Images use lazy loading and async decoding where it is safe.
- Route and page components are lazy-loaded. Mapbox JS/CSS is not preloaded by `index.html`.
- `quality=auto|high|balanced|light` selects terrain, antialiasing, pixel ratio, and animation cost.
- `npm run analyze` writes the bundle treemap to `dist/stats.html`.
- Mapbox remains a large on-demand chunk because Mapbox GL JS is a WebGL renderer.
- `/exhibition` has persisted era/map themes, `auto|high|light` quality modes,
  compact/expanded panels and keyboard controls.
- `/exhibition/diagnostics` reports local runtime readiness and session-only,
  non-personal performance metrics.
- Exhibition 3D uses a local dynamic `@google/model-viewer` import, an optimized
  Meshopt/WebP GLB and a poster-first fallback. `quality=light` requires an explicit
  load action.
- `npm run 3d:audit`, `npm run 3d:optimize` and `npm run 3d:budget` maintain the
  exhibition model pipeline without overwriting archived source GLBs.

## PWA / Mobile

- PWA manifest and a Workbox service worker are included.
- Mobile meta tags are configured for app-like behavior.
- Controls are touch-friendly and use safe-area-aware spacing.
- Panels adapt to small screens.
- The precache is limited to the small app shell; Mapbox, models, images, and tiles are excluded.
- Production GLBs are never mandatory precache entries. A separate confirmed action
  stores only the selected exhibition model in the versioned
  `qazaq-heritage-3d-v1` runtime cache.
- A prompt asks before activating an updated service worker.
- Mutable local JSON uses NetworkFirst; large/versioned media stays network-controlled.

## Roadmap

Planned future work includes:

- Supabase / PostgreSQL backend
- Admin panel
- Row Level Security
- AI guide with RAG and verified sources
- Audio guide
- AR mode
- Offline support
- User accounts
- Favorites sync
- Moderated photo uploads
- Quiz mode
- Real routing API
- PostGIS-based spatial queries
- More 3D reconstructions

## Screenshots

Screenshots will be added later.

## Contributing

Issues and pull requests are welcome. If you have an improvement idea, please open an issue first or describe the change clearly in a PR so the scope stays small and reviewable. Keep secrets out of the repository, never commit `.env`, and run `npm run lint` plus `npm run build` before proposing changes.

## Author

Mahambet Karibaev

## License

License is not selected yet.
