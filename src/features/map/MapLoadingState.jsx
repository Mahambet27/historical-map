import { MAP_UI_TEXT } from "./constants/mapUiText.js";

export default function MapLoadingState() {
  return (
    <div className="hm-map-state hm-map-state--loading" role="status" aria-live="polite">
      <div className="hm-loader" />
      <div>
        <strong>{MAP_UI_TEXT.loadingTitle}</strong>
        <span>{MAP_UI_TEXT.loadingDetail}</span>
      </div>
    </div>
  );
}
