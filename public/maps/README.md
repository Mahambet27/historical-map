# Atlas self-hosted vector basemap

The production style is served at `/maps/style.json` and uses same-origin assets.
Real Kazakhstan tiles are generated locally from the provisioned OSM and auxiliary
inputs. Binary artifacts are ignored by Git and must be deployed separately.
See [the production run report](../../docs/ATLAS_PHASE5A2_REPORT.md) for validation
results, exact sizes, input checksums and source limitations.

Enable after provisioning:

```dotenv
VITE_ATLAS_BASEMAP_MODE=self-hosted
VITE_ATLAS_STYLE_URL=/maps/style.json
```

Remote mode retains its existing development provider without changes.

## Asset contract

```text
public/maps/
  style.json
  tiles/{z}/{x}/{y}.pbf
  fonts/Noto Sans Regular/{range}.pbf
  terrain/                         # reserved, unused
```

Use OpenMapTiles-compatible MVT layers, XYZ addressing (not TMS), Web Mercator,
zoom levels 0-14 and coverage bounds [45, 39, 90, 57], including Kazakhstan with
a buffer. Higher zooms overzoom z14. Low zooms need generalized regional data.
Outside coverage only the background is displayed. Export MBTiles/PMTiles into
static XYZ files; archive files cannot be copied directly into this directory.

| Source layer | Geometry | Used attributes |
| --- | --- | --- |
| water | Polygon | none |
| waterway | LineString | none |
| boundary | LineString | numeric admin_level: 2 country, >2 subdivisions |
| transportation | LineString | class: motorway, trunk, primary, secondary, tertiary, minor, service |
| place | Point | class: city, town, village, hamlet; name; optional name:en and numeric rank |

Contract: [OpenMapTiles schema](https://openmaptiles.org/docs/schema/).
Supply authentic licensed data; verify boundary provenance and coverage. This
is modern geography, separate from historical claims. Attribution assumes
OSM/OpenMapTiles data: retain required credits and license notices for the
actual deployed dataset.

Supply local Noto Sans Regular SDF glyph PBF ranges covering the tiles' names,
including Latin, Cyrillic and Kazakh characters. Preserve the font license.
No sprites, external TileJSON, raster or terrain resources are used. Basemap
labels use native names with English fallback. Historical RU/KK/EN UI is unchanged.

## Deployment and verification

Serve JSON as application/json, tiles as application/vnd.mapbox-vector-tile,
glyph PBF as application/x-protobuf. Configure Content-Encoding correctly for
precompressed assets. Missing assets must return 404, never SPA index.html.
Use same-origin hosting and update cache/version policy when replacing data.

Before production, verify real coverage at overview and city zooms, roads,
water, boundaries, labels and attribution, with external network access disabled.
Missing glyphs prevent labels; missing tiles prevent geography. Missing style
uses the existing placeholder; individual errors after load may leave gaps.

The renderer appends the independent historical GeoJSON circle layer above
basemap layers and updates it through setData when the timeline changes.
Renderer and HistoricalSnapshot code remain unchanged.

Atlas E2E retains isolated tests using empty test-only MVT responses and now also
includes a dedicated self-hosted test against the real local tiles and glyphs, with
all external HTTP blocked. See the production run report for inspected screenshots.
No synthetic sample tiles are published in public/maps.

Local production artifacts are now provisioned. The run report records the final
validation and browser checks required before the subsequent DEM phase.

## Data preparation pipeline

See [scripts/maps/README.md](../../scripts/maps/README.md) for exact input files,
checksum locking, offline generation, MBTiles import, local glyph installation
and `npm run maps:validate`. Real base Latin/Cyrillic/Kazakh glyph ranges are now
installed locally (ignored by Git); geographic tiles have been generated from the provisioned inputs.
The validator intentionally fails until real tile files and coverage are present.
