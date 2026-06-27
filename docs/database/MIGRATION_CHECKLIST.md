# Migration Checklist

This checklist defines the safe order for moving the current static dataset into the future Supabase / PostgreSQL / PostGIS backend for **Qazaq Heritage Map**.

## Goal

- Migrate static frontend data into normalized database tables without changing the current user experience.
- Preserve the current frontend as read-only static data until the backend is ready.
- Keep Supabase disconnected for now.
- Avoid introducing fake sources, invented history, or automated bulk migration that has not been reviewed.

## Current Status

- The frontend still reads static data files.
- Supabase is not connected yet.
- Database preparation is documentation only.
- Coordinates in the frontend use `[longitude, latitude]`.
- The current database schema stores `latitude` and `longitude` columns.
- A future PostGIS step can replace this with `geography(Point, 4326)` when spatial queries are needed.

## Seed And Migration Order

### 1. eras

- Source data file: `src/data/eraPlaces.js`, `src/data/places.json`, `src/data/popularPlaces.js`
- Target table: `eras`
- Required fields: `slug`, `name_ru`, `name_kk`, `name_en`, `sort_order`, `is_active`
- Validation checks: unique slug values, stable ordering, no empty names
- Possible risks: inconsistent era names, mixed naming between files
- Manual review notes: confirm era labels before seeding

### 2. categories

- Source data file: `src/data/eraPlaces.js`, `src/data/popularPlaces.js`, `src/data/places.json`
- Target table: `categories`
- Required fields: `slug`, `name_ru`, `name_kk`, `name_en`, `sort_order`, `is_active`
- Validation checks: unique slug values, normalized category names, no duplicates
- Possible risks: implicit categories hidden in free-text labels
- Manual review notes: build a controlled vocabulary before seeding

### 3. places

- Source data file: `src/data/places.json`, `src/data/eraPlaces.js`, `src/data/popularPlaces.js`
- Target table: `places`
- Required fields: `slug`, `status`, `region`, `latitude`, `longitude`
- Validation checks: coordinates present, coordinate order is `[longitude, latitude]` in source, valid status values, no duplicate IDs, no empty required fields
- Possible risks: missing region values, inconsistent place types, unclear publication status
- Manual review notes: set `draft` for unverified items and `published` only after editorial review

### 4. place_translations

- Source data file: `src/data/places.json`, `src/data/eraPlaces.js`, `src/data/popularPlaces.js`
- Target table: `place_translations`
- Required fields: `place_id`, `language`, `title`
- Validation checks: one translation per place per language, supported language values only, no duplicate language rows
- Possible risks: incomplete RU / KK / EN coverage, mixed language fields, placeholder text
- Manual review notes: some places have partial translation sets and must be reviewed manually

### 5. place_categories

- Source data file: `src/data/places.json`, `src/data/eraPlaces.js`, `src/data/popularPlaces.js`
- Target table: `place_categories`
- Required fields: `place_id`, `category_id`
- Validation checks: unique pair per place/category, category IDs exist, no orphan links
- Possible risks: category mapping ambiguity
- Manual review notes: derive links from controlled category vocabulary only

### 6. place_images

- Source data file: `src/data/places.json`, `src/data/eraPlaces.js`, `src/data/popularPlaces.js`
- Target table: `place_images`
- Required fields: `place_id`, `public_url` or `storage_path`, `sort_order`
- Validation checks: image URL exists, file extension is expected, sort order is stable, primary image is set once at most
- Possible risks: broken paths, duplicate or unsupported media types, missing thumbnails
- Manual review notes: image arrays may be incomplete; verify each asset before seed import

### 7. place_sources

- Source data file: current frontend files do not contain structured sources
- Target table: `place_sources`
- Required fields: `place_id`, `title`
- Validation checks: source URL format, citation text, source type
- Possible risks: sources are missing and require manual research
- Manual review notes: do not invent citations; source work is editorial only

### 8. routes

- Source data file: no dedicated route seed file found yet
- Target table: `routes`
- Required fields: `slug`, `status`, `name`
- Validation checks: unique slug values, route status is valid, route definitions are curated
- Possible risks: route logic currently lives in the frontend and may not map 1:1 to database routes
- Manual review notes: seed only after route definitions are agreed

### 9. route_places

- Source data file: route definitions once they are created
- Target table: `route_places`
- Required fields: `route_id`, `place_id`, `sort_order`
- Validation checks: all referenced IDs exist, order is stable, no duplicate pair rows
- Possible risks: route ordering changes, incomplete route definitions
- Manual review notes: create only after routes are finalized

### 10. profiles / users later

- Source data file: not available in current static data
- Target table: `profiles`
- Required fields: `id`, `role`, `language`
- Validation checks: auth user links, valid role values
- Possible risks: auth model not finalized
- Manual review notes: migration happens after auth design is agreed

### 11. favorites / reviews later

- Source data file: not available in current static data
- Target tables: `favorites`, `reviews`
- Required fields: `user_id`, `place_id`, and for reviews a valid `rating`
- Validation checks: one favorite per user/place, rating between 1 and 5
- Possible risks: moderation and abuse handling not ready yet
- Manual review notes: import only after user accounts exist

### 12. moderation_logs later

- Source data file: not available in current static data
- Target table: `moderation_logs`
- Required fields: `entity_type`, `action`, `actor_user_id` when available
- Validation checks: action types are consistent, metadata is structured
- Possible risks: log model is backend-specific
- Manual review notes: this is an operational table, not a public content table

## Pre-Migration Checklist

- Confirm schema is ready.
- Confirm seed order.
- Confirm controlled vocabularies for eras and categories.
- Confirm all source data files are current.
- Confirm no frontend code depends on unseeded database values.
- Confirm `cities.json` decision: empty for now, fill later, or replace with another source.
- Confirm all `model3d` values manually.
- Confirm all source URLs and citations manually.
- Confirm coordinate order is `[longitude, latitude]`.
- Confirm no placeholder text should be treated as production content.

## Post-Migration Checklist

- Verify row counts against source data.
- Verify translation counts per language.
- Verify image ordering and primary image selection.
- Verify route order if routes are imported.
- Verify published/draft status for each place.
- Verify no duplicate IDs or duplicate place/language rows.
- Verify coordinates are correct in the database.
- Verify public reads work without exposing private data.
- Verify the frontend still works against static files until backend switch-over.

## Rollback Plan

- Keep the frontend static data as the source of truth until database import is approved.
- Seed into a staging database first, not production.
- If validation fails, truncate only the newly seeded tables in staging and re-run from the reviewed source files.
- If a record needs correction, fix the source mapping or manual review notes before re-seeding.
- Do not remove or rewrite frontend data files during the first migration pass.
- If a table mapping is wrong, stop and revise the plan before continuing.

## Notes

- `src/data/cities.json` is empty and needs a product decision.
- Sources require manual research; do not fabricate them.
- Some translations and image arrays are incomplete and require review.
- `model3d` values must be verified before migration.
- Some GeoJSON/reference files contain placeholder text and should remain separate from the place seed pipeline.
