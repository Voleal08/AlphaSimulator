import React from "react";

export default function StatusPill({ status }) {
  if (status === "IN_PROGRESS") return <span className="chip chipWarn">В работе</span>;
  if (status === "SCORED") return <span className="chip chipGood">Завершён</span>;
  return <span className="chip chipMuted">Не начат</span>;
}