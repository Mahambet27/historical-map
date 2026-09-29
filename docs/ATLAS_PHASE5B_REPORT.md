# Atlas Phase 5B — NASA SRTMGL1 v3

DEM generation and renderer integration are complete. Final checks are recorded
below; full CI is deferred by the user's latest instruction.

## Generated artifacts

- Source: NASA SRTMGL1 v3 (003), DOI 10.5067/MEaSUREs/SRTM/SRTMGL1.003.
- Distribution: OpenTopography public SRTM_GL1 bulk GeoTIFF mirror; no terrain API.
- 799 original source cells, 6,690,561,814 bytes, each locked with SHA-256.
- Mosaic: `.maps-data/terrain/kazakhstan-srtmgl1-v3.tif`.
- Mosaic size: 5,154,612,830 bytes (includes elevation overviews).
- Resolution: 1 arc-second (~30 m), 162001 x 64801 pixels, WGS84 / EGM96 metres.
- Coverage: 45-90 E, 39-57 N, including all Kazakhstan. Full-resolution nodata scan: 0.
- Elevation range across the buffered rectangle: -231 to 7431 m.
- Eleven omitted whole-water Caspian cells extend the constant -29 m SRTM
  elevation verified on each available cell perimeter. These are documented
  water-surface extensions, not bathymetry or invented land.
- Terrarium RGB tiles: 13,712, z0-10, 256x256, 1,780,976,734 bytes.
- Combined mosaic + PNG size: 6,935,589,564 bytes, excluding raw sources/tools.
- z10 display resolution is about 100 m/pixel in central Kazakhstan; the source
  mosaic retains 1 arc-second resolution. Higher display zooms overscale z10.
- Mosaic SHA-256: `ab98053045c1d57ca9d6e56c0576de3115825963384044d7fd7b38b46988ef4f`.

Coverage, source identities, processing and sizes are recorded in ignored
`.maps-data/terrain/{sources.lock,coverage,provenance,sizes}.json` and the generated
`public/maps/terrain/terrain.json`. Python 3.12.10, GDAL 3.13.3 and numpy 2.5.3
are installed locally under `.maps-data/terrain/tools/runtime`.

## Renderer and storage

Local `.env.local` enables terrain with the self-hosted basemap. Separate local
raster-dem sources drive terrain and hillshade; source attribution identifies
NASA/NGA/OpenTopography. Existing manifest/tile-error fallback retains the 2D
basemap and historical overlay. No HistoricalSnapshot, Atlas UI, timeline/search,
Three.js or GLB changes were made for this task.

Generated DEM stays only in `.maps-data/terrain/` and `public/maps/terrain/` and
is Git ignored. Build excludes terrain from the public-directory copy: deploy
`public/maps/terrain/` separately at `/maps/terrain/` with the application.
No dataset is committed; no commit or push was performed.

## Validation

- Kazakhstan coverage: PASS (full-resolution scan, zero nodata).
- Terrain generation: PASS (13,712 real SRTM-derived tiles).
- `npm run maps:terrain:validate`: PASS, 13,712 tiles checked, exit 0.
- `npm run build`: PASS, exit 0 (including PWA generation).
- `git diff --check`: PASS, exit 0.
- Full `maps:validate`, test suite and E2E: NOT RUN under the latest instruction;
  queued full CI was cancelled. Added browser checks await the later CI run.
- Terrain, hillshade and fallback are connected; no new browser PASS is claimed.
- External terrain API: NO (bulk source downloads only; runtime assets are local).

## Files changed in this continuation

`.gitignore`, `package.json`, `vite.config.js`, `e2e/atlas.spec.js`,
`scripts/maps/README.md`, `public/maps/terrain/README.md`,
`src/features/atlas/map/atlasTerrain.js`, `scripts/maps/terrain-bootstrap.ps1`,
`scripts/maps/terrain-fetch.mjs`, `scripts/maps/terrain-prepare.py`,
`scripts/maps/terrain-python.mjs`, `scripts/maps/terrain-generate.py`,
`scripts/maps/terrain-validate.mjs`, `scripts/maps/terrain.test.js`,
`docs/ATLAS_PHASE5B_REPORT.md` (15 files). Ignored local terrain configuration
was also enabled. Earlier uncommitted Phase 5B changes were preserved.
