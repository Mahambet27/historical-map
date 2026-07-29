export const PANEL_MODES = ["compact", "expanded"];
export const CLOSED_PANEL = Object.freeze({ type: null, mode: "expanded" });

export const openPanel = (type, mode = "expanded") => ({
  type,
  mode: PANEL_MODES.includes(mode) ? mode : "expanded",
});

export const closePanel = () => CLOSED_PANEL;

export const setPanelMode = (panel, mode) =>
  panel?.type ? openPanel(panel.type, mode) : CLOSED_PANEL;

export const isPanelOpen = (panel, type) => Boolean(panel?.type && (!type || panel.type === type));

