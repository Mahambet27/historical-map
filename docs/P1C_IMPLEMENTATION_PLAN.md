# P1C implementation plan

## Audit scope and baseline

The audit covered the existing source catalogue, entities, temporal geometries,
events, people, P1A changes, P1B settlements and routes, source/entity/change
panels, diagnostics, local agent, the verification guide, and the proposed
PostGIS schema. P0–P1B remain the compatibility baseline.

## 1. Existing source types

`sources.js` currently contains eight curated records:

- five `official_portal` records;
- one `book`;
- two `encyclopedia` records.

Two sources are marked `verified` and six `reviewed`. Each record has a title,
URL, citation and verification status, but there is no claim-level explanation
of what a source establishes. The catalogue does not yet model archival maps,
museum catalogues, archaeological reports, primary manuscripts, licences,
rights holders or access restrictions.

## 2. Entities carrying `sourceIds`

- Entities: 21 total; 5 have sources and 16 demonstration entities do not.
- Temporal entity geometries: 27 total; 7 have sources and 20 do not.
- Events: 6/6 have sources.
- People: 4/4 have sources.
- P1B historical settlements: 8/8 have sources, but all coordinates remain
  approximate and `needs_review`.
- P1B routes: the Silk Road reconstruction has two broad programme/history
  sources; the demo seasonal route has none.
- Route segments: all four have the broad UNESCO programme source and remain
  `needs_review`.
- Historical changes: 3/3 have top-level sources. One transition and several
  nested interpretations remain `needs_review`; one nested consequence has no
  source.
- Environment: 3/3 cite the broad UNESCO Silk Roads page, not a scientific
  palaeoenvironmental reconstruction.
- Hydrology: all five demo Aral snapshots have no source.
- Stories and timeline records contain source lists, but these lists are not
  expressed as independently reviewable claims.

No existing `sourceId` reference points to an unknown ID.

## 3. Assertions not linked to a specific source

The current model links sources to whole entities or panels. Descriptions,
origins, capitals, rulers, dates, individual geometry extents, place locations,
route direction, environmental state, causal explanations and consequences are
usually not linked to a source at predicate/value level. The source panel
currently overstates this by saying every key claim is editorially linked.
P1C must replace that implication with claim-specific evidence and explicit
unknown/reconstruction states.

Priority seed claims will cover:

- the approximate 1465–1466 formation period of the Kazakh Khanate;
- the 1991 legal independence event;
- the interpretive territorial extent of the 1465 reconstruction;
- the approximate location of Otrar;
- the reconstructed direction of the P1B Silk Road route;
- the educational status of the demo environment/hydrology material;
- the source-based interpretation represented by a P1A historical change.

## 4. Geometry evidence

All entity geometries declare `geometryType: reconstruction`. Seven have one or
more broad sources; twenty have none and are already `needs_review`. Even the
sourced geometries lack a claim explaining whether the polygon represents
settlement, influence, claimed territory or an administrative border. P1C will
not upgrade them. It will add territorial claims for a small curated subset and
queue unsourced geometries for local review.

## 5. Existing `needs_review`

The largest gaps are:

- 16 entities without sources;
- 20 temporal geometries without sources;
- 8 approximate P1B settlements;
- 2 reconstructed/demo routes and 4 route segments;
- 3 demo environment snapshots;
- 5 demo hydrology snapshots;
- the 1511→1521 historical change and nested unsourced interpretation.

The local review queue will collect these records without mutating their source
datasets.

## 6. Links without claim explanations

All eight current source links lack a `claimNote` or predicate/value mapping.
The proposed SQL schema already anticipates `source_links.claim_note`, but the
frontend data does not use it. P1C will introduce `sourceClaims.js` as the local
equivalent and leave existing broad `sourceIds` intact for compatibility.

## 7. Material suitable for educational display

Suitable with clear labels:

- source metadata and citations already stored locally;
- official legal and UN records for the 1991–1992 claims;
- editorially reviewed portal/book/encyclopedia summaries;
- the app’s own reconstructed territories and routes;
- a new original educational overlay created specifically for Qazaq Heritage
  Map;
- demo-only dispute structure that contains no purported real scholarly
  positions.

The evidence lesson can work entirely offline using metadata, source claims and
the original educational overlay.

## 8. Material that must not be redistributed

No existing source record contains image licence or redistribution permission.
Therefore no image from the linked institutions may be copied, cached, exported
or used as a full-resolution overlay. Restricted/unknown records may expose
metadata, a rights notice and an external institutional link only. P1C will use
one original local educational reconstruction under an explicit project-owned
permission record; it must never be labelled an archival original.

## 9. Backend-free P1C architecture

- Lazy local datasets: `sourceClaims.js`, `archiveMaps.js`,
  `sourceDisputes.js`.
- Pure validation, rights and citation formatters.
- One Mapbox image source and raster layer, mounted only after explicit
  selection and removed on close.
- An original lightweight local overlay and thumbnail.
- Lazy Evidence, Archive, Citation and Review panels.
- Local review records in `localStorage`; export only on explicit action.
- URL parsing that checks rights before selecting a full-resolution image.
- SVG fallback with the same claim/status data and only displayable images.
- No link crawling, OCR, AI interpretation, publication or dataset mutation.

## 10. Later PostGIS migration boundary

The existing schema already provides `sources`, `source_links`,
`content_reviews`, `media_assets`, entity geometry versions and publication
statuses. A later P2 migration should add normalized claims, claim-source joins,
archive-map/media rights, georeference records, disputes/positions and review
targets. Authentication, reviewer identity, atomic publication, RLS and audit
history remain server responsibilities and are deliberately excluded from P1C.

## Layer and performance integration

`archiveMaps` will be added to the layer registry under “Sources and research”.
The centralized order will place `archive-map-overlay-layer` immediately after
the basemap and before environment/hydrology. The archive dataset will load only
when the archive/evidence/review features or matching URL parameters are used.
The full image will load only after explicit selection and rights approval.
Ordinary `/map` and ordinary `/exhibition` must request neither P1C data nor the
overlay image.

## Delivery phases

1. Add source claims, archive map metadata, rights checks, evidence statuses,
   demo dispute structure and pure validation.
2. Add the Node validation command and tests for fatal errors/warnings.
3. Add the lazy Archive Map Panel, one original educational overlay, opacity
   controls and attribution.
4. Add opacity/swipe comparison with pointer, touch and keyboard access.
5. Add lazy Evidence Panel/Card, citations and local Review Queue/export.
6. Integrate cards, layer manager, SVG fallback, URL state and local agent.
7. Add the nine-step evidence story, five questions, telemetry and diagnostics.
8. Run validation, lint, unit, E2E, build and bundle/PWA/network measurements.

