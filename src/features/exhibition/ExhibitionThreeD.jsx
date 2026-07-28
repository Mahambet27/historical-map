import { useEffect, useRef, useState } from "react";

const MODEL_VIEWER_URL = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

const loadModelViewer = () => {
  if (window.customElements?.get("model-viewer")) return Promise.resolve();
  const existing = document.querySelector('script[data-exhibition-model-viewer="true"]');
  if (existing) return new Promise((resolve, reject) => {
    existing.addEventListener("load", resolve, { once: true });
    existing.addEventListener("error", reject, { once: true });
  });
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = MODEL_VIEWER_URL;
    script.dataset.exhibitionModelViewer = "true";
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
};

export default function ExhibitionThreeD({ language, text, onClose }) {
  const viewerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadModelViewer().then(() => setReady(true)).catch(() => setFailed(true));
  }, []);
  return (
    <section className="ex-panel ex-3d-panel">
      <header className="ex-panel__header"><div><span className="ex-kicker">{text.threeD}</span><h2>{language === "en" ? "Bory Tastagan heritage model" : language === "kk" ? "Бөрітостаған мұра нысанының моделі" : "Модель объекта наследия Боры Тастаган"}</h2></div><button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button></header>
      <div className="ex-3d-stage">
        {!ready && !failed && <div className="ex-3d-loading"><i />{language === "en" ? "Loading local 3D model…" : language === "kk" ? "Жергілікті 3D модель жүктелуде…" : "Загружаем локальную 3D-модель…"}</div>}
        {failed && <div className="ex-3d-fallback">◇<strong>{language === "en" ? "3D viewer is unavailable offline" : language === "kk" ? "3D қарау құралы офлайн қолжетімсіз" : "3D-просмотр недоступен без сети"}</strong></div>}
        {ready && <model-viewer ref={viewerRef} src="/models/bory_tastagan_3d_model.glb" camera-controls auto-rotate shadow-intensity="1" interaction-prompt="none" loading="eager" alt={text.reconstruction} />}
      </div>
      <p className="ex-disclaimer">ⓘ {text.reconstruction}</p>
      <button className="ex-secondary" onClick={() => {
        if (viewerRef.current) {
          viewerRef.current.cameraOrbit = "auto auto auto";
          viewerRef.current.cameraTarget = "auto auto auto";
          viewerRef.current.fieldOfView = "auto";
        }
      }}>↻ {text.resetView}</button>
    </section>
  );
}
