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
  if (event.key === "Escape") return "close-panel";
  return null;
};

