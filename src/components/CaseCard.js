import React from "react";
import { Link } from "react-router-dom";
import StatusPill from "./StatusPill";
import { useAppStore } from "../store/AppStore";

export default function CaseCard({ c, locked, eventTitle }) {
  const { isManager } = useAppStore();
  const mgr = isManager();

  const cls = mgr
    ? "caseCard caseCard--not"
    : locked
      ? "caseCard caseCard--locked"
      : c.status === "SCORED"
        ? "caseCard caseCard--done"
        : c.status === "IN_PROGRESS"
          ? "caseCard caseCard--prog"
          : "caseCard caseCard--not";

  const levelLabel = c.level === 1 ? "Уровень 1" : c.level === 2 ? "Уровень 2" : "Уровень 3";

  return (
    <div className={`card ${cls}`}>
      <div className="cardInner col" style={{ gap: 10 }}>
        <div className="rowBetween" style={{ alignItems: "flex-start" }}>
          <div className="col" style={{ gap: 6, minWidth: 0 }}>
            <div className="mutedSmall">
              {levelLabel}
              {eventTitle ? ` · ${eventTitle}` : ""}
            </div>
            <div className="h2" style={{ lineHeight: 1.2 }}>
              {c.title}
            </div>
          </div>

          {mgr ? (
            <span className="chip chipMuted">Администратор</span>
          ) : locked ? (
            <span className="chip chipRed">По заявке</span>
          ) : (
            <StatusPill status={c.status || "NOT_STARTED"} />
          )}
        </div>

        <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
          {c.shortDescription}
        </div>

        <div className="rowBetween">
          <div className="mutedSmall">{mgr ? `Макс: ${c.maxScore}` : (c.score != null ? `Баллы: ${c.score}/${c.maxScore}` : `Макс: ${c.maxScore}`)}</div>
          <Link className="btn btnPrimary" to={`/cases/${c.id}`}>
            Открыть
          </Link>
        </div>
      </div>
    </div>
  );
}