import React, { useEffect } from "react";

export default function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50
      }}
    >
      <div
        className="card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(760px, 100%)",
          maxHeight: "calc(100vh - 32px)",
          overflow: "auto",
          /* ✅ на всякий случай принудительно непрозрачный фон */
          background: "rgb(var(--card) / 1)"
        }}
      >
        <div className="cardInner col">
          <div className="rowBetween">
            <div className="h2">{title}</div>
            <button className="btn" onClick={onClose}>Закрыть</button>
          </div>
          <hr className="hr" />
          {children}
        </div>
      </div>
    </div>
  );
}
// pashalko