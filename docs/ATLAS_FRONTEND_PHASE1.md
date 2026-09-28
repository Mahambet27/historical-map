# Atlas Frontend Phase 1

## Goal

An isolated desktop-first cartographic UI prototype for Qazaq Historical Atlas: navy surfaces, muted gold controls and an illustrative map. No new dependencies, commits or pushes.

## Route

`/atlas`, lazy loaded from `src/app/App.jsx` with an error boundary. Existing route branches and global CSS are unchanged. Base: `bf7c2f9`; branch: `frontend/atlas-ui`.

## Components

Feature files live under `src/features/atlas/`:

- `AtlasPage.jsx`: entry and stylesheet import.
- `AtlasShell.jsx`: local state and modal focus handling.
- `components/AtlasHeader.jsx`: identity, search and languages.
- `components/AtlasSearch.jsx`: multilingual matching and keyboard selection.
- `components/AtlasSidebar.jsx`: epochs and categories.
- `components/AtlasCanvas.jsx`: illustrative SVG and HTML markers.
- `components/AtlasTimeline.jsx`: year slider, key dates and playback.
- `components/AtlasObjectCard.jsx`: entry, source status and details disclosure.
- `components/AtlasLayerControl.jsx`: native switches.
- `components/AtlasMobileToolbar.jsx`: map, filters and object access.
- `components/AtlasIcon.jsx`: inline icons.
- `data/atlasDemoData.js`, `data/atlasText.js`: fixtures and RU/KK/EN copy.
- `styles/atlas.css`: scoped responsive styling.

## UI State

Local state owns language, query, categories, layers, selected entry/card, year, playback, drawer and about dialog. Zoom is local to the canvas. Search filters markers across three languages and intersects with categories. Empty states support resetting filters. Search selection enables settlement markers; card closing restores marker focus where available.

Year ranges from -3000 through 2026 with BCE and no year zero. Epochs/key dates update the same state. Playback advances 25 years per 900 ms, pauses, stops at 2026 and restarts. Year changes the demo epoch; objects remain visible across periods, disclosed in the UI. Layer toggles change the drawing. 3D actions are disabled and labelled as future work.

## Demo Data

Six isolated fixtures: Otrar, Turkistan, Bozok, Berel, Shilikti and Tamgaly. Coordinates, periods and screen positions illustrate layout only. Era ranges are UI bins, not authoritative chronology. Existing historical/evidence records were not changed or copied wholesale. Cards state that data requires review and verified sources are not connected.

## Responsive Behaviour

Desktop uses sidebar/map/card/timeline. Medium widths overlay the card; below 900 px filters open a drawer. Mobile stacks search, provides compact timeline/bottom toolbar, and a scrollable object sheet. Sidebars/cards scroll independently. Checked at 1440×1000, 834×1112 and 390×844 without horizontal page overflow.

## Accessibility

Semantic landmarks, labelled controls, pressed/expanded states, native range/checkbox keyboard support, visible focus, skip link and reduced-motion styling. Search supports Enter, ArrowDown and Escape. Drawer/about dialogs trap focus, close on Escape and restore focus. Global focus styling is respected. Axe covers desktop, tablet and mobile; this is not a complete assistive-technology audit.

## Tests

- `npm.cmd run lint`: passed.
- `npm.cmd run test:run -- --maxWorkers=2`: 238 tests passed across 22 files, including 7 Atlas tests for route, search/empty state, marker/card close/focus, BCE/epochs, layers/categories, language/dialog and playback boundaries.
- `npm.cmd run build`: passed; Atlas has separate lazy JS/CSS chunks. Existing Vite mixed-import and Browserslist freshness warnings remain.
- `npm.cmd run test:e2e -- e2e/atlas.spec.js --workers=1`: three Chromium tests covering interactions, keyboard, responsive drawers, screenshots, overflow and axe. Full repository E2E suite was not run for this isolated change.

Screenshots are under ignored `test-results/atlas-*` directories. Existing Playwright was used because agent-browser CLI is not installed.

## Known Limitations

This is a UI prototype, not GIS. New SVG is a labelled schematic; existing SVG renderers are untouched. Zoom scales the sketch without geographic pan/projection. Timeline does not filter historical validity. Search covers six places, with no events/people dataset. Cards share an abstract illustration. Details expand an explanation. 3D, verified sources and persistent preferences are not implemented. State resets on reload. No MapLibre, Mapbox or Three.js integration was added or changed.

## Next Step

Connect the real HistoricalSnapshot and a GIS renderer through an adapter. Replace demo bins/fixtures with reviewed temporal data, geometry and evidence/source records before presenting the map as historical information.
