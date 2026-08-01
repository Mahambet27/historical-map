import { useState } from "react";
import {
  CITATION_FORMATS,
  CITATION_SAFETY_NOTICE,
  copyCitation,
  formatCitation,
} from "./citationFormatter.js";
import { recordExhibitionMetric } from "./performanceTelemetry.js";

export default function CitationExportPanel({ source, language, text, onClose }) {
  const [format, setFormat] = useState("short");
  const [copied, setCopied] = useState(false);
  const citation = formatCitation(source, format, language);
  return (
    <section className="ex-panel ex-citation-panel" aria-labelledby="citation-title">
      <header className="ex-panel__header">
        <div><span className="ex-kicker">P1C · CITATION</span><h2 id="citation-title">{language === "en" ? "Citation export" : language === "kk" ? "Дәйексөз экспорты" : "Экспорт цитирования"}</h2></div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      <select value={format} onChange={(event) => setFormat(event.target.value)} aria-label="Citation format">
        {CITATION_FORMATS.map((item) => <option key={item}>{item}</option>)}
      </select>
      <pre tabIndex="0">{citation}</pre>
      <p>{CITATION_SAFETY_NOTICE[language] || CITATION_SAFETY_NOTICE.ru}</p>
      <button onClick={async () => {
        await copyCitation(source, format, language);
        setCopied(true);
        recordExhibitionMetric("citation_copied", 1, { sourceId: source.id, format });
      }}>{copied ? "✓" : "⌁"} {language === "en" ? "Copy citation" : language === "kk" ? "Дәйексөзді көшіру" : "Скопировать цитирование"}</button>
    </section>
  );
}
