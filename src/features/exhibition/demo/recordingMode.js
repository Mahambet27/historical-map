export const getRecordingModePolicy = (enabled) =>
  enabled
    ? {
        enabled: true,
        inactivityReset: false,
        cursorHiding: false,
        kioskRestart: false,
        atmosphere: "reduced",
        transitions: "deterministic",
        officialDemo: true,
        debugUi: false,
      }
    : {
        enabled: false,
        inactivityReset: true,
        cursorHiding: true,
        kioskRestart: true,
        atmosphere: "normal",
        transitions: "adaptive",
        officialDemo: true,
        debugUi: false,
      };

