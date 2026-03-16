const btnStyle = (active) => ({
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  cursor: "pointer",
  background: active ? "#111" : "#fff",
  color: active ? "#fff" : "#111",
  fontWeight: 800,
});

export default function TopPanel({
  mode,
  setMode,
  onResetView,
  onClearRoute,
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 30,
        display: "flex",
        gap: 10,
        background: "rgba(255,255,255,0.94)",
        padding: 10,
        borderRadius: 14,
        boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
        alignItems: "center",
        fontFamily: "system-ui, Arial",
        flexWrap: "wrap",
        backdropFilter: "blur(10px)",
      }}
    >
      <button onClick={() => setMode("now")} style={btnStyle(mode === "now")}>
        Карта қазір
      </button>

      <button onClick={() => setMode("history")} style={btnStyle(mode === "history")}>
        Тарихи карта
      </button>

      <button onClick={onResetView} style={btnStyle(false)}>
        ← Жалпы көрініс
      </button>

      <button onClick={onClearRoute} style={btnStyle(false)}>
        Маршрутты өшіру
      </button>
    </div>
  );
}