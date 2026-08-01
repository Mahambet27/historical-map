import { getSourcesByIds } from "../../services/historicalSourcesService.js";
import { getPlaceNameAtYear } from "./historicalPlaceNames.js";

const local = (value, language) => value?.[language] || value?.ru || "";

export default function ExhibitionRoutePanel({
  route,
  places,
  year,
  language,
  text,
  onClose,
  onShowAll,
  onJourney,
  onStory,
  onPlace,
  onSources,
  onEvidence,
  onHide,
}) {
  if (!route) return null;
  const sources = getSourcesByIds(route.sourceIds);
  return (
    <section className="ex-panel ex-route-panel" aria-labelledby="route-panel-title">
      <header className="ex-panel__header">
        <div>
          <span className="ex-kicker">{route.validFromYear} — {route.validToYear}</span>
          <h2 id="route-panel-title">{local(route.names, language)}</h2>
        </div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      <p className="ex-panel__lead">{local(route.summaries, language)}</p>
      <dl className="ex-route-panel__facts">
        <div><dt>{language === "en" ? "Type" : "Тип"}</dt><dd>{route.routeType}</dd></div>
        <div><dt>{language === "en" ? "Confidence" : "Достоверность"}</dt><dd>{route.confidenceLevel}</dd></div>
        <div><dt>{language === "en" ? "Review" : "Проверка"}</dt><dd>{route.verificationStatus}</dd></div>
      </dl>
      <section>
        <h3>{language === "en" ? "Key cities" : language === "kk" ? "Негізгі қалалар" : "Ключевые города"}</h3>
        <div className="ex-route-panel__places">
          {places.map((place) => (
            <button key={place.id} onClick={() => onPlace?.(place)}>
              {getPlaceNameAtYear(place, year, language)}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>{language === "en" ? "Trade" : "Роль в торговле"}</h3>
        <p>{route.goods.length ? route.goods.join(", ") : language === "en" ? "No unsourced goods list is shown." : "Список товаров без отдельного источника не показывается."}</p>
      </section>
      <section>
        <h3>{language === "en" ? "Cultural exchange" : "Культурный обмен"}</h3>
        <p>{local(route.culturalRoles, language)}</p>
      </section>
      <section>
        <h3>{language === "en" ? "Political role" : "Политическое значение"}</h3>
        <p>{local(route.politicalRoles, language)}</p>
      </section>
      <div className="ex-disclaimer">
        ⓘ {language === "en"
          ? "Reconstructed direction; it is not an exact itinerary."
          : language === "kk"
            ? "Реконструкцияланған бағыт; бұл дәл маршрут емес."
            : "Реконструированное направление маршрута; это не точный путь следования."}
      </div>
      <small>{sources.length} {language === "en" ? "sources" : "источника"}</small>
      <div className="ex-panel__actions ex-route-panel__actions">
        <button onClick={onShowAll}>⌖ {language === "en" ? "Show full route" : "Показать весь маршрут"}</button>
        <button className="is-primary" onClick={onJourney}>▶ {language === "en" ? "Start journey" : "Начать путешествие"}</button>
        <button onClick={onStory}>▣ {language === "en" ? "Geography story" : language === "kk" ? "География тарихы" : "История о географии"}</button>
        <button onClick={() => places[0] && onPlace?.(places[0])}>◇ {language === "en" ? "Open city" : "Открыть город"}</button>
        <button onClick={() => onSources?.(route.sourceIds)}>▤ {text.sources}</button>
        <button onClick={onEvidence}>◇ {language === "en" ? "Evidence" : language === "kk" ? "Дәлелдер" : "Доказательства"}</button>
        <button onClick={onHide}>× {language === "en" ? "Hide route" : "Скрыть маршрут"}</button>
      </div>
    </section>
  );
}
