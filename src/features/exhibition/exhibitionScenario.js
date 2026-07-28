export const EXHIBITION_RESET_MS = 90_000;
export const EXHIBITION_WARNING_MS = 60_000;
export const TOUR_STEP_MS = 8_000;

export const getKioskEnabled = () =>
  new URLSearchParams(window.location.search).get("kiosk") === "true";
