import { useEffect } from "react";

export default function useMapResize(mapRef, dependencies = []) {
  useEffect(() => {
    const frame = requestAnimationFrame(() => mapRef.current?.resize());
    return () => cancelAnimationFrame(frame);
    // Layout dependencies are explicitly supplied by the caller.
  }, [mapRef, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps
}
