import { useEffect, useRef } from "react";
import { getEraAtmosphere } from "../theme/eraThemes.js";
import { recordExhibitionMetric } from "../performanceTelemetry.js";

export default function ExhibitionAtmosphere({
  enabled,
  eraId,
  year,
  quality,
  reducedMotion,
  onAnimationState,
}) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled || quality === "light" || reducedMotion) {
      onAnimationState?.(false);
      return undefined;
    }
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    const config = getEraAtmosphere({ eraId, year });
    let frame = 0;
    let stopped = false;
    let lastDraw = 0;
    let sampleStarted = performance.now();
    let sampledFrames = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width));
      canvas.height = Math.max(1, Math.round(rect.height));
    };
    const draw = (time) => {
      if (stopped || document.hidden) return;
      if (time - lastDraw >= 1000 / 30) {
        lastDraw = time;
        sampledFrames += 1;
        context.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, config.color);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        if (config.type === "steppe-dust" || config.type === "soft-cloud") {
          context.fillStyle = config.color;
          const x = ((time / 80) % (canvas.width + 200)) - 100;
          context.beginPath();
          context.ellipse(x, canvas.height * 0.35, 150, 35, 0, 0, Math.PI * 2);
          context.fill();
        }
        if (time - sampleStarted >= 1000) {
          recordExhibitionMetric(
            "atmosphere-fps",
            (sampledFrames * 1000) / (time - sampleStarted),
            { unit: "fps" }
          );
          sampleStarted = time;
          sampledFrames = 0;
        }
      }
      frame = requestAnimationFrame(draw);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !stopped) frame = requestAnimationFrame(draw);
      onAnimationState?.(!document.hidden);
    };
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    frame = requestAnimationFrame(draw);
    onAnimationState?.(true);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      onAnimationState?.(false);
    };
  }, [enabled, eraId, onAnimationState, quality, reducedMotion, year]);

  if (!enabled || quality === "light" || reducedMotion) return null;
  return <canvas ref={canvasRef} className="ex-atmosphere" aria-hidden="true" />;
}
