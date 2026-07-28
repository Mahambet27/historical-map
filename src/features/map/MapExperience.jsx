import MapCanvas from "./MapCanvas.jsx";
import { getQualityProfile } from "./utils/mapPerformance.js";

export default function MapExperience() {
  const quality = getQualityProfile();
  return (
    <section
      className={`map-experience map-experience--${quality.mode}`}
      data-quality={quality.mode}
    >
      <MapCanvas />
    </section>
  );
}
