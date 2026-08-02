# Qazaq Heritage Map operator guide

Release 2026.08-rc1 runs without Docker, Supabase, or internet access.

## One day before

- Charge the primary and backup laptops and pause Windows updates.
- Verify package checksums, browser, projector, resolution and fullscreen.
- Run the complete 1465→1511 story on both laptops.

## Thirty minutes before

- Restart Windows; Docker is not required.
- Run `start-demo.cmd`, then `check-demo.ps1`; expect `READY`.
- Confirm language, year 1465, kiosk and Do Not Disturb.

## During and after

Open the operator menu with `Ctrl+Shift+O`. Reset returns to 1465 without a
page reload. Select Light and SVG fallback if the device slows down. After the
show run `stop-demo.ps1`. Do not publish logs that may contain user data.

