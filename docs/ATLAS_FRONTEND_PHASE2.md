# Atlas Frontend Phase 2

## Goal

Replace Atlas historical demo fixtures with the existing HistoricalSnapshot contract. Changes are confined to the Atlas feature, its tests and this report. Existing routes, domain contract, historical datasets, Mapbox and SVG renderers are unchanged. No dependencies, commit or push.

## Previous Data Flow

```text
atlasDemoData (six hardcoded historical objects)
    ↓
Atlas UI
```

## New Data Flow

```text
Existing local historical data
    ↓
buildAtlasHistoricalSnapshot(selectedYear)
    ↓
buildHistoricalSnapshot({ year, datasetVersion, data, metadata })
    ↓
Atlas Snapshot Adapter
    ↓
Atlas UI
```

## HistoricalSnapshot Integration

`data/atlasHistoricalData.js` imports existing `historicalSettlements`, `eraRegistry`, `entityGeometries`, entities and source catalogue. It calls the existing pure domain builder using its object argument contract, without adding an alternative domain implementation. `LOCAL_DATASET_VERSION` identifies the source. The source catalogue is supplied as metadata for resolving actual source IDs.

The domain filters inclusive temporal ranges including signed BCE years. It preserves raw geometry, names, confidence and source references rather than normalizing every dataset shape. Source collection and UI normalization stay at the Atlas boundary. Snapshot and adapter are memoized by year, and search/category filtering is memoized separately.

## Atlas Adapter

`data/atlasSnapshotAdapter.js` derives localized objects, categories, era, real layer counts and metadata. It handles time-valid multilingual names, source IDs, confidenceLevel, approximate coordinates and period bounds from the supplied places. Categories derive from all active placeType values; labels/symbols are presentation configuration only. Epoch navigation uses the canonical eraRegistry and the current heading uses snapshot.era, including an unspecified-era fallback for coverage gaps.

## Timeline Integration

The selected year rebuilds the snapshot. Future and expired places disappear, counts update, and the selected card is cleared if its record disappears. Returning to the earlier year does not reopen a stale card. This applies to slider, epoch buttons, key dates and playback. Domain year zero remains invalid; the timeline skips it.

Examples from existing data: settlements are unavailable before 500; Balasagun is available through 1400 and absent in 1401. At -550 the canonical Saka era is returned but this settlement source has no places. Atlas displays the empty state rather than adding BCE demo records.

## Search

Search only considers snapshot-active objects and active historical names. Requested language falls back to Russian, matching existing historicalPlaceNames behavior; an unavailable name displays the source ID. Search includes localized names, available descriptions, current era context, types and active aliases. Historical names outside their validity do not match. Selected categories intersect with search; a multi-type object is shown if any of its types remains enabled.

## Object Card

Name, validity period, coordinates, source titles and confidence come from the adapted records. Era is snapshot context when no object-specific era exists. Descriptions are not invented. Missing sources/confidence use localized unspecified labels. Supplied confidence and verification codes are shown verbatim, without asserting verified/high status. Details expose the available verification status. Coordinates are omitted if invalid; approximate precision is retained. Evidence is preserved in the view model; the current settlement source supplies source IDs rather than separate evidence documents.

## Placeholder Projection

Markers use only valid coordinate pairs from snapshot objects. `projectAtlasCoordinates` is explicitly a **non-GIS visual projection** into the existing 1200×800 sketch: linear longitude/latitude mapping over 44–90° E and 39–57° N. Invalid or out-of-frame coordinates receive no marker; the object remains searchable. No geometry is generated or written back. This mapping is not accurate cartography and may produce overlapping labels for nearby places.

## Layer Integration

Settlement visibility toggles the real snapshot markers. Historical territory/border counts are derived from the actual snapshot, but rendering them is deferred: those controls, trade routes, modern borders, terrain and 3D are disabled future options. Existing decorative SVG remains intact; fictional historical overlays are disabled via configuration. The static sketch and its legend are presentation placeholders, not assertions about data coverage or historical boundaries.

## Removed Demo Duplication

Removed all six demo historical objects and the duplicate era/category registries from `atlasDemoData.js`. It now contains only layer UI definitions, static navigation ticks, localization/formatting helpers. No existing historical records were edited. Atlas currently integrates the temporal settlement source, not the full heritage/events/people catalogue.

## Tests

- `npm.cmd run lint`: PASS.
- `npm.cmd run test:run -- --maxWorkers=2`: 339 tests passed in 25 files; 16 Atlas tests cover integration, source-of-truth, year boundaries, BCE, search, localized temporal names, categories, coordinates, missing metadata, card disappearance and playback.
- `npm.cmd run build`: PASS. Existing mixed static/dynamic import and Browserslist freshness warnings remain.
- `npm.cmd run test:e2e -- e2e/atlas.spec.js --workers=1`: 3 Chromium tests passed for desktop/tablet/mobile. Includes snapshot search, BCE marker/card disappearance, no stale selection reopening, drawer controls, screenshots, overflow and axe checks.

Full repository E2E was not run. Screenshots remain in ignored `test-results/atlas-*`. The pre-existing untracked Atlas E2E file was updated, not removed.

## Known Limitations

Eight source settlements have limited temporal/name coverage, including empty BCE coverage and name gaps. Open period bounds remain open; IDs may appear where no historical name is valid. Source IDs are references, not a new verification claim. Objects outside the sketch bounds have no marker. The map is still schematic; card illustration and static legend remain UI-only. No GIS, network repository, events/people catalogue or persistent state integration was added.

## Phase 3 Recommendation

Connect a geographic renderer through the adapter, display actual snapshot territory/border geometry and integrate further reviewed temporal catalogues. Resolve label collisions and distinguish data coverage from visibility before presenting the sketch as a geographic reconstruction.
