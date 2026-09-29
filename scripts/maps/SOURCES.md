# Atlas Phase 5A.2: source register and production gate

Source review: 2026-09-28. Local inputs were provisioned on 2026-09-29.
See [the current run report](../../docs/ATLAS_PHASE5A2_REPORT.md). The following
register preserves source-selection evidence from before provisioning.
Only the three previously installed Noto Sans glyph ranges are present. No geographic
archive was downloaded during this phase. HistoricalSnapshot is not a basemap source.

## Minimal input set for the existing pipeline

One Kazakhstan OSM extract supplies country and regional administrative boundaries,
settlements, roads, waterways and inland water polygons. Separate city/road/hydro
imports are unnecessary. The current Planetiler OpenMapTiles profile additionally
requires water polygons, Natural Earth and lake centerlines; retain that profile.

| File in .maps-data/inputs/      | Source and selected date/version                                                                                                                                                                                                                       | License and self-hosted use                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kazakhstan.osm.pbf              | [Geofabrik Kazakhstan dated extract](https://download.geofabrik.de/asia/kazakhstan-260927.osm.pbf), 2026-09-27 snapshot; HEAD confirmed 223683662 bytes, Last-Modified 2026-09-27T23:01:23Z; rename locally to kazakhstan.osm.pbf and preserve SHA-256 | ODbL 1.0, OSM contributors; local processing and self-hosted distribution permitted subject to attribution and applicable share-alike/database obligations  |
| water-polygons-split-3857.zip   | [OSM water polygons](https://osmdata.openstreetmap.de/data/water-polygons.html), Mercator split download; observed Last-Modified 2026-09-28T03:43:24Z, 931028007 bytes                                                                                 | ODbL, OSM contributors; same attribution/database obligations                                                                                               |
| natural_earth_vector.sqlite.zip | [Natural Earth SQLite package](https://naciscdn.org/naturalearth/packages/natural_earth_vector.sqlite.zip), observed Last-Modified 2022-05-14T05:28:19Z, 434210731 bytes; upstream vector release v5.1.2                                               | Public domain; local/self-hosted use permitted. Archive identity must be locked by SHA-256; release number alone does not identify this mutable package URL |
| lake_centerline.shp.zip         | [osm-lakelines v12](https://github.com/acalcutt/osm-lakelines/releases/download/v12/lake_centerline.shp.zip), asset updated 2022-05-06T01:36:11Z, 80906805 bytes                                                                                       | Derived from OSM: retain ODbL data obligations. Repository MIT license covers the generation software, not a waiver of upstream OSM database rights         |
| planetiler.jar                  | [Planetiler v0.10.1](https://github.com/onthegomap/planetiler/releases/tag/v0.10.1), tool version pin, not a geographic dataset                                                                                                                        | Apache-2.0 tool; no map-provider API involved                                                                                                               |

Licensing evidence: [OSM copyright](https://www.openstreetmap.org/copyright),
[OSM attribution guidance](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines),
[water polygon license](https://osmdata.openstreetmap.de/data/water-polygons.html#license),
[Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/),
[lake-centerline provenance](https://github.com/acalcutt/osm-lakelines#run-workflow).
OpenMapTiles schema/style design requires its attribution too; retain the
[OpenMapTiles license notices](https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md).
Dataset permission is not a claim of administrative accuracy or authoritative borders.

Dates above are observed metadata, not invented input hashes. Mutable URLs may change:
retain the downloaded snapshot, timestamp, original URL, license and SHA-256 together.
If the observed snapshot is no longer available, record the actual replacement date;
do not relabel it as the old snapshot. maps:prepare records exact local input bytes.
Do not substitute Geofabrik Shortbread MBTiles: that schema differs from this style.
Water-polygons is coastline-derived; inland lakes come from the Kazakhstan OSM PBF.
The old lake-centerline archive is a labeling helper, not current lake geometry.

## Feature mapping and coverage acceptance

| Requirement           | Primary OSM input                                             | Rendered source layer |
| --------------------- | ------------------------------------------------------------- | --------------------- |
| Country boundary      | boundary=administrative, admin_level=2                        | boundary              |
| Regional boundaries   | administrative relations below country level                  | boundary              |
| Cities/towns/villages | place features                                                | place                 |
| Main roads            | highway ways                                                  | transportation        |
| Rivers                | waterway ways                                                 | waterway              |
| Lakes/reservoirs      | water polygons/multipolygons                                  | water                 |
| Land/sea background   | background plus coastline polygons and low-zoom Natural Earth | background / water    |

The unchanged style is configured for z0-14 and bounds [45,39,90,57]. This bounding
box encloses Kazakhstan; it does not prove that data covers every area. Preserve
Geofabrik's extraction polygon as coverage evidence and check border relations,
western/Caspian, northern, eastern, southern and rural tiles after generation.
Run maps:validate (all-zoom presence, decoded geometry/layers, admin levels, city
probes, actual label glyph coverage, local-only source URLs). Then visually review
border segments and settlements against the selected OSM extract at overview,
regional and city zooms. The current city probes alone do not certify whole-country
coverage. No coverage claim is made until actual output can be inspected.

## Local glyphs

Noto Sans Regular ranges 0-255, 256-511 and 1024-1279: 329021 bytes, 735 glyphs,
including Kazakh Cyrillic. Source commit: MapLibre demotiles
601ae60796ceceda2cbd2ed3d2ea92d17a84be4b; SHA-256 pins in glyphs.mjs.
SIL OFL 1.1 is preserved in public/maps/fonts/OFL.txt and permits local redistribution
under its conditions. After real tiles exist, maps:validate must confirm all actual
label codepoints. No external glyph endpoint is used at runtime.

## Exact next commands

First provision the five missing files listed above, without committing them.
Java 21+ and Node 24 are prerequisites. No download command is executed here.
From the repository root in PowerShell, with the already installed glyphs:

```powershell
npm.cmd run maps:prepare
if ($LASTEXITCODE -ne 0) { throw 'Input preparation failed' }
npm.cmd run maps:generate
if ($LASTEXITCODE -ne 0) { throw 'Tile generation failed' }
npm.cmd run maps:import
if ($LASTEXITCODE -ne 0) { throw 'Tile import failed' }
npm.cmd run maps:validate
if ($LASTEXITCODE -ne 0) { throw 'Production basemap is not ready' }
```

These commands use the existing pipeline, with downloads disabled and the expected
source paths passed explicitly. Do not run maps:prepare against placeholder files.
Do not generate fake production tiles to make validation pass.
An approved local OpenMapTiles archive can instead be imported with
`npm.cmd run maps:import -- .maps-data/approved-kazakhstan.mbtiles` after provenance,
license, schema and coverage checks; no such archive is present now.

This phase changes documentation only. All previous working-tree changes remain.
No terrain/DEM/3D, historical layer, Atlas UI or legacy-route changes; no commit/push.
