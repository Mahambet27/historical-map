# Atlas Phase 5A.2 local production run

Date: 2026-09-29. Java: Microsoft OpenJDK 21.0.12.1.
Planetiler: 0.10.2, OpenMapTiles 3.16.0, zoom 0-14, bounds [45,39,90,57].

Generation passed in 4m12s. Import passed: 924650 real XYZ MVT files.
Archive: .maps-data/kazakhstan.mbtiles, 491921408 bytes.
Full validation and browser regression results are recorded below after completion.

## Input identity

| Input                           |     Bytes | SHA-256                                                          |
| ------------------------------- | --------: | ---------------------------------------------------------------- |
| planetiler.jar                  |  93278824 | f310bd0413e2e4512b27f4046d418664e8e1d3bf31603c2a70e23de06c167e4d |
| kazakhstan.osm.pbf              | 223683662 | 65e13bd7a87cf1c4db82d8ed0b704de2f773d18e79f8a49486e0382e1604538b |
| water-polygons-split-3857.zip   | 931028007 | 8111fc684c5443cfb00c2fc8ca12d1e4416fb607873167bdeccdd7647d8726e4 |
| natural_earth_vector.sqlite.zip | 434210731 | 375da61836d4779dffa8b87887bc4faa94dac77745ba0ee3914bd7cbedf40a02 |
| lake_centerline.shp.zip         |  80906805 | 6c900507c88fc9f5b5a386f90fd0a42d0495e8755a03d075538fb9a6801a3192 |

## Artifact locations

- .maps-data/inputs/: original downloaded datasets, preserved.
- .maps-data/inputs.lock.json: input identity lock.
- .maps-data/kazakhstan.mbtiles: generated archive, preserved.
- public/maps/tiles/: uncompressed XYZ PBF export.
- public/maps/fonts/Noto Sans Regular/: 46 local ranges, 8477253 bytes.
- scripts/maps/glyph-ranges.json: glyph checksum pins for reproducible installation.
- .maps-data/generate.log, import.log, validation.log: execution evidence.
- .maps-data/coverage-samples.json: 36 point/zoom checks, including seven cities, Balkhash and North Aral.

All binary inputs/tiles/glyphs and .env.local are ignored by Git. Local Atlas mode is
self-hosted with /maps/style.json. Existing unrelated environment values are preserved.
HistoricalSnapshot and the historical overlay renderer are unchanged.

## Production storage

Keep original sources and MBTiles in versioned artifact storage with checksums and
license notices. Serve the static XYZ and glyph directories from same-origin storage
at /maps/tiles and /maps/fonts. Hundreds of thousands of small files should be shipped
as an independent map-data bundle rather than committed to Git or uploaded as code.
Deployment architecture is not changed by this work.

## Source limitations

The Kazakhstan extract includes clipped neighboring-country relations. Planetiler
reported incomplete relations 223026,196240,178009,270056 and missing ways near
extract edges. These warnings did not stop generation; no source geometry was
manually altered. Automated probes and visual review verify useful coverage, not
legal authority or exhaustive correctness of every OSM object.

## Production validation

maps:prepare PASS; maps:generate PASS; maps:import PASS; maps:validate PASS.
All 924650 files decoded; 578213466 logical bytes of XYZ PBF data.
Installed glyph codepoints: 11415. Errors: zero.
Country/admin boundaries, settlement/road/water layers and required z0-14 coverage
checks passed. Counts below include repetitions across tiles/zoom levels:

| Layer          | Tile features |
| -------------- | ------------: |
| boundary       |        194524 |
| place          |        423733 |
| transportation |        632065 |
| waterway       |        305654 |
| water          |        446581 |

Filesystem allocation can exceed logical bytes due to small-file overhead.
MBTiles: 491921408 bytes; XYZ: 578213466 bytes in 924650 files.

## Browser and regression evidence

Unit tests: 359 passed. Self-hosted Atlas Chromium E2E: 5 passed, 1 remote-only skip.
The live local-data test blocks every external HTTP request and checks successful
local tile/glyph responses, a historical point click, card closure after BCE year
selection, canvas reuse, zoom and pan. External requests and failed map assets: zero.
The overview and zoomed screenshots were visually inspected; Kazakhstan geometry,
labels, water, roads and historical points are visible.

Evidence images: test-results/atlas-Atlas-renders-real-l-63cf0-torical-overlay-interactive-chromium/atlas-real-kazakhstan-overview.png
and atlas-real-self-hosted.png in the same directory.

The first E2E run exposed Vite watcher heap exhaustion over the generated artifacts.
The only Vite change excludes .maps-data, generated tiles and fonts from watching;
HTTP serving, PWA rules and production bundling remain unchanged. The rerun passed.

Final production build: PASS (Vite + Workbox, exit 0). Build took 34m14s,
primarily copying 924650 local tile files into dist. Workbox precache: 404 entries.
Final git diff --check: PASS. No commit or push performed.
