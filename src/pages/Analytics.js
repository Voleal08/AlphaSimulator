import React, { useMemo } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

export default function Analytics() {
  const { isManager, adminAnalytics } = useAppStore();
  const mgr = isManager();

  const a = useMemo(() => {
    if (!mgr) return null;
    try { return adminAnalytics(); } catch { return null; }
  }, [mgr, adminAnalytics]);

  return (
    <SiteShell>
      <div className="col">
        <div className="h1">Аналитика</div>

        {!mgr ? (
          <div className="toastErr">Нет доступа</div>
        ) : !a ? (
          <div className="muted">—</div>
        ) : (
          <>
            <div className="grid3">
              <div className="card" style={{ boxShadow: "none" }}><div className="cardInner col"><div className="h2">Пользователи</div><div style={{ fontSize: 26, fontWeight: 950 }}>{a.totals.users}</div></div></div>
              <div className="card" style={{ boxShadow: "none" }}><div className="cardInner col"><div className="h2">События</div><div style={{ fontSize: 26, fontWeight: 950 }}>{a.totals.events}</div></div></div>
              <div className="card" style={{ boxShadow: "none" }}><div className="cardInner col"><div className="h2">Решено</div><div style={{ fontSize: 26, fontWeight: 950 }}>{a.totals.solved}</div></div></div>
            </div>

            <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
              <div className="cardInner col">
                <div className="h2">По мероприятиям</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Мероприятие</th>
                      <th>Кейсы</th>
                      <th>Решено</th>
                      <th>Avg score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.perEvent.map((r) => (
                      <tr key={r.eventId}>
                        <td><b>{r.title}</b></td>
                        <td className="muted">{r.cases}</td>
                        <td>{r.solved}</td>
                        <td className="muted">{r.avgScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}