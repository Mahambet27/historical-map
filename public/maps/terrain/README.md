# Atlas local NASA SRTM terrain

NASA SRTMGL1 v3 (003), 1 arc-second (~30 m), WGS84 / EGM96 metres.
Downloaded directly from OpenTopography's public bulk mirror; no terrain API,
Mapbox or Copernicus service is used. Runtime requests are same-origin only.

## Reproduce (Windows, repository root)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/maps/terrain-bootstrap.ps1
npm.cmd run maps:terrain:fetch
npm.cmd run maps:terrain:prepare
npm.cmd run maps:terrain:generate -- .maps-data/terrain/kazakhstan-srtmgl1-v3.tif --provenance .maps-data/terrain/provenance.json --coverage .maps-data/terrain/coverage.json --maxzoom 10
npm.cmd run maps:terrain:validate
```

The portable Python 3.12.10 / GDAL 3.13.3 environment stays in
`.maps-data/terrain/tools/runtime`. The wrapper handles PROJ paths on Windows
with non-ASCII directory names. No system Python installation is changed.

The source lock records URLs, sizes, dates and SHA-256 for 799 original GeoTIFFs.
Coverage is 45-90 E, 39-57 N, including Kazakhstan and surrounding buffer.
Eleven omitted whole-water Caspian cells are extended from the constant -29 m
SRTM elevation verified on each cell's available perimeter. These are water
surface extensions, not bathymetry or fabricated land; provenance lists them.
Any source void, unexpected missing cell or nonconstant water perimeter fails.
The full-resolution mosaic is scanned for nodata before overviews are built.

Generation requires the coverage report to match the mosaic SHA-256. Elevations
are warped to Web Mercator and then encoded as Terrarium RGB, 256x256, z0-10.
The original GeoTIFF retains 1 arc-second resolution; displayed tiles are reduced
at these zooms (about 100 m/pixel at z10 in central Kazakhstan). Higher zooms
use MapLibre overscaling. Existing generated output is never overwritten.

## Runtime and artifacts

Set `VITE_ATLAS_TERRAIN_ENABLED=true` and restart Vite. The current local
`.env.local` enables it alongside the self-hosted basemap. The default without
this flag remains 2D. Independent raster-dem sources drive terrain and hillshade.
NASA/NGA/OpenTopography attribution is included in the map source.
Missing metadata or failed DEM tiles remove both resources and preserve the
basemap and historical overlay. There is no external terrain fallback.

Generated files belong only in `.maps-data/terrain/` and `public/maps/terrain/`.
Both are Git ignored; no binaries belong in commits. Application builds exclude
terrain from the public-directory copy. Deploy `public/maps/terrain/` separately
at `/maps/terrain/` alongside the application build. The Vite dev server serves
it directly. Missing PNGs must return 404, never SPA HTML.

Validation checks NASA provenance, full-resolution coverage evidence, every
expected tile, RGB dimensions, PNG checksums and decompression. Browser tests
check real mountain elevations, terrain/hillshade persistence, and both manifest
and tile failure fallback. See `docs/ATLAS_PHASE5B_REPORT.md` for run results.

Source: https://doi.org/10.5067/MEaSUREs/SRTM/SRTMGL1.003
Distribution: https://portal.opentopography.org/raster?opentopoID=OTSRTM.082015.4326.1
