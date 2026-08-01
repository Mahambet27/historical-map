const isEditable = (target) =>
  ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable;

export const getExhibitionShortcut = (event) => {
  if (isEditable(event.target) || event.altKey || event.ctrlKey || event.metaKey) return null;
  if (event.key === " ") return "toggle-play";
  if (event.key === "[") return "previous-year";
  if (event.key === "]") return "next-year";
  if (event.key.toLowerCase() === "l") return "lesson";
  if (event.key.toLowerCase() === "a") return "agent";
  if (event.key.toLowerCase() === "c") return "compare";
  if (event.key.toLowerCase() === "r") return "routes";
  if (event.key.toLowerCase() === "g") return "environment";
  if (event.key.toLowerCase() === "h") return "hydrology";
  if (event.key.toLowerCase() === "p") return "historical-places";
  if (event.key.toLowerCase() === "j") return "route-journey";
  if (event.key.toLowerCase() === "e") return "evidence";
  if (event.key.toLowerCase() === "v" && event.shiftKey) return "archive-compare";
  if (event.key.toLowerCase() === "v") return "archive-maps";
  if (event.key.toLowerCase() === "q") return "review-queue";
  if (event.key === "Escape") return "close-panel";
  return null;
};
