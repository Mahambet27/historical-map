import { timelineStates } from "../../data/exhibition/timeline.js";
import { formatHistoricalYear } from "../../services/historicalTimelineService.js";

export default function ExhibitionComparePanel({ comparison, language, text, onChange, onClose }) {
  const first = timelineStates.find((item) => item.year === comparison.firstYear) || timelineStates[2];
  const second = timelineStates.find((item) => item.year === comparison.secondYear) || timelineStates[3];
  const local = (value) => value[language] || value.ru;
  return (
    <section className="ex-panel ex-compare-panel">
      <header className="ex-panel__header"><div><span className="ex-kicker">1465 ↔ 1511</span><h2>{text.compareTitle}</h2></div><button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button></header>
      <div className="ex-compare-panel__selectors">
        <label><span>A</span><select value={first.year} onChange={(event) => onChange({ ...comparison, firstYear: Number(event.target.value) })}>{timelineStates.map((item) => <option key={item.id} value={item.year}>{formatHistoricalYear(item.year, language)} · {local(item.title)}</option>)}</select></label>
        <b>↔</b>
        <label><span>B</span><select value={second.year} onChange={(event) => onChange({ ...comparison, secondYear: Number(event.target.value) })}>{timelineStates.map((item) => <option key={item.id} value={item.year}>{formatHistoricalYear(item.year, language)} · {local(item.title)}</option>)}</select></label>
      </div>
      <div className="ex-compare-legend"><span><i className="is-a" />{local(first.title)}</span><span><i className="is-b" />{local(second.title)}</span><span><i className="is-overlap" />{language === "en" ? "Overlap" : language === "kk" ? "Қабаттасу" : "Пересечение"}</span></div>
      <p className="ex-panel__lead">
        {language === "en"
          ? "The curated reconstructions indicate a broader territorial reach under Kasym Khan than in the formation period. The exact extent remains debated."
          : language === "kk"
            ? "Дайын реконструкциялар Қасым хан тұсында аумақтық ықпалдың құрылу кезеңімен салыстырғанда кеңірек болғанын көрсетеді. Нақты шекаралар пікірталас тудырады."
            : "Проверенные реконструкции показывают более широкий территориальный охват при Касым хане по сравнению с периодом образования. Точные контуры остаются предметом дискуссии."}
      </p>
      <div className="ex-disclaimer">ⓘ {text.disclaimer}</div>
    </section>
  );
}
