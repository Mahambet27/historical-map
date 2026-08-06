import { useState } from "react";
import { Link } from "../app/router.jsx";
import { useI18n } from "../app/i18n.jsx";

const eras = [
  { year: "1206", title: "Монгольская империя", short: "Формирование нового политического пространства Евразии.", x: 26, y: 42 },
  { year: "1243", title: "Золотая Орда", short: "Улус Джучи становится одной из ведущих держав региона.", x: 42, y: 33 },
  { year: "1428", title: "Ак Орда", short: "Политические традиции степных государств позднего Средневековья.", x: 55, y: 51 },
  { year: "1456", title: "Могулистан", short: "Керей и Жанибек переходят в западный Могулистан.", x: 68, y: 38 },
  { year: "1465", title: "Казахское ханство", short: "Начало самостоятельной истории Казахского ханства.", x: 75, y: 55 },
];

const features = [
  ["01", "Исторические территории", "Границы государств, ханств и культурных областей в контексте эпох."],
  ["02", "Машина времени", "Переходите между периодами и наблюдайте изменения пространства."],
  ["03", "События и личности", "Связанные биографии, события, маршруты и проверенные источники."],
  ["04", "Археология и наследие", "Памятники, древние города, курганы и цифровые реконструкции."],
];

const sections = [
  ["/demo", "Карта", "Исследовать объекты и территории", "⌖"], ["/events", "События", "Хронология ключевых событий", "◫"],
  ["/people", "Личности", "Правители, учёные и деятели", "◎"], ["/heritage", "Археология", "Памятники и древние города", "△"],
  ["/museums", "Музеи", "Коллекции и учреждения", "▣"], ["/education", "Образование", "Сценарии для школ и вузов", "◇"],
  ["/routes", "Маршруты", "Исторические и туристические пути", "↝"], ["/research", "Исследования", "Источники и научные данные", "≡"],
];

export default function LandingPage() {
  const { t } = useI18n();
  const [era, setEra] = useState(4);
  const active = eras[era];

  return (
    <div className="landing-page">
      <section className="hero">
        <div className="hero__grid">
          <div className="hero__copy">
            <p className="eyebrow"><span></span> Национальная цифровая платформа</p>
            <h1>История <em>Казахстана</em><br />на одной карте</h1>
            <p className="hero__subtitle">{t.subtitle}</p>
            <p className="hero__description">{t.description}</p>
            <div className="hero__actions"><Link className="button button--gold" to="/demo">{t.openMap} <span>→</span></Link><Link className="button button--ghost" to="/timeline">{t.explore} <span>⌄</span></Link></div>
            <div className="hero__stats"><div><strong>5 000+</strong><span>исторических объектов</span></div><div><strong>25</strong><span>веков истории</span></div><div><strong>3</strong><span>языка платформы</span></div></div>
          </div>
          <div className="hero-map" aria-label="Схематичная карта Казахстана">
            <div className="hero-map__glow"></div><div className="hero-map__shape"></div>
            <span className="map-line map-line--one"></span><span className="map-line map-line--two"></span>
            {[["Сарайчик",20,51],["Туркестан",48,68],["Тараз",58,77],["Семей",78,42],["Ботай",42,29]].map(([name,x,y],i)=><div key={name} className={`map-point map-point--${i}`} style={{left:`${x}%`,top:`${y}%`}}><i></i><span>{name}</span></div>)}
            <div className="hero-map__caption"><span>Интерактивный атлас</span><strong>48° 00′ N · 68° 00′ E</strong></div>
          </div>
        </div>
        <a className="scroll-cue" href="#possibilities"><span></span>Листайте, чтобы исследовать</a>
      </section>

      <section id="possibilities" className="section section--light"><div className="section-heading"><p className="eyebrow eyebrow--dark"><span></span> Возможности платформы</p><h2>История в пространстве<br />и времени</h2><p>Единая исследовательская среда связывает карту, хронологию и культурное наследие.</p></div><div className="feature-grid">{features.map(([n,title,text])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p><i>↗</i></article>)}</div></section>

      <section className="era-demo">
        <div className="era-demo__copy"><p className="eyebrow"><span></span> Интерактивная демонстрация</p><h2>Рождение<br /><em>Казахского ханства</em></h2><p>{active.short}</p><Link to="/events/kazakh-khanate" className="text-link">Открыть историю события <span>→</span></Link></div>
        <div className="era-map"><div className="era-map__territory" style={{transform:`translate(${(era-2)*5}px, ${(era-2)*-3}px) scale(${.86+era*.05})`}}></div><div className="era-map__label">{active.title}<small>{active.year} год</small></div><div className="era-map__capital" style={{left:`${active.x}%`,top:`${active.y}%`}}><i></i></div></div>
        <div className="era-steps">{eras.map((item,index)=><button key={item.title} className={era===index?"is-active":""} onClick={()=>setEra(index)}><span>{item.year}</span><strong>{item.title}</strong></button>)}</div>
      </section>

      <section className="section platform-sections"><div className="section-heading"><p className="eyebrow eyebrow--dark"><span></span> Исследуйте платформу</p><h2>История с разных сторон</h2></div><div className="section-cards">{sections.map(([to,title,text,icon])=><Link to={to} key={to}><span>{icon}</span><div><h3>{title}</h3><p>{text}</p></div><i>→</i></Link>)}</div></section>

      <section className="institutions"><div><p className="eyebrow"><span></span> Для организаций</p><h2>Сохраняем наследие<br />вместе</h2></div><p>Платформа помогает музеям, школам, университетам, туристическим организациям и государственным учреждениям публиковать и исследовать исторические материалы.</p><div className="institution-list">{["Музеи и архивы","Школы и университеты","Туристические организации","Государственные учреждения"].map(x=><span key={x}>✓ {x}</span>)}</div></section>

      <section className="final-cta"><p>Qazaq Heritage Map</p><h2>Станьте партнёром<br />цифровой истории</h2><div><Link className="button button--gold" to="/about">Предложить материал →</Link><a className="button button--ghost" href="mailto:heritage@example.kz">Запросить демонстрацию</a></div></section>
      <footer className="site-footer"><div className="brand"><span className="brand__mark">Q</span><span><strong>Qazaq Heritage</strong><small>Map of Kazakhstan</small></span></div><p>Демонстрационная версия цифровой историко-культурной платформы Казахстана.</p><span>© 2026 Qazaq Heritage Map</span></footer>
    </div>
  );
}
