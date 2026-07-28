import { lazy, Suspense } from "react";

import ErrorBoundary from "../../components/ui/ErrorBoundary.jsx";
import MapLoadingState from "./MapLoadingState.jsx";

const LegacyMapCanvas = lazy(() => import("../../components/map/MapView.jsx"));

export default function MapCanvas() {
  return (
    <ErrorBoundary name="map-canvas">
      <Suspense fallback={<MapLoadingState />}>
        <LegacyMapCanvas />
      </Suspense>
    </ErrorBoundary>
  );
}
