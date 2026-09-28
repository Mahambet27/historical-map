// The only provider-specific value. Used solely in explicit/default remote mode.
const DEVELOPMENT_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

export function resolveAtlasBasemapConfig(env = {}) {
  const mode = env.VITE_ATLAS_BASEMAP_MODE?.trim() || "remote";
  if (!["remote", "self-hosted"].includes(mode)) {
    throw new TypeError("Unsupported Atlas basemap mode");
  }
  const styleUrl =
    mode === "remote"
      ? DEVELOPMENT_STYLE_URL
      : env.VITE_ATLAS_STYLE_URL?.trim() || "/maps/style.json";
  // Self-hosted assets must stay on the application's origin. No provider/token fallback.
  if (mode === "self-hosted" && (!/^\/(?!\/)/.test(styleUrl) || styleUrl.includes("\\"))) {
    throw new TypeError("Atlas self-hosted style must use a root-relative URL");
  }
  return Object.freeze({ mode, styleUrl });
}

// Read at renderer creation so invalid configuration follows the existing error fallback.
export const getAtlasBasemapConfig = () => resolveAtlasBasemapConfig(import.meta.env || {});
export const ATLAS_MAP_VIEW = { center: [67, 48], zoom: 4, pitch: 0, bearing: 0 };
export const ATLAS_PLACES_SOURCE = "atlas-snapshot-places";
export const ATLAS_PLACES_LAYER = "atlas-snapshot-points";
