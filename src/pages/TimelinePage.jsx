import { useMemo, useState } from "react";
import { Link } from "../app/router.jsx";

const periods = [
  ["Древность", "III тыс. до н.э. — V век", "Ботайская культура, сакские союзы и города Великого шёлкового пути."],
  ["Тюркская эпоха", "VI — XII века", "Тюркские каганаты формируют политическую и культурную карту степи."],
  ["Монгольская эпоха", "XIII — XIV века", "Улус Джучи и Золотая Орда объединяют огромные пространства Евразии."],
  ["Казахское ханство", "XV — XVIII века", "Становление ханства, укрепление государственности и борьба за единство."],
  ["Новое время", "XIX — начало XX века", "Административные реформы, просветительство и национальное движение."],
  ["Современность", "XX — XXI века", "Путь от Казахской АССР к независимой Республике Казахстан."],
];

export default function TimelinePage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => periods.filter(x => x.join(" ").toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className="content-page"><header className="page-hero"><p className="eyebrow"><span></span> Машина времени</p><h1>История Казахстана<br /><em>по эпохам</em></h1><p>Перемещайтесь по временной шкале и открывайте связанные территории, события и личности.</p></header><div className="content-toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} type="search" placeholder="Найти эпоху или событие…"/><Link to="/map">Показать на карте →</Link></div><div className="timeline-list">{filtered.map((item,index)=><article key={item[0]}><span>{String(index+1).padStart(2,"0")}</span><div><small>{item[1]}</small><h2>{item[0]}</h2><p>{item[2]}</p></div><Link to="/map">Исследовать эпоху ↗</Link></article>)}</div></div>;
}
