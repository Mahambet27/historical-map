import { useMemo, useState } from "react";
import {
  canDisplayFullArchiveMap,
  getArchiveMapRightsNotice,
} from "./archiveMapRights.js";

const local = (value, language) => value?.[language] || value?.ru || "";

export default function ArchiveMapPanel({
  maps,
  selectedMapId,
  opacity,
  overlayEnabled,
  aboveReconstruction,
  language,
  text,
  onSelect,
  onToggleOverlay,
  onOpacity,
  onCompare,
  onOrder,
  onSource,
  onReset,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [institution, setInstitution] = useState("all");
  const [license, setLicense] = useState("all");
  const filtered = useMemo(
    () =>
      maps.filter((map) => {
        const haystack = `${local(map.titles, language)} ${map.institution.name}`.toLowerCase();
        const matchesYear = !year || map.mapDate === Number(year);
        return (
          haystack.includes(query.toLowerCase()) &&
          matchesYear &&
          (institution === "all" || map.institution.name === institution) &&
          (license === "all" || map.license.status === license)
        );
      }),
    [institution, language, license, maps, query, year]
  );
  const institutions = [...new Set(maps.map((map) => map.institution.name))];
  const licenses = [...new Set(maps.map((map) => map.license.status))];
  const labels = language === "en"
    ? { title: "Archive maps", search: "Search maps", year: "Map year", institution: "Institution", license: "License", overlay: "Show overlay", compare: "Compare with reconstruction", reset: "Reset overlay", source: "Open source", rights: "Rights", opacity: "Overlay opacity", above: "Archive map over reconstruction", below: "Reconstruction over archive map" }
    : language === "kk"
      ? { title: "Архив карталары", search: "Карталарды іздеу", year: "Карта жылы", institution: "Мекеме", license: "Лицензия", overlay: "Қабаттауды көрсету", compare: "Реконструкциямен салыстыру", reset: "Қабаттауды қалпына келтіру", source: "Дереккөзді ашу", rights: "Құқықтар", opacity: "Қабат мөлдірлігі", above: "Архив картасы реконструкцияның үстінде", below: "Реконструкция архив картасының үстінде" }
      : { title: "Архивные карты", search: "Поиск карт", year: "Год карты", institution: "Учреждение", license: "Лицензия", overlay: "Показать overlay", compare: "Сравнить с реконструкцией", reset: "Сбросить overlay", source: "Открыть источник", rights: "Права использования", opacity: "Прозрачность overlay", above: "Архивная карта поверх реконструкции", below: "Реконструкция поверх архивной карты" };
  return (
    <section className="ex-panel ex-archive-panel" aria-labelledby="archive-panel-title">
      <header className="ex-panel__header">
        <div><span className="ex-kicker">P1C · ARCHIVE</span><h2 id="archive-panel-title">{labels.title}</h2></div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      <div className="ex-archive-filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.search} aria-label={labels.search} />
        <input value={year} onChange={(event) => setYear(event.target.value)} type="number" placeholder={labels.year} aria-label={labels.year} />
        <select value={institution} onChange={(event) => setInstitution(event.target.value)} aria-label={labels.institution}>
          <option value="all">{labels.institution}: —</option>
          {institutions.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={license} onChange={(event) => setLicense(event.target.value)} aria-label={labels.license}>
          <option value="all">{labels.license}: —</option>
          {licenses.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="ex-archive-list">
        {filtered.map((map) => {
          const allowed = canDisplayFullArchiveMap(map);
          const selected = selectedMapId === map.id;
          return (
            <article key={map.id} className={selected ? "is-selected" : ""}>
              {map.thumbnailUrl ? (
                <img src={map.thumbnailUrl} loading="lazy" alt={local(map.descriptions, language)} />
              ) : <div className="ex-archive-placeholder" aria-label="Preview unavailable">▧</div>}
              <div>
                <span className="ex-evidence-pattern" data-pattern={map.evidenceType}>◇</span>
                <h3>{local(map.titles, language)}</h3>
                <p>{local(map.descriptions, language)}</p>
                <dl>
                  <div><dt>{labels.year}</dt><dd>{map.mapDate || "—"} · {map.mapDatePrecision}</dd></div>
                  <div><dt>{labels.institution}</dt><dd>{map.institution.name}</dd></div>
                  <div><dt>{labels.license}</dt><dd>{map.license.status}</dd></div>
                  <div><dt>Attribution</dt><dd>{map.license.attributionRequired ? "required" : "not required"}</dd></div>
                  <div><dt>Commercial use</dt><dd>{String(map.license.commercialUseAllowed ?? "unknown")}</dd></div>
                  <div><dt>Modification</dt><dd>{String(map.license.modificationAllowed ?? "unknown")}</dd></div>
                  <div><dt>Download</dt><dd>{String(map.license.downloadAllowed ?? "unknown")}</dd></div>
                  <div><dt>Georeference</dt><dd>{map.georeferenceType}</dd></div>
                  <div><dt>Confidence</dt><dd>{map.confidenceLevel}</dd></div>
                </dl>
                <small>{getArchiveMapRightsNotice(map, language)}</small>
                <div className="ex-card-actions">
                  <button disabled={!allowed} onClick={() => onSelect(map)}>{allowed ? labels.overlay : labels.rights}</button>
                  <button onClick={() => onSource(map.sourceIds)}>{labels.source}</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {selectedMapId && (
        <div className="ex-archive-controls">
          <label>
            <span>{labels.opacity}: {Math.round(opacity * 100)}%</span>
            <input type="range" min="0" max="100" value={Math.round(opacity * 100)} onChange={(event) => onOpacity(Number(event.target.value) / 100)} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(opacity * 100)} />
          </label>
          <label><input type="checkbox" checked={overlayEnabled} onChange={(event) => onToggleOverlay(event.target.checked)} /> {labels.overlay}</label>
          <label><input type="checkbox" checked={aboveReconstruction} onChange={(event) => onOrder(event.target.checked)} /> {aboveReconstruction ? labels.above : labels.below}</label>
          <button onClick={onCompare}>{labels.compare}</button>
          <button onClick={onReset}>↺ {labels.reset}</button>
        </div>
      )}
    </section>
  );
}
