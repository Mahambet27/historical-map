# P2A.9 final release report

1. **Stable version:** `2026.08-stable1`, dataset `p2a-2026-08`.
2. **Git commit integration:** build-time `git rev-parse --short HEAD` with
   safe `unknown` fallback; generated value `c586dd0`.
3. **Stable manifest:** `exhibition-stable`, timestamp, commit and
   `integrityStatus: READY`.
4. **Stable package:** separate offline and online directories generated.
5. **RC preservation:** both `2026.08-rc1` package directories remain present.
6. **Rehearsal checklist:** created; every physical item is `NOT TESTED`.
7. **Preview verifier:** read-only HTTPS origin verifier ready; not run without
   a supplied preview URL.
8. **Production verifier:** read-only stable verifier ready; no promote or
   rollback action exists.
9. **Projector mode:** `/demo?projector=true`, including 1366×768, kiosk and
   light E2E coverage.
10. **QR workflow:** HTTPS `/demo` validation and localhost/credential block
    ready; PNG generation awaits an approved production URL and optional
    lightweight QR dependency.
11. **Browser report:** automated Chromium passed; physical Chrome, Edge and
    optional Firefox remain `NOT TESTED`.
12. **Final scripts:** updated full operator script plus 3- and 7-minute scripts.
13. **Freeze policy:** created with explicit allowed fixes and frozen surfaces.
14. **Stable preflight:** passed with no errors.
15. **Unit tests:** 19 files, 209 tests passed.
16. **E2E:** 83 Chromium tests passed; 6 real local-Supabase tests skipped.
17. **Build:** Vite production build passed.
18. **Package integrity:** 105 files checked, READY; performance budget passed.
19. **P2A.5 database status:** `blocked_without_docker_or_podman`; not reported
    as passed. Remote Supabase was not connected.
20. **Remaining physical tasks:** run the equipment/screen/offline scenario,
    branded Chrome and Edge, optional Firefox SVG fallback, read-only preview
    and production verifiers after URLs exist, then generate and scan QR files.

No deployment, commit, production promotion, rollback or remote database
connection was performed. Historical geometry, dates, sources, claims and
verification statuses were not changed for P2A.9.
