import { EXHIBITION_LAYERS } from "./layerRegistry.js";
import HistoricalDataStatus from "./HistoricalDataStatus.jsx";
import {
  DEFAULT_HISTORICAL_MAP_PRESET,
  HISTORICAL_MAP_PRESETS,
} from "./historicalMapPresets.js";

const copy = {
  ru: {
    title: "Слои карты",
    view: "Вид карты",
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
      stateLabels: "Названия государств",
      uncertainty: "Неопределённость границ",
      historicalPlaces: "Исторические города",
      archaeology: "Археологические объекты",
      tradeRoutes: "Торговые маршруты",
      nomadicRoutes: "Кочевые маршруты",
      militaryRoutes: "Военные маршруты",
      hydrology: "Реки и водоёмы",
      environment: "Природные зоны",
      terrain: "Рельеф",
      events: "События",
      people: "Личности",
      "3dObjects": "3D-объекты",
      atmosphere: "Атмосфера эпохи",
      archiveMaps: "Архивные карты",
    },
  },
  kk: {
    title: "Карта қабаттары",
    view: "Карта көрінісі",
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
    view: "Map view",
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
      stateLabels: "State names",
      uncertainty: "Boundary uncertainty",
      historicalPlaces: "Historical cities",
      archaeology: "Archaeological sites",
      tradeRoutes: "Trade routes",
      nomadicRoutes: "Nomadic routes",
      militaryRoutes: "Military routes",
      hydrology: "Rivers and water bodies",
      environment: "Environment zones",
      terrain: "Terrain",
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
  stateLabels: "Мемлекет атаулары",
  uncertainty: "Шекара белгісіздігі",
  terrain: "Жер бедері",
};

export default function ExhibitionLayerPanel({
  language,
  text,
  state,
  quality,
  onToggle,
  onReset,
  preset = DEFAULT_HISTORICAL_MAP_PRESET,
  onPreset,
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
      <label className="ex-layer-panel__preset">
        <span>{t.view}</span>
        <select value={preset} onChange={(event) => onPreset?.(event.target.value)}>
          {Object.keys(HISTORICAL_MAP_PRESETS).map((id) => (
            <option key={id} value={id}>
              {id === "clean"
                ? language === "en" ? "Clean historical" : language === "kk" ? "Таза тарихи" : "Чистая историческая"
                : id === "political"
                  ? language === "en" ? "Political" : language === "kk" ? "Саяси" : "Политическая"
                  : id === "geography"
                    ? language === "en" ? "Era geography" : language === "kk" ? "Дәуір географиясы" : "География эпохи"
                    : language === "en" ? "Routes" : language === "kk" ? "Бағыттар" : "Маршруты"}
            </option>
          ))}
        </select>
      </label>
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
