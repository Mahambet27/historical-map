import { EXHIBITION_LAYERS } from "./layerRegistry.js";
import HistoricalDataStatus from "./HistoricalDataStatus.jsx";

const copy = {
  ru: {
    title: "Слои карты",
    reset: "Сбросить слои",
    categories: {
      politics: "Политика",
      places: "Города и археология",
      routes: "Маршруты",
      environment: "Природная среда",
      education: "Образовательные материалы",
      research: "Источники и исследования",
    },
    layers: {
      politicalTerritories: "Политические территории",
      historicalPlaces: "Исторические города",
      archaeology: "Археологические объекты",
      tradeRoutes: "Торговые маршруты",
      nomadicRoutes: "Кочевые маршруты",
      militaryRoutes: "Военные маршруты",
      hydrology: "Реки и водоёмы",
      environment: "Природные зоны",
      events: "События",
      people: "Личности",
      "3dObjects": "3D-объекты",
      atmosphere: "Атмосфера эпохи",
      archiveMaps: "Архивные карты",
    },
  },
  kk: {
    title: "Карта қабаттары",
    reset: "Қабаттарды қалпына келтіру",
    categories: {
      politics: "Саясат",
      places: "Қалалар және археология",
      routes: "Бағыттар",
      environment: "Табиғи орта",
      education: "Оқу материалдары",
      research: "Дереккөздер және зерттеулер",
    },
    layers: {},
  },
  en: {
    title: "Map layers",
    reset: "Reset layers",
    categories: {
      politics: "Politics",
      places: "Cities and archaeology",
      routes: "Routes",
      environment: "Natural environment",
      education: "Educational materials",
      research: "Sources and research",
    },
    layers: {
      politicalTerritories: "Political territories",
      historicalPlaces: "Historical cities",
      archaeology: "Archaeological sites",
      tradeRoutes: "Trade routes",
      nomadicRoutes: "Nomadic routes",
      militaryRoutes: "Military routes",
      hydrology: "Rivers and water bodies",
      environment: "Environment zones",
      events: "Events",
      people: "People",
      "3dObjects": "3D objects",
      atmosphere: "Era atmosphere",
      archiveMaps: "Archive maps",
    },
  },
};
copy.kk.layers = {
  ...copy.ru.layers,
  politicalTerritories: "Саяси аумақтар",
  historicalPlaces: "Тарихи қалалар",
  archaeology: "Археологиялық нысандар",
  tradeRoutes: "Сауда бағыттары",
  nomadicRoutes: "Көшпелі бағыттар",
  militaryRoutes: "Әскери бағыттар",
  hydrology: "Өзендер мен су айдындары",
  environment: "Табиғи аймақтар",
  atmosphere: "Дәуір атмосферасы",
};

export default function ExhibitionLayerPanel({
  language,
  text,
  state,
  quality,
  onToggle,
  onReset,
  onOpenArchive,
  dataStatus,
  onRetryData,
  onClose,
}) {
  const t = copy[language] || copy.ru;
  const categories = [...new Set(EXHIBITION_LAYERS.map((item) => item.category))];
  return (
    <section className="ex-panel ex-layer-panel" aria-labelledby="layer-panel-title">
      <header className="ex-panel__header">
        <div>
          <span className="ex-kicker">P1B</span>
          <h2 id="layer-panel-title">{t.title}</h2>
        </div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      {categories.map((category) => (
        <fieldset key={category}>
          <legend>{t.categories[category]}</legend>
          {EXHIBITION_LAYERS.filter((item) => item.category === category).map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                checked={Boolean(state[item.id])}
                disabled={!item.supportedQualityModes.includes(quality)}
                onChange={(event) => onToggle(item.id, event.target.checked)}
                aria-label={t.layers[item.id]}
              />
              <span>{t.layers[item.id]}</span>
              {["needs_review", "demo_only"].includes(item.verificationStatus) && <small>○</small>}
            </label>
          ))}
        </fieldset>
      ))}
      {state.archiveMaps && (
        <button className="ex-source-link" onClick={onOpenArchive}>
          ▧ {t.layers.archiveMaps}
        </button>
      )}
      {dataStatus && (
        <HistoricalDataStatus
          compact
          language={language}
          activeRepository={dataStatus.activeRepository}
          fallbackReason={dataStatus.fallbackReason}
          onRetry={onRetryData}
        />
      )}
      <button className="ex-layer-panel__reset" onClick={onReset}>↺ {t.reset}</button>
    </section>
  );
}
