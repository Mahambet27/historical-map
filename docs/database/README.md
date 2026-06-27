# Database Preparation

This folder prepares the future backend data model for **Qazaq Heritage Map**.

## Why This Exists

The project currently keeps historical and cultural places in frontend data files. That is fine for the MVP, but it makes moderation, publishing workflows, translations, media management, and secure role-based access harder to scale. This SQL draft is a migration target for a future Supabase / PostgreSQL / PostGIS backend.

## Tables

- `profiles` stores user accounts and roles.
- `places` stores the main place records and coordinates.
- `place_translations` stores RU / KK / EN content per place.
- `eras` stores time period metadata.
- `categories` stores place category metadata.
- `place_categories` links places and categories.
- `place_images` stores image references and ordering.
- `place_sources` stores references, citations, and source links.
- `routes` stores curated route definitions.
- `route_places` orders places inside a route.
- `favorites` stores user saved places.
- `reviews` stores user feedback and ratings.
- `moderation_logs` stores review and publishing actions.

## Migration Path

The future migration can move static frontend JSON and JS data into database seed files, then gradually replace hardcoded content with database queries. A typical flow would be:

1. Seed eras, categories, places, translations, images, and sources.
2. Keep the frontend reading from static files until the backend is ready.
3. Switch data access layer by layer, starting with read-only public content.
4. Add moderation and publishing workflows once the admin panel is ready.
5. See the detailed file-by-file mapping in [SEED_PLAN.md](SEED_PLAN.md).
6. See the migration order and rollback notes in [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md).

## Roles

- `guest` can browse published public content.
- `user` can save favorites and write reviews.
- `moderator` can review user content and handle moderation workflows.
- `admin` can manage places, translations, publishing, and moderation.

## RLS

Row Level Security should be used to keep public reads open while restricting writes.

- Guests read only published places.
- Users manage only their own favorites.
- Users manage only their own reviews.
- Moderators handle moderation workflows and review user content.
- Admins create, update, delete, publish, and unpublish places.

The SQL draft in `schema.sql` contains comments with planned policies rather than aggressive production rules.

## PostGIS Later

PostGIS can be enabled later for spatial queries, map filtering, and route-related work. The current schema keeps `latitude` and `longitude` fields, and a future migration can replace them with `geography(Point, 4326)` or a similar spatial model when the backend is ready.

## Current Status

The frontend has an optional read-only Supabase path for published places. If Supabase is not configured, empty, unavailable, or returns incompatible data, the app keeps using the existing static data files.

## Supabase Quick Start

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `docs/database/schema.sql`.
4. Run `docs/database/minimal_seed.sql`.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
6. Start the app locally with `npm run dev`.
7. Check the browser console or optional status helper.
8. If Supabase fails, the app falls back to static data.

## How to Verify Supabase Read Path

1. Run `docs/database/schema.sql` in the Supabase SQL Editor.
2. Run `docs/database/minimal_seed.sql`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
4. Run `npm run dev`.
5. Open the browser console.
6. Look for `Loaded places from Supabase` when published seed places are loaded.
7. Look for `Using static places fallback` when Supabase is missing, empty, unavailable, or returns invalid data.

These messages are development-only and are not emitted in production builds.
