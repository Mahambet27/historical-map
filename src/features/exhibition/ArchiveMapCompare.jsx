import { useRef, useState } from "react";

const clamp = (value) => Math.max(0, Math.min(100, value));

export default function ArchiveMapCompare({
  archiveMap,
  language,
  text,
  reducedMotion,
  onClose,
}) {
  const [position, setPosition] = useState(50);
  const areaRef = useRef(null);
  const updateFromPointer = (clientX) => {
    const box = areaRef.current?.getBoundingClientRect();
    if (!box?.width) return;
    setPosition(clamp(((clientX - box.left) / box.width) * 100));
  };
  const labels = language === "en"
    ? { title: "Compare map and reconstruction", archive: "Educational or archival material", reconstruction: "Qazaq Heritage Map digital reconstruction", reset: "Reset comparison to 50%", warning: "Aligning two maps does not prove boundary accuracy. It is intended for visual analysis of differences between a source and a digital reconstruction." }
    : language === "kk"
      ? { title: "Карта мен реконструкцияны салыстыру", archive: "Оқу немесе архивтік материал", reconstruction: "Qazaq Heritage Map цифрлық реконструкциясы", reset: "Салыстыруды 50%-ға қайтару", warning: "Екі картаны беттестіру шекаралардың дәлдігін дәлелдемейді. Бұл дереккөз бен цифрлық реконструкция арасындағы айырмашылықтарды көрнекі талдауға арналған." }
      : { title: "Сравнение карты и реконструкции", archive: "Архивный или реконструированный материал", reconstruction: "Цифровая историческая реконструкция Qazaq Heritage Map", reset: "Сбросить сравнение на 50%", warning: "Совмещение двух карт не доказывает точность границ. Оно предназначено для визуального анализа различий между источником и цифровой реконструкцией." };
  return (
    <section className={`ex-panel ex-archive-compare ${reducedMotion ? "is-reduced-motion" : ""}`} aria-labelledby="archive-compare-title">
      <header className="ex-panel__header">
        <div><span className="ex-kicker">P1C · SWIPE</span><h2 id="archive-compare-title">{labels.title}</h2></div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      <div
        className="ex-archive-swipe"
        ref={areaRef}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event.clientX);
        }}
      >
        <div className="ex-archive-swipe__reconstruction"><span>{labels.reconstruction}</span></div>
        <div className="ex-archive-swipe__archive" style={{ width: `${position}%`, backgroundImage: `url("${archiveMap.imageUrl}")` }}><span>{labels.archive}</span></div>
        <div
          className="ex-archive-swipe__handle"
          role="slider"
          tabIndex="0"
          aria-label={labels.title}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(position)}
          style={{ left: `${position}%` }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setPosition((value) => clamp(value - 5));
            if (event.key === "ArrowRight") setPosition((value) => clamp(value + 5));
            if (event.key === "Home") setPosition(0);
            if (event.key === "End") setPosition(100);
          }}
        ><span>↔</span></div>
      </div>
      <p className="sr-only">{labels.archive}. {labels.reconstruction}. {labels.warning}</p>
      <div className="ex-disclaimer">ⓘ {labels.warning}</div>
      <button onClick={() => setPosition(50)}>↺ {labels.reset}</button>
    </section>
  );
}
