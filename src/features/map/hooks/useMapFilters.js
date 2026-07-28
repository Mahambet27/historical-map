import { useMemo } from "react";

export default function useMapFilters(places, predicate) {
  return useMemo(
    () => (Array.isArray(places) ? places.filter(predicate) : []),
    [places, predicate]
  );
}
