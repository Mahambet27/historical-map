import { useEffect, useRef } from "react";

export default function useMapMarkers() {
  const markersRef = useRef([]);
  const clear = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };
  useEffect(() => clear, []);
  return { clear, markersRef };
}
