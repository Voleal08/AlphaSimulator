import React, { useMemo } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

export default function Analytics() {
  const { db, isManager } = useAppStore();
  const mgr = isManager();

  const stats = useMemo(() => {
    const attempts = db.attempts || [];
    const solved = attempts.filter((a) => a.status === "SCORED");
    const inProgress = attempts.filter((a) => a.status === "IN_PROGRESS");
    const reviewed = attempts.filter((a) => !!(a.managerReviewedAt || a.managerComment || typeof a.managerScore === "number"));

    const eventById = Object.fromEntries((db.events || []).map((e) => [e.id, e]));
    const casesByEvent = {};
    for (const c of db.cases || []) {
      casesByEvent[c.eventId] = (casesByEvent[c.eventId] || 0) + 1;
    }

    const solvedByEvent = {};
    for (const a of solved) {
      const c = (db.cases || []).find((x) => x.id === a.caseId);
      if (!c) continue;
      solvedByEvent[c.eventId] = (solvedByEvent[c.eventId] || 0) + 1;
    }

    const rows = Object.keys(eventById).map((eventId) => ({
      eventId,
      title: eventById[eventId]?.title || "—",
      visibility: eventById[eventId]?.visibility || "—",
      cases: casesByEvent[eventId] || 0,
      solved: solvedByEvent[eventId] || 0
    })).sort((a, b) => b.solved - a.solved);

    return {
      totals: {
        users: (db.users || []).length,
        events: (db.events || []).length,
        cases: (db.cases || []).length,
        attempts: attempts.length,
        solved: solved.length,
        inProgress: inProgress.length,
        reviewed: reviewed.length
      },
      rows
    };
  }, [db]);

  if (!mgr) {
    return (
      <SiteShell>
        <div className="toastErr">Нет доступа</div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="h1">Аналитика</div>

        <div className="grid3">
          <div className="card"><div className="cardInner col"><div className="h2">Пользователи</div><div style={{ fontWeight: 950, fontSize: 22 }}>{stats.totals.users}</div></div></div>
          <div className="card"><div className="cardInner col"><div className="h2">Попытки</div><div style={{ fontWeight: 950, fontSize: 22 }}>{stats.totals.attempts}</div></div></div>
          <div className="card"><div className="cardInner col"><div className="h2">Проверено</div><div style={{ fontWeight: 950, fontSize: 22 }}>{stats.totals.reviewed}</div></div></div>
        </div>

        <div className="card">
          <div className="cardInner" style={{ overflow: "auto" }}>
            <div className="h2" style={{ marginBottom: 8 }}>По мероприятиям</div>
            <table className="table">
              <thead>
                <tr>
                  <th>Мероприятие</th>
                  <th>Тип</th>
                  <th>Кейсов</th>
                  <th>Решено</th>
                </tr>
              </thead>
              <tbody>
                {stats.rows.map((r) => (
                  <tr key={r.eventId}>
                    <td style={{ fontWeight: 950 }}>{r.title}</td>
                    <td className="mutedSmall">{r.visibility}</td>
                    <td className="mutedSmall">{r.cases}</td>
                    <td className="mutedSmall">{r.solved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}