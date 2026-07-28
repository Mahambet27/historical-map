import { useEffect, useRef, useState } from "react";

export default function useMapSelection(initialValue = null) {
  const [selected, setSelected] = useState(initialValue);
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  return { selected, selectedRef, setSelected };
}
