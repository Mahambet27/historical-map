import { useEffect, useRef } from "react";

export default function useMapTourCleanup() {
  const timerRef = useRef(null);
  const frameRef = useRef(null);
  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(frameRef.current);
    },
    []
  );
  return { frameRef, timerRef };
}
