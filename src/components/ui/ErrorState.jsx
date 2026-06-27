export default function ErrorState({ eyebrow, title, children }) {
  return (
    <div
      role="alert"
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "grid",
        placeItems: "center",
        padding: 24,
        boxSizing: "border-box",
        background: "linear-gradient(135deg, #111827 0%, #1f2937 48%, #064e3b 100%)",
        color: "#f9fafb",
        fontFamily: "system-ui, Arial",
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
        }}
      >
        {eyebrow && (
          <div style={{ fontSize: 13, letterSpacing: 0, opacity: 0.72 }}>{eyebrow}</div>
        )}
        <h1 style={{ margin: "8px 0 12px", fontSize: 28, lineHeight: 1.1 }}>{title}</h1>
        <div style={{ margin: 0, lineHeight: 1.55, color: "#d1d5db" }}>{children}</div>
      </div>
    </div>
  );
}
