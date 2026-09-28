import { useState } from "react";
import { atlasLocal } from "../data/atlasDemoData.js";
import AtlasIcon from "./AtlasIcon.jsx";
export default function AtlasObjectCard({ object, onClose, language, text }) {
  const [expanded, setExpanded] = useState(false);
  const category = { symbol: "◇", name: object.categoryLabel };
  return (
    <aside className="atlas-object-card" aria-label={text.focusCard}>
      <div className="atlas-card-topline">
        <span className="atlas-eyebrow">{text.selected}</span>
        <button
          className="atlas-icon-button"
          onClick={onClose}
          aria-label={`${text.close}: ${atlasLocal(object.name, language)}`}
        >
          <AtlasIcon name="close" size={18} />
        </button>
      </div>
      <div className="atlas-object-illustration" aria-hidden="true">
        <svg viewBox="0 0 320 152" fill="none">
          <defs>
            <pattern id="atlas-card-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" stroke="#c6a15b" strokeOpacity=".06" />
            </pattern>
          </defs>
          <path fill="url(#atlas-card-grid)" d="M0 0h320v152H0z" />
          <g stroke="#c6a15b" strokeWidth=".8">
            <path d="m15 122 135-45 159 41-139 35Z" opacity=".3" />
            <path d="m47 104 37-12V69l31-9 31 9v-9l18-6 26 9v25l27 7V72l29 8v35l-77 27-122-32ZM84 69l31 9 31-9m-31 9v27m31-36v37m18-52v47l26-13m27 7v22l29-10M84 92l31 13 49-16M47 104l122 32 77-27" />
            <path d="M101 67V47l14-8 14 8v17m-24-23 10-16 10 16M107 53h16m-9-1v19M56 101v-7l16-6v9m68 32v-15l12-4 9 3v21m19-4v-14l13-4v13M226 83v13l11 3V86" />
            <path d="m23 125 36 9m184-10 36-12M88 131l23 6" opacity=".4" />
          </g>
          <text x="20" y="27" fill="#c6a15b" fontSize="9" letterSpacing="2">
            FIELD NOTE / {object.index}
          </text>
        </svg>
        <span>{text.illustration}</span>
      </div>
      <div className="atlas-card-content">
        <div className="atlas-object-category">
          <span>{category.symbol}</span>
          {atlasLocal(category.name, language)}
          <span>№ {object.index}</span>
        </div>
        <h2>{atlasLocal(object.name, language)}</h2>
        <p className="atlas-object-period">
          {atlasLocal(object.era, language)}
          <span>·</span>
          {atlasLocal(object.date, language)}
        </p>
        <p className="atlas-object-description">{atlasLocal(object.description, language)}</p>
        <div className="atlas-confidence">
          <span>{text.confidence}</span>
          <strong>
            <i />
            {object.confidence ?? text.unknownConfidence}
          </strong>
        </div>
        <div className="atlas-object-sources">
          <AtlasIcon name="book" size={17} />
          <div>
            <strong>{text.sources}</strong>
            <p>
              {object.sources.length
                ? object.sources.map((source) => source.title || source.id).join("; ")
                : text.sourceNotice}
            </p>
          </div>
        </div>
        {expanded && (
          <p id="atlas-object-details" className="atlas-detail-notice">
            {object.verificationStatus || text.unknownConfidence}
          </p>
        )}
        <button
          className="atlas-primary-button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={expanded ? "atlas-object-details" : undefined}
        >
          {expanded ? text.less : text.details}
          <AtlasIcon name="arrow" size={18} />
        </button>
        <button className="atlas-future-button" disabled>
          <AtlasIcon name="cube" size={16} />
          {text.threeD}
        </button>
        {object.coordinates && (
          <div className="atlas-object-coordinates">
            <AtlasIcon name="pin" size={14} />
            <span>
              {Math.abs(object.coordinates[1]).toFixed(2)}° {object.coordinates[1] < 0 ? "S" : "N"},{" "}
              {Math.abs(object.coordinates[0]).toFixed(2)}° {object.coordinates[0] < 0 ? "W" : "E"}
              <small>
                {object.coordinatePrecision === "approximate"
                  ? text.coordinates
                  : object.coordinatePrecision || ""}
              </small>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
