import { EXHIBITION_RELEASE } from "../../../config/exhibitionRelease.js";

const copy = {
  ru: {
    status: "Подготовка выставочной версии",
    start: "Начать демонстрацию",
    light: "Лёгкий режим",
    check: "Проверить готовность",
    offline: "Интернет недоступен. Локальная выставочная версия готова.",
    degraded:
      "Используется безопасный режим. Карта и основной сценарий остаются доступны.",
    fatal: "Локальные данные выставки недоступны. Обратитесь к оператору.",
    recovery: "Восстановить выставочную версию",
  },
  kk: {
    status: "Көрме нұсқасын дайындау",
    start: "Көрсетілімді бастау",
    light: "Жеңіл режим",
    check: "Дайындықты тексеру",
    offline: "Интернет жоқ. Жергілікті көрме нұсқасы дайын.",
    degraded: "Қауіпсіз режим қосылды. Карта мен сценарий қолжетімді.",
    fatal: "Жергілікті көрме деректері қолжетімсіз. Операторға хабарласыңыз.",
    recovery: "Көрме нұсқасын қалпына келтіру",
  },
  en: {
    status: "Preparing the exhibition release",
    start: "Start demonstration",
    light: "Light mode",
    check: "Check readiness",
    offline: "Internet is unavailable. The local exhibition is ready.",
    degraded:
      "Safe mode is active. The map and official story remain available.",
    fatal: "Local exhibition data is unavailable. Contact the operator.",
    recovery: "Recover exhibition version",
  },
};

export default function ExhibitionStartupScreen({
  boot,
  language = "ru",
  onStart,
  onLightMode,
  onHealthCheck,
  onRecovery,
}) {
  const text = copy[language] || copy.ru;
  const checking = ["initializing", "checking-assets"].includes(boot.status);
  const fatal = boot.status === "fatal";
  return (
    <main
      className="ex-demo-startup"
      data-status={boot.status}
      aria-busy={checking}
    >
      <div className="ex-demo-startup__mark" aria-hidden="true">
        Q
      </div>
      <p className="ex-kicker">{text.status}</p>
      <h1>Qazaq Heritage Map</h1>
      <p className="ex-demo-startup__release">
        {boot.releaseVersion || EXHIBITION_RELEASE.version}
      </p>
      <div className="ex-demo-startup__status" role="status" aria-live="polite">
        <strong>{boot.status}</strong>
        <span>
          {fatal
            ? text.fatal
            : boot.offline
              ? text.offline
              : boot.status === "degraded"
                ? text.degraded
                : boot.message}
        </span>
      </div>
      <p className="ex-demo-startup__language">
        {language.toUpperCase()} · {boot.quality || "auto"}
      </p>
      <div className="ex-demo-startup__actions">
        <button type="button" onClick={onStart} disabled={checking || fatal}>
          {text.start}
        </button>
        <button type="button" onClick={onLightMode} disabled={fatal}>
          {text.light}
        </button>
        <button type="button" onClick={onHealthCheck}>
          {text.check}
        </button>
      </div>
      {onRecovery && (
        <button
          type="button"
          className="ex-demo-startup__recovery"
          onClick={onRecovery}
        >
          {text.recovery}
        </button>
      )}
    </main>
  );
}

