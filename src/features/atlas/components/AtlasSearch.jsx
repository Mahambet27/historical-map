import { useState } from "react";
import { atlasLocal, atlasCategories } from "../data/atlasDemoData.js";
import AtlasIcon from "./AtlasIcon.jsx";

export default function AtlasSearch({ query, onQuery, results, onSelect, language, text }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="atlas-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="atlas-search-field">
        <AtlasIcon name="search" />
        <input
          type="search"
          aria-label={text.searchLabel}
          placeholder={text.search}
          value={query}
          aria-controls={open && query ? "atlas-search-results" : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              event.stopPropagation();
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              event.currentTarget
                .closest(".atlas-search")
                .querySelector(".atlas-search-result")
                ?.focus();
            }
            if (event.key === "Enter" && query && results[0]) {
              onSelect(results[0].id);
              setOpen(false);
            }
          }}
        />
        {query ? (
          <button
            className="atlas-icon-button"
            aria-label={text.clear}
            onClick={() => {
              onQuery("");
              setOpen(false);
            }}
          >
            <AtlasIcon name="close" size={16} />
          </button>
        ) : (
          <span className="atlas-search-hint" aria-hidden="true">
            ⌕
          </span>
        )}
      </div>
      {open && query.trim() && (
        <div id="atlas-search-results" className="atlas-search-results" aria-label={text.results}>
          <p className="atlas-eyebrow">
            {text.results} <span>{results.length.toString().padStart(2, "0")}</span>
          </p>
          {results.length ? (
            results.map((object) => (
              <button
                key={object.id}
                className="atlas-search-result"
                onClick={() => {
                  onSelect(object.id);
                  setOpen(false);
                }}
              >
                <AtlasIcon name="pin" size={17} />
                <span>
                  <strong>{atlasLocal(object.name, language)}</strong>
                  <small>
                    {atlasLocal(
                      atlasCategories.find((category) => category.id === object.category).name,
                      language
                    )}{" "}
                    · {atlasLocal(object.era, language)}
                  </small>
                </span>
                <AtlasIcon name="arrow" size={16} />
              </button>
            ))
          ) : (
            <p role="status">{text.noResults}</p>
          )}
        </div>
      )}
    </div>
  );
}
