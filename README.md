# Qazaq Heritage Map

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
- Future backend - planned Supabase / PostgreSQL / PostGIS layer for moderation, publishing, and sync.

## Project Structure

- `src/app` - app entry composition and top-level wiring
- `src/components` - reusable UI and feature components
- `src/components/map` - map view, filters, sidebar, and map-specific helpers
- `src/components/places` - selected place panel, 3D presentation, and place UI
- `src/components/ui` - shared UI states such as error screens
- `src/config` - runtime configuration helpers
- `src/data` - historical and geographic datasets
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
```

If you want to test the optional Supabase backend, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`. If you leave them blank, the app keeps working on static data.

## Environment Variables

- `VITE_MAPBOX_TOKEN` - public Mapbox access token used by the map.
- `VITE_APP_NAME` - optional app name override if the project is configured to read it.
- `VITE_SUPABASE_URL` - optional Supabase project URL for the future PostgreSQL backend.
- `VITE_SUPABASE_ANON_KEY` - optional Supabase public anon key for read-only frontend access.

Important: `VITE_` variables are embedded into the client bundle, so they must never contain private API keys, secret keys, database passwords, or other sensitive credentials.
Supabase is optional here. If those variables are missing, the app keeps using the static data files.
Never use a `service_role` key in the frontend.

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
- Vite manual chunks split `react`, `mapbox`, and vendor code.
- The large chunk warning is still expected because Mapbox GL JS is a heavy dependency by design.

## PWA / Mobile

- PWA manifest is included.
- Mobile meta tags are configured for app-like behavior.
- Controls are touch-friendly and use safe-area-aware spacing.
- Panels adapt to small screens.
- A service worker has not been added yet to avoid stale-cache risk and update complexity.

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
