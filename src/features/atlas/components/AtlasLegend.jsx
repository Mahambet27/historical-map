const translations = {
  ru: {
    title: "Достоверность и реконструкция", levels: ["Высокая", "Средняя", "Низкая / не указана"],
    opacity: "Прозрачность территории показывает уровень достоверности.",
    reconstruction: "Реконструкция — интерпретация источников, а не точная историческая граница.",
    reviewed: "Показаны только reviewed / verified записи.",
    routes: "Для этого года нет проверенной геометрии маршрутов.",
    events: "Для этого года нет проверенных точек событий и сражений.",
  },
  kk: {
    title: "Сенімділік және реконструкция", levels: ["Жоғары", "Орташа", "Төмен / көрсетілмеген"],
    opacity: "Аумақтың мөлдірлігі сенімділік деңгейін көрсетеді.",
    reconstruction: "Реконструкция — нақты тарихи шекара емес, дереккөздердің түсіндірмесі.",
    reviewed: "Тек reviewed / verified жазбалар көрсетіледі.",
    routes: "Бұл жылға тексерілген бағыт геометриясы жоқ.",
    events: "Бұл жылға тексерілген оқиға мен шайқас нүктелері жоқ.",
  },
  en: {
    title: "Confidence and reconstruction", levels: ["High", "Medium", "Low / unspecified"],
    opacity: "Territory opacity indicates confidence.",
    reconstruction: "Reconstruction interprets sources; it is not an exact historical boundary.",
    reviewed: "Only reviewed / verified overlay records are displayed.",
    routes: "No reviewed route geometry for this year.",
    events: "No reviewed event or battle points for this year.",
  },
};

export default function AtlasLegend({ language, historical, layers }) {
  const text = translations[language];
  return (
    <section className="atlas-legend" aria-label={text.title}>
      <h3 className="atlas-section-title">{text.title}</h3>
      <ul>{text.levels.map((label, index) => <li key={label}>
        <i aria-hidden="true" style={{ backgroundColor: `rgba(198, 161, 91, ${[0.22, 0.16, 0.1][index]})` }} />{label}
      </li>)}</ul>
      <p>{text.opacity}</p><p>{text.reconstruction}</p><p>{text.reviewed}</p>
      {layers.trade && !historical.routes.features.length && <p>{text.routes}</p>}
      {layers.events && !historical.events.features.length && <p>{text.events}</p>}
    </section>
  );
}
