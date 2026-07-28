import useLegacyMapLifecycle from "../../../hooks/useMapbox.js";

// Compatibility seam while composition is migrated out of the legacy map component.
export default function useMapLifecycle(options) {
  return useLegacyMapLifecycle(options);
}
