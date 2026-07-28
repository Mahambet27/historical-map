import { useEffect, useRef } from "react";

export default function useMapRouteAbort() {
  const controllerRef = useRef(null);
  const renew = () => {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    return controllerRef.current;
  };
  const clear = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  };
  useEffect(() => clear, []);
  return { clear, controllerRef, renew };
}
