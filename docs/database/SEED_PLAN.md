# Seed Plan

This document maps the current frontend static data files to the future database schema. It is a planning aid only and does not change any source data.

## Source Files Found

- `src/data/places.json` - main place dataset. It contains 22 records with `id`, `name`, `coords`, `era`, `shortDescription`, `fullDescription`, `images`, and in some entries `model3d` and `translations`.
- `src/data/eraPlaces.js` - era-based place entries. It contains 23 records with `coords`, `era`, `type`, descriptions, images, and structured `translations` blocks.
- `src/data/popularPlaces.js` - featured or popular places layer. It contains 19 records with `coords`, `era`, descriptions, images, `translations`, and `protectedAreaId` links for some records.
- `src/data/protectedAreas.js` - protected-area geometry layer. This is map layer data, not direct place seed data.
- `src/data/regionContours.js` - region contour geometry layer. This is map layer data, not direct place seed data.
- `src/data/historicalBorders.js` - historical border geometry layer. This is map layer data, not direct place seed data.
- `src/data/settlements.json` - settlement GeoJSON features with `properties` and `geometry.coordinates`. This may become reference data or a separate table after review.
- `src/data/cities.json` - empty file. It requires review before any migration.
- `src/data/districts.json` - district GeoJSON features with `properties` and `geometry.coordinates`. This may become reference data or a separate table after review.
- `src/data/tarbagatai.geojson` - GeoJSON terrain or area feature. This is geometry reference data, not a core seed source.
- No dedicated static route seed file was found in `src/data`. Route behavior currently appears to be generated in the app code.

## Mapping To Future Tables

| Current source | Future table(s) | Notes |
| --- | --- | --- |
| `src/data/places.json` | `places`, `place_translations`, `place_images`, `place_sources`, `place_categories`, `eras` | Main migration source. Generate slugs, normalize coordinates, and review media and source structure. |
| `src/data/eraPlaces.js` | `places`, `place_translations`, `place_categories`, `eras` | Strong candidate for seeded historical places and era-linked records. |
| `src/data/popularPlaces.js` | `places`, `place_translations`, `place_images`, `place_categories` | Seed the featured layer as curated public places. |
| `src/data/protectedAreas.js` | future protected-area or geometry table | Keep separate from core place seed until a spatial table is defined. |
| `src/data/regionContours.js` | future geometry table | Useful for map overlays, not direct place seed data. |
| `src/data/historicalBorders.js` | future geometry table | Useful for overlays or historical layers, not direct place seed data. |
| `src/data/settlements.json` | `places` or a future reference table | Needs review because it is GeoJSON-style reference content, not a ready-made place dataset. |
| `src/data/districts.json` | `places` or a future reference table | Needs review because it is GeoJSON-style administrative content. |
| `src/data/tarbagatai.geojson` | future geometry table | Useful for spatial display later, not a direct seed source. |

## Fields Already Present

- `id`
- `name`
- `coords`
- `era`
- `shortDescription`
- `fullDescription`
- `images`
- `translations` in selected files
- `protectedAreaId` in selected popular places
- `model3d` in selected place records
- `geometry.coordinates` in GeoJSON reference layers
- `properties.id` and `properties.name` in GeoJSON reference layers

## Fields That Are Missing Or Need Normalization

- `slug` is not consistently present and should be generated during seeding.
- `status` is not present and should be assigned explicitly, usually `published` for reviewed public content and `draft` for unverified items.
- `region` and `district` are not normalized across all files.
- `place_type` is mostly implicit through `type` text and needs a controlled vocabulary.
- `place_sources` is not structured in the current frontend data.
- `place_categories` is not explicit in most files and needs a mapping step.
- `published_at` is not available in the frontend data.
- `created_by` is not available in the frontend data.
- Some `images` arrays are empty.
- Some `model3d` values are missing or inconsistent in format.

## Coordinate Notes

- The checked records use `[longitude, latitude]` order.
- This matches common GeoJSON and Mapbox conventions.
- When moving to the database, keep the same order for import logic and later consider a spatial column such as `geography(Point, 4326)` for PostGIS.

## Data Quality Issues Found

- No duplicate `id` values were found in `src/data/places.json` during the quick check.
- `src/data/cities.json` is empty and requires review.
- Some records have no separate `translations` block.
- Some records have empty `images` arrays.
- Some media references are inconsistent and should be checked manually before any automated import.
- Some `model3d` values are string paths, while at least one record uses a non-string placeholder value and should be reviewed.
- Some GeoJSON reference files contain placeholder or unfinished text and should not be migrated automatically.
- There are no structured source URLs or citations in the current data files, so source fields will need manual extraction.

## Manual Review Required

- Records with ambiguous identity or mixed naming across files.
- Records with placeholder descriptions.
- Records with missing translations.
- Records with incomplete media references.
- Records with non-standard category or type names.
- Records that should be published only after editorial review.

## Data Cleanup Notes

### Fixed

- Replaced the broken `src/assets` image path in `src/data/places.json` for `Ақжар сақ қорғандары` with the matching public asset path.
- Removed the unsupported `mp4` entry from the `Бөрітастаған жартасы` image array so gallery rendering stays image-only.
- Normalized the `model3d` value for `Бурабай` from an empty object to `null` so 3D detection does not treat it as a valid model.

### Requires Review

- `src/data/cities.json` is still empty and needs a product decision.
- The `Tarbagatai` image filenames are inconsistent, but the referenced files exist, so they were left unchanged.
- `src/data/places.json` still contains a `model3d` path with a space in the filename for `yrgyzbai`; the file exists, so it was left unchanged.
- Some GeoJSON/reference files still contain placeholder or unfinished text.
- Structured source URLs are still missing from the frontend datasets.

## Seed Ordering Suggestion

1. Seed `eras`.
2. Seed `categories`.
3. Seed `places`.
4. Seed `place_translations`.
5. Seed `place_categories`.
6. Seed `place_images`.
7. Seed `place_sources`.
8. Seed `routes` and `route_places` only after route definitions are curated.

## Notes

- The current frontend still reads static files.
- The current frontend is not connected to Supabase.
- This document describes a future migration path, not an automated migration script.
- The step-by-step migration order and rollback plan live in [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md).
