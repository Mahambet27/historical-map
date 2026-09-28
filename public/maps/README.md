# Atlas self-hosted basemap assets

This directory reserves same-origin URLs for the next phase. No tile server,
geographic tiles, DEM, terrain layer or 3D content is included.

```text
public/maps/
  style.json       # deploy a real MapLibre style here (not supplied yet)
  style.example.json
  tiles/           # future vector tile files
  terrain/         # future DEM files; unused in Phase 4
```

Build-time configuration:

```dotenv
VITE_ATLAS_BASEMAP_MODE=self-hosted
VITE_ATLAS_STYLE_URL=/maps/style.json
```

Style URLs in self-hosted mode must be root-relative. In the style, also use
same-origin URLs for TileJSON, tiles, glyphs and sprites; retain the data licences
and attribution. `style.example.json` is a valid background-only scaffold, not
a basemap of Kazakhstan. Replace its empty sources with licensed local vector
data in the next phase before deploying it as `style.json`.

Until `style.json` is deployed, self-hosted mode intentionally displays the
existing Atlas SVG/error fallback. A missing file may be served as HTML by SPA
hosting; MapLibre treats that as a style error. It does not switch to a remote
provider. Existing snapshot search, timeline and cards remain usable.

For the temporary public development basemap use
`VITE_ATLAS_BASEMAP_MODE=remote`. In that mode `VITE_ATLAS_STYLE_URL` is ignored.
Vite reads these values at startup/build time; restart/rebuild after changing them.

Provider selection affects only Atlas. No changes to historical datasets,
legacy maps, PWA caching policy or backend services are needed for this switch.
