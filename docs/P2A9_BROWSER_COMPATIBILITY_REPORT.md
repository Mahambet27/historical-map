# P2A.9 browser compatibility report

No browser is marked passed unless it was actually launched during rehearsal.

| Browser | Target | Status | Note |
|---|---|---|---|
| Chrome | `/demo`, stable official mode | NOT TESTED | Physical run required |
| Microsoft Edge | `/demo`, stable official mode | NOT TESTED | Physical run required |
| Firefox | `/demo?fallback=svg` | NOT TESTED | Run if installed |

Automated Playwright Chromium: `83 passed`, `6 skipped` (the skipped tests are
the blocked real local-Supabase suite). This is not a branded Chrome or Edge
physical pass.

Automated Chromium E2E is recorded separately and is not a substitute for the
physical Chrome/Edge checks. Record browser version, screen, Windows scaling,
network state and observed issues after rehearsal.
