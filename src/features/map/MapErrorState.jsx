import { MAP_UI_TEXT } from "./constants/mapUiText.js";

export default function MapErrorState({ onRetry = () => window.location.reload() }) {
  return (
    <div className="hm-map-state hm-map-state--error" role="alert">
      <strong>{MAP_UI_TEXT.errorTitle}</strong>
      <button type="button" onClick={onRetry}>
        {MAP_UI_TEXT.retry}
      </button>
    </div>
  );
}
