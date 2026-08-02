import { useEffect, useState } from "react";
import { EXHIBITION_RELEASE } from "../../../config/exhibitionRelease.js";
import {
  clearProjectCaches,
  getServiceWorkerStatus,
  reregisterServiceWorker,
} from "./cacheRecovery.js";
import { recordDemoEvent } from "./demoTelemetry.js";

export default function ExhibitionCacheRecoveryPanel({ onClose }) {
  const [status, setStatus] = useState({
    checking: true,
    message: "Checking exhibition cache…",
  });

  useEffect(() => {
    let active = true;
    getServiceWorkerStatus()
      .then((serviceWorker) => {
        if (active) {
          setStatus({
            checking: false,
            serviceWorker,
            message: serviceWorker.registered
              ? "Service worker is registered."
              : "Service worker is not registered.",
          });
        }
      })
      .catch(() => {
        if (active) {
          setStatus({
            checking: false,
            message: "Service worker status is unavailable.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const recover = async () => {
    const confirmed = window.confirm(
      "Очистить только кеш Qazaq Heritage Map и восстановить выставочную версию?"
    );
    if (!confirmed) return;
    recordDemoEvent("cache_recovery_started");
    setStatus({ checking: true, message: "Recovering exhibition cache…" });
    try {
      const removed = await clearProjectCaches();
      await reregisterServiceWorker();
      recordDemoEvent("cache_recovery_completed", { status: "passed" });
      setStatus({
        checking: false,
        message: `Recovery completed. Removed ${removed.length} project caches.`,
      });
    } catch {
      setStatus({
        checking: false,
        message: "Recovery could not be completed. Reload the local demo.",
      });
    }
  };

  return (
    <div className="ex-demo-recovery-backdrop" role="dialog" aria-modal="true">
      <section className="ex-demo-recovery">
        <header>
          <div>
            <span className="ex-kicker">Operator recovery</span>
            <h2>Восстановить выставочную версию</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <dl>
          <div>
            <dt>Release</dt>
            <dd>{EXHIBITION_RELEASE.version}</dd>
          </div>
          <div>
            <dt>Cache version</dt>
            <dd>{EXHIBITION_RELEASE.datasetVersion}</dd>
          </div>
          <div>
            <dt>Service worker</dt>
            <dd>{status.serviceWorker?.state || "checking"}</dd>
          </div>
        </dl>
        <p role="status">{status.message}</p>
        <p>
          Review localStorage и данные других сайтов не удаляются. Перед
          очисткой требуется подтверждение.
        </p>
        <button type="button" onClick={recover} disabled={status.checking}>
          Восстановить выставочную версию
        </button>
        <button
          type="button"
          onClick={() => window.location.assign("/demo?kiosk=true")}
        >
          Перезагрузить official demo
        </button>
      </section>
    </div>
  );
}

