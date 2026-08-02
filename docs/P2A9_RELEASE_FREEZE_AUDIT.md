# P2A.9 release freeze audit

Stable release: `2026.08-stable1`  
Dataset: `p2a-2026-08`  
Channel: `exhibition-stable`  
Official route: `/demo`  
P2A.5: `blocked_without_docker_or_podman`

## Audited release surface

| Area | Evidence | Freeze status |
|---|---|---|
| Official demo assets | `public/`, local datasets, official scenario | READY |
| Release manifest | `public/exhibition-release.json` | READY |
| Package report | `release-packages/qazaq-heritage-package-report.json` | READY after package build |
| Checksums/integrity | stable package `checksums.sha256` | READY after package build |
| Offline launcher | packaged start/stop/check scripts | READY |
| Operator guides and emergency card | P2A.8 documents and package copies | READY |
| Kiosk / SVG fallback / 3D | official runtime and local assets | READY |
| RU/KK/EN translations | release content | READY |
| PWA | local manifest, service worker and offline shell | READY |
| Blocked records | `EXHIBITION_RELEASE.blockedRecordIds` | READY |
| Scientific warnings | temporal/evidence warnings retained | READY WITH WARNINGS |
| Real database verification | no Docker/Podman | BLOCKED, not passed |

This audit does not claim a physical device or browser run. Those observations
belong in the rehearsal template and browser report.

## Frozen surfaces

Historical geometries, dates, sources, claims, verification statuses, timeline,
layer model, stories, routes, service-worker strategy, dependencies, database
integration and the 3D pipeline are frozen.

## Post-freeze mutable allowlist

- `docs/templates/physical-rehearsal-result.json` — rehearsal results only;
- `docs/P2A9_BROWSER_COMPATIBILITY_REPORT.md` — observed browser results;
- `docs/P2A9_PHYSICAL_REHEARSAL_CHECKLIST.md` — PASS/FAIL/NOTE fields;
- `docs/P2A8_DEMO_LINKS.md` — approved production origin and QR status;
- `release-packages/stable/qr/*` — generated from approved HTTPS `/demo`;
- generated package reports and checksums;
- critical fixes permitted by `P2A9_RELEASE_FREEZE_POLICY.md`.

Every code exception needs a written reason, reviewer, affected file list and a
repeat of stable preflight plus relevant tests.
