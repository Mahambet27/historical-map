import { formatHistoricalYear } from "./timeline/historicalYear.js";

const materialCount = (era) =>
  [
    era.featuredEntityIds,
    era.featuredPlaceIds,
    era.featuredEventIds,
    era.featuredStoryIds,
  ].reduce((total, items) => total + (items?.length || 0), 0);

export default function ExhibitionEraSelector({
  eras,
  selectedEraId,
  language,
  text,
  onSelect,
}) {
  return (
    <section className="ex-era-selector" aria-label={text.eraSelector}>
      <span className="ex-kicker">{text.eraSelector}</span>
      <div>
        {eras.map((era) => {
          const incomplete = era.verificationStatus !== "reviewed";
          return (
            <button
              type="button"
              key={era.id}
              className={era.id === selectedEraId ? "is-active" : ""}
              onClick={() => onSelect(era.id)}
              aria-current={era.id === selectedEraId ? "true" : undefined}
            >
              {era.names?.[language] || era.title?.[language] || era.names?.ru}
              <small>
                {formatHistoricalYear(era.fromYear, language)}—
                {formatHistoricalYear(era.toYear, language)}
              </small>
              <span className="ex-era-selector__meta">
                {materialCount(era)}{" "}
                {language === "en"
                  ? "materials"
                  : language === "kk"
                    ? "материал"
                    : "материалов"}
                {incomplete && (
                  <i
                    title={
                      language === "en"
                        ? "Coverage is incomplete"
                        : language === "kk"
                          ? "Деректер толық емес"
                          : "Данные неполные"
                    }
                    aria-label={
                      language === "en"
                        ? "incomplete data"
                        : language === "kk"
                          ? "толық емес деректер"
                          : "неполные данные"
                    }
                  >
                    !
                  </i>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
