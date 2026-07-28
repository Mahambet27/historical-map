import { exhibitionPlaces } from "../../data/exhibition/places.js";

const project = ([lng, lat]) => ({
  x: 70 + ((lng - 46) / 42) * 760,
  y: 330 - ((lat - 40) / 16) * 260,
});

export default function ExhibitionMapFallback({ state, language, text, comparison }) {
  const activePlaces = exhibitionPlaces.filter((place) => state.placeIds.includes(place.id));
  return (
    <div className="ex-map-fallback" role="img" aria-label={`${text.mapLabel}. ${text.mapUnavailable}`}>
      <svg viewBox="0 0 900 430" aria-hidden="true">
        <defs>
          <linearGradient id="steppe" x1="0" x2="1">
            <stop offset="0" stopColor="#174d50" />
            <stop offset="1" stopColor="#2a736c" />
          </linearGradient>
          <pattern id="disputed" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#f1cc84" strokeWidth="3" opacity=".45" />
          </pattern>
          <filter id="glow"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <path className="ex-map-fallback__grid" d="M0 90H900M0 170H900M0 250H900M0 330H900M150 0V430M300 0V430M450 0V430M600 0V430M750 0V430" />
        <path className="ex-map-fallback__glow" d="M76 221L117 114 247 82 382 103 485 83 645 126 822 206 769 275 670 303 560 365 414 340 327 377 190 326 92 278Z" filter="url(#glow)" />
        <path className="ex-map-fallback__country" d="M76 221L117 114 247 82 382 103 485 83 645 126 822 206 769 275 670 303 560 365 414 340 327 377 190 326 92 278Z" />
        <path
          className={`ex-map-fallback__era ex-map-fallback__era--${state.id}`}
          d={state.year <= 552 ? "M170 154L306 103 505 116 697 177 627 288 432 316 241 276Z" : state.year < 1936 ? "M217 193L334 134 554 144 692 216 587 301 378 321 238 267Z" : "M82 220L122 121 248 91 382 111 485 91 641 133 810 207 762 270 665 295 557 356 416 332 326 367 194 318 98 273Z"}
        />
        {comparison && <path className="ex-map-fallback__compare" d="M146 175L275 111 545 124 735 202 644 320 381 344 195 287Z" />}
        {activePlaces.map((place) => {
          const point = project(place.coords);
          return (
            <g key={place.id} transform={`translate(${point.x} ${point.y})`}>
              <circle r="13" className="ex-map-fallback__point-ring" />
              <circle r="5" className="ex-map-fallback__point" />
              <text x="11" y="-10">{place.names[language] || place.names.ru}</text>
            </g>
          );
        })}
      </svg>
      <div className="ex-map-fallback__status">
        <span>◈</span>
        <div><strong>{text.mapUnavailable}</strong><small>{text.mapUnavailableDetail}</small></div>
      </div>
    </div>
  );
}
