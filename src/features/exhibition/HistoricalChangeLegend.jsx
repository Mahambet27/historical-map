const labels = {
  ru: {
    second: "Золотой — территория во втором периоде",
    first: "Синий — территория в первом периоде",
    common: "Бирюзовый — общая территория",
    added: "Светло-золотой — условно добавленная территория",
    lost: "Серо-синий — условно утраченная территория",
    title: "Легенда изменения",
  },
  kk: {
    second: "Алтын — екінші кезеңдегі аумақ",
    first: "Көк — бірінші кезеңдегі аумақ",
    common: "Көгілдір — ортақ аумақ",
    added: "Ашық алтын — шартты түрде қосылған аумақ",
    lost: "Сұр-көк — шартты түрде жоғалған аумақ",
    title: "Өзгеріс шартты белгілері",
  },
  en: {
    second: "Gold — territory in the second period",
    first: "Blue — territory in the first period",
    common: "Turquoise — shared territory",
    added: "Light gold — conditionally added territory",
    lost: "Blue grey — conditionally lost territory",
    title: "Change legend",
  },
};

export default function HistoricalChangeLegend({
  language = "ru",
  mode = "overlay",
  compact = false,
}) {
  const text = labels[language] || labels.ru;
  const entries =
    mode === "changes"
      ? [
          ["common", text.common],
          ["added", text.added],
          ["lost", text.lost],
        ]
      : [
          ["first", text.first],
          ["second", text.second],
          ["common", text.common],
        ];
  return (
    <aside
      className={`ex-change-legend ${compact ? "is-compact" : ""}`}
      aria-label={text.title}
    >
      <strong>{text.title}</strong>
      {entries.map(([kind, label]) => (
        <span key={kind}>
          <i className={`is-${kind}`} />
          {label}
        </span>
      ))}
    </aside>
  );
}

