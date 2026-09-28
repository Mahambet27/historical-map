import { useState } from "react";
import { atlasLocal, atlasYear } from "../data/atlasDemoData.js";
import AtlasIcon from "./AtlasIcon.jsx";

// Deliberately schematic SVG screen coordinates, not GeoJSON or a GIS boundary.
const outline =
  "M133 315 170 285 172 227 226 204 257 170 328 184 369 147 429 160 484 120 547 142 594 112 653 139 691 110 744 146 779 184 821 190 861 230 916 220 954 267 1025 281 1048 331 1090 354 1048 394 1012 409 1008 455 956 471 950 511 904 550 866 535 832 580 771 591 728 620 660 598 616 635 574 608 526 622 492 584 448 595 430 549 386 543 351 508 318 518 294 475 246 467 219 420 165 399 178 357Z";
export default function AtlasCanvas({
  objects,
  selectedId,
  onSelect,
  layers,
  year,
  era,
  language,
  text,
  onResetFilters,
}) {
  const [zoom, setZoom] = useState(1);
  return (
    <section className="atlas-canvas" id="atlas-map" tabIndex={-1} aria-label={text.map}>
      <div className="atlas-map-heading">
        <span className="atlas-eyebrow">
          {text.region} <span> / </span> {atlasYear(year, language)}
        </span>
        <h1>{atlasLocal(era.name, language)}</h1>
        <p>{text.scope}</p>
      </div>
      <div className="atlas-map-coordinate atlas-map-coordinate-top" aria-hidden="true">
        N 48° E 68° <span>—</span> ATLAS RESEARCH VIEW
      </div>
      <div className="atlas-cartography" style={{ transform: `scale(${zoom})` }}>
        <svg
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
          className="atlas-geography"
          aria-hidden="true"
        >
          <defs>
            <pattern id="atlas-grid" width="72" height="72" patternUnits="userSpaceOnUse">
              <path
                d="M72 0H0V72"
                fill="none"
                stroke="#84938b"
                strokeOpacity=".09"
                strokeWidth=".6"
              />
            </pattern>
            <pattern
              id="atlas-hatch"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(35)"
            >
              <path d="M0 0V10" stroke="#c6a15b" strokeOpacity=".08" />
            </pattern>
            <radialGradient id="atlas-land">
              <stop stopColor="#354137" />
              <stop offset="1" stopColor="#222c29" />
            </radialGradient>
            <clipPath id="atlas-land-clip">
              <path d={outline} />
            </clipPath>
            <filter id="atlas-shadow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="12" stdDeviation="24" floodColor="#000" floodOpacity=".3" />
            </filter>
          </defs>
          <rect width="1200" height="800" fill="url(#atlas-grid)" />
          <g stroke="#50636a" strokeOpacity=".25" strokeWidth="1" fill="none">
            <path d="M0 230 90 190 170 160 200 120 360 90 600 55 730 65 900 100 1100 220 1200 280M0 530 150 560 230 540 330 620 390 710 620 760 850 706 960 659 1080 702 1200 680" />
            <path d="M100 480c80-30 70 160 130 200s80 110 20 150M900 600c50 30 100-12 110 45s100 110 190 75" />
          </g>
          <path
            d="M63 328c-24 40 19 54 27 96s-22 83 10 112 29 64 67 43 24-64 5-95-4-49-21-89-69-89-88-67Z"
            fill="#152b35"
            stroke="#31515a"
            strokeWidth="1"
          />
          <path
            d={outline}
            fill="url(#atlas-land)"
            stroke="#6a7462"
            strokeWidth="1.3"
            filter="url(#atlas-shadow)"
          />
          <g clipPath="url(#atlas-land-clip)">
            <path d={outline} fill="url(#atlas-hatch)" />
            {layers.terrain && (
              <g
                data-testid="atlas-terrain-layer"
                fill="none"
                stroke="#97a184"
                strokeWidth=".7"
                opacity=".22"
              >
                {Array.from({ length: 19 }, (_, index) => (
                  <path
                    key={index}
                    d={`M${900 - index * 15} ${212 + index * 9}c-95 26-72 90-145 111s-72 105-158 125-53 77-130 108 18 54-34 89M${1070 - index * 12} ${287 + index * 9}c-66 19-49 72-110 112s-36 51-106 77-58 57-141 93`}
                  />
                ))}
                {Array.from({ length: 8 }, (_, index) => (
                  <ellipse
                    key={index}
                    cx="402"
                    cy="297"
                    rx={50 + index * 19}
                    ry={24 + index * 12}
                    transform="rotate(-22 402 297)"
                  />
                ))}
              </g>
            )}
            {layers.territories && (
              <g data-testid="atlas-territories-layer">
                <path
                  d="M353 426 467 327 618 343 746 405 814 521 730 619 580 652 463 559Z"
                  fill="#c6a15b"
                  fillOpacity=".11"
                />
                <path
                  d="m756 240 181-23 117 157-72 130-145-32-89-90Z"
                  fill="#7fa89b"
                  fillOpacity=".07"
                />
              </g>
            )}
            {layers.borders && (
              <path
                data-testid="atlas-borders-layer"
                d="M353 426 467 327 618 343 746 405 814 521 730 619 580 652 463 559Z"
                fill="none"
                stroke="#c6a15b"
                strokeOpacity=".65"
                strokeDasharray="5 5"
              />
            )}
            <g stroke="#567782" strokeWidth="1.5" fill="none" opacity=".6">
              <path d="M859 264q-37 62-20 93t-38 72q-6 26-58 48M402 491q63-32 84 5t53 31q11 25 40 64" />
              <path d="m754 528 52-7 28 5-39 10Z" fill="#30505a" />
            </g>
          </g>
          {layers.modern && (
            <path
              data-testid="atlas-modern-layer"
              d={outline}
              fill="none"
              stroke="#a4c6ba"
              strokeWidth="2"
              strokeDasharray="3 5"
            />
          )}
          {layers.trade && (
            <g data-testid="atlas-trade-layer" fill="none">
              <path
                d="M311 686Q403 599 485 530T779 564Q889 549 1048 433"
                stroke="#c6a15b"
                strokeOpacity=".09"
                strokeWidth="12"
              />
              <path
                d="M311 686Q403 599 485 530T779 564Q889 549 1048 433"
                stroke="#c6a15b"
                strokeOpacity=".7"
                strokeWidth="1.8"
                strokeDasharray="5 7"
              />
            </g>
          )}
          <text x="603" y="399" textAnchor="middle" className="atlas-country-label">
            {text.country}
          </text>
          <g className="atlas-geographic-label">
            <text x="990" y="242" transform="rotate(25 990 242)">
              ALTAI
            </text>
            <text x="793" y="637">
              TIAN SHAN
            </text>
            <text x="68" y="478" transform="rotate(-75 68 478)">
              CASPIAN SEA
            </text>
            <text x="349" y="741">
              CENTRAL ASIA
            </text>
          </g>
        </svg>
        {layers.settlements &&
          objects.map((object) => (
            <button
              key={object.id}
              id={`atlas-marker-${object.id}`}
              className={`atlas-marker ${selectedId === object.id ? "is-selected" : ""}`}
              style={{ left: `${object.position[0] / 12}%`, top: `${object.position[1] / 8}%` }}
              onClick={() => onSelect(object.id)}
              aria-label={`${text.selected}: ${atlasLocal(object.name, language)}`}
              aria-pressed={selectedId === object.id}
            >
              <span className="atlas-marker-point" aria-hidden="true" />
              <span className="atlas-marker-label">
                {atlasLocal(object.name, language)}
                {selectedId === object.id && <small>{atlasLocal(object.era, language)}</small>}
              </span>
            </button>
          ))}
      </div>
      <div className="atlas-map-tools">
        <span className="atlas-north" aria-hidden="true">
          {text.north}
          <i>↑</i>
        </span>
        <div className="atlas-zoom">
          <button
            aria-label={text.zoomIn}
            disabled={zoom >= 1.6}
            onClick={() => setZoom((value) => Math.min(1.6, value + 0.2))}
          >
            +
          </button>
          <button
            aria-label={text.zoomOut}
            disabled={zoom <= 0.8}
            onClick={() => setZoom((value) => Math.max(0.8, value - 0.2))}
          >
            −
          </button>
          <button aria-label={text.resetView} onClick={() => setZoom(1)}>
            <AtlasIcon name="compass" size={18} />
          </button>
        </div>
      </div>
      {!objects.length && (
        <div className="atlas-map-empty" role="status">
          <AtlasIcon name="search" />
          <p>{text.noObjects}</p>
          <button onClick={onResetFilters}>{text.reset}</button>
        </div>
      )}
      <div className="atlas-map-legend">
        <span>
          <i className="atlas-legend-fill" />
          {text.territories}
        </span>
        <span>
          <i className="atlas-legend-line" />
          {text.trade}
        </span>
        <span>
          <i className="atlas-legend-point" />
          {text.settlements}
        </span>
      </div>
      <div className="atlas-map-status">
        <span className="atlas-status-dot" />
        {text.pending}
        <span className="atlas-map-status-divider">·</span>
        <small>{text.schematic}</small>
      </div>
    </section>
  );
}
