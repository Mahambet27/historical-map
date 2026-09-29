# Reproducible Atlas vector basemap pipeline

No automatic geographic dataset download. These commands operate on local inputs.
The only small network step is `maps:glyphs`: three pinned Noto Sans glyph ranges
(329,021 bytes total), with SHA-256 verification. They are real glyphs, not fixtures.

## Tools and exact inputs

Use Node 24 (built-in node:sqlite), npm ci, and Java 21+. Use the
[Planetiler v0.10.1 release JAR](https://github.com/onthegomap/planetiler/releases/tag/v0.10.1)
with its built-in OpenMapTiles profile; save it as `.maps-data/inputs/planetiler.jar`.
No new npm dependencies or tile server are needed. Allow substantial SSD space
for source archives, temporary files, MBTiles and an uncompressed XYZ export.
Generation uses a 4 GiB Java heap; run on a machine with sufficient free RAM.

Manually provision these files; never commit them:

| Local file in .maps-data/inputs/ | Upstream source |
| --- | --- |
| kazakhstan.osm.pbf | [Geofabrik Kazakhstan](https://download.geofabrik.de/asia/kazakhstan.html), choose and archive a dated extract |
| water-polygons-split-3857.zip | [OSM water polygons](https://osmdata.openstreetmap.de/data/water-polygons.html), full EPSG:3857 archive |
| natural_earth_vector.sqlite.zip | [Natural Earth SQLite](https://naciscdn.org/naturalearth/packages/natural_earth_vector.sqlite.zip) |
| lake_centerline.shp.zip | [OSM lake centerlines](https://github.com/acalcutt/osm-lakelines/releases), EPSG:3857 archive |
| planetiler.jar | Versioned release above |

Do not use Planetiler's Monaco test sources for Kazakhstan. Preserve source dates,
URLs, licenses, Java version and JAR release alongside `inputs.lock.json` in artifact
storage. `maps:prepare` hashes all bytes, including the JAR, and refuses to overwrite
an existing lock. `maps:generate` rechecks hashes before execution. Archive old
inputs/outputs before refreshing; never silently use a mutable latest extract.

## Commands (PowerShell, repository root)

```powershell
New-Item -ItemType Directory -Force .maps-data/inputs | Out-Null
# Put the five files listed above in .maps-data/inputs first.
npm.cmd run maps:glyphs
npm.cmd run maps:prepare
npm.cmd run maps:generate
npm.cmd run maps:import
npm.cmd run maps:validate
```

`maps:generate` imports OSM, Natural Earth, lake centerlines and water polygons into
OpenMapTiles-schema MBTiles, z0-14, bounds 45,39,90,57. Downloads and Wikidata access
are explicitly disabled. The source extract determines actual coverage: a Kazakhstan
extract will not fill the entire surrounding buffer with neighboring-country data.
The full Kazakhstan run used the supplied Planetiler 0.10.2 JAR; see
[the run report](../../docs/ATLAS_PHASE5A2_REPORT.md) for actual input/output identity. See [Planetiler usage](https://github.com/onthegomap/planetiler#usage)
and [profile inputs](https://github.com/openmaptiles/planetiler-openmaptiles/blob/main/src/main/java/org/openmaptiles/OpenMapTilesMain.java).

You can instead import an existing licensed OpenMapTiles-compatible MBTiles file:

```powershell
npm.cmd run maps:import -- .maps-data/approved-kazakhstan.mbtiles
npm.cmd run maps:validate
```

Import streams SQLite rows, flips TMS Y to XYZ, decompresses gzip, decodes each
MVT, and writes uncompressed `public/maps/tiles/{z}/{x}/{y}.pbf`. It refuses to mix
with an existing tileset. An interrupted import leaves partial files and no completed
manifest: archive the partial tiles directory before rerunning. It records source
SHA-256 and archive metadata in ignored `public/maps/data-manifest.json`.

## Glyphs

`maps:glyphs` installs Latin/Latin Extended-A and Cyrillic (including Kazakh) ranges
0-255, 256-511, 1024-1279 into both `.maps-data/glyphs/Noto Sans Regular/` and
`public/maps/fonts/Noto Sans Regular/`. Source: MapLibre demotiles commit
`601ae60796ceceda2cbd2ed3d2ea92d17a84be4b`. Hashes are pinned in the script.
The Noto font license is in `public/maps/fonts/OFL.txt` (SIL OFL 1.1).

The validator checks actual place-label codepoints against installed glyphs.
Additional scripts/symbols can require more ranges. For complete local generation,
use the [MapLibre font-maker CLI](https://github.com/maplibre/font-maker/blob/main/CONTRIBUTING.md)
built from a recorded commit and a licensed static NotoSans-Regular.ttf:

```powershell
font-maker --name "Noto Sans Regular" .maps-data/glyphs/NotoSans-Regular .maps-data/inputs/NotoSans-Regular.ttf
```

The CLI output directory contains range PBFs. Copy them into the two `Noto Sans Regular`
directories above, preserve the font license and record TTF/tool checksums. Archive
and regenerate the input lock before regenerating tiles. Do not point the style at
an external glyph endpoint. Historical UI language behavior is unchanged.

## Validation and release gate

`npm run maps:validate` exits nonzero when production assets are absent or invalid.
It validates the MapLibre style, direct same-origin URLs, required basemap layers,
MVT decoding/geometry, z0-14 presence, country/admin boundaries, nonempty required
source layers, distributed Kazakhstan city coverage at z4/8/12/14, and glyph coverage
for labels. Missing tiles cannot pass just because the style contract is valid.
Coverage probes are a smoke check, not proof of full administrative or rural coverage.
Perform visual geography/license review before declaring production readiness.

Unit tests use temporary tiny synthetic MVT/MBTiles; they never install those fixtures
as production data. Atlas E2E continues using empty test-only tile responses. Full
live geographic E2E requires the real local dataset and must be run after provisioning.

Large inputs, tiles, glyph PBFs and manifests are ignored by Git. Deploy them as a
separate artifact bundle with style.json and OFL.txt; do not rely on Git to transport
them. The existing static Vite public directory works without a tile server.
Keep PBF MIME types and 404 handling as described in public/maps/README.md.
No terrain, 3D, HistoricalSnapshot, Atlas UI or legacy renderer changes are included.

## Phase 5A.2 source selection

See [SOURCES.md](./SOURCES.md) for the dated source/license register, feature mapping,
missing local inputs, full-coverage acceptance criteria and guarded exact commands.
Local inputs have now been provisioned and production artifacts generated; see the run report. Do not interpret
passing UI tests or local glyph installation as Kazakhstan production coverage.

## Production glyph extension (2026-09-29)

The real Kazakhstan extract contains additional Latin, punctuation, Arabic and CJK
place-name characters near borders. `maps:glyphs` now reads 46 SHA-256-pinned ranges
from `glyph-ranges.json`: 8,477,253 bytes total, from the same fixed MapLibre commit.
This supersedes the three-range minimum described above; all original glyph files
remain. No labels were transliterated or dropped to pass validation.

The supplied generator JAR reports Planetiler 0.10.2, build
0e5588c4a6e8c29a270a33afe8df62027d889604. The actual bytes are recorded in the local
inputs.lock.json. The prior 0.10.1 reference is not the version used for this run.
