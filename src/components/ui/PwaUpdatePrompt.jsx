import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function PwaUpdatePrompt() {
  const [dismissed, setDismissed] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      if (import.meta.env.DEV) console.warn("Service worker registration failed", error);
    },
  });

  if (!needRefresh || dismissed) return null;

  return (
    <aside className="pwa-update" role="status" aria-live="polite">
      <span>Доступна новая версия карты.</span>
      <button type="button" onClick={() => updateServiceWorker(true)}>
        Обновить приложение
      </button>
      <button type="button" aria-label="Закрыть" onClick={() => setDismissed(true)}>
        ×
      </button>
    </aside>
  );
}
