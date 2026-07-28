import { useEffect, useState } from "react";

const normalizePath = (value) => {
  const path = (value || "/").split("?")[0].split("#")[0];
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
};

// eslint-disable-next-line react-refresh/only-export-components
export function navigate(to) {
  if (normalizePath(window.location.pathname) === normalizePath(to)) return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoute() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  useEffect(() => {
    const update = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return { path };
}

export function Link({ to, children, className, onClick, ...props }) {
  return (
    <a href={to} className={className} onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      navigate(to);
    }} {...props}>{children}</a>
  );
}
