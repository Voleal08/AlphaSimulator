import React, { useMemo, useState } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

function statusChip(status) {
  if (status === "APPROVED") return <span className="chip chipGood">Одобрено</span>;
  if (status === "REJECTED") return <span className="chip chipRed">Отклонено</span>;
  if (status === "PENDING") return <span className="chip chipWarn">Ожидает</span>;
  return <span className="chip chipMuted">{status || "—"}</span>;
}

export default function Notifications() {
  const { user, isManager, adminListApplications, adminDecideApplication, listMyApplications } = useAppStore();
  const mgr = isManager();

  const [err, setErr] = useState("");

  const pending = useMemo(() => {
    if (!mgr) return [];
    try {
      return adminListApplications();
    } catch {
      return [];
    }
  }, [mgr, adminListApplications]);

  const mine = useMemo(() => {
    if (!user || mgr || user.role !== "participant") return [];
    try {
      return listMyApplications();
    } catch {
      return [];
    }
  }, [user, mgr, listMyApplications]);

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="h1">Уведомления</div>

        {err ? <div className="toastErr">{err}</div> : null}

        {mgr ? (
          <div className="card">
            <div className="cardInner" style={{ overflow: "auto" }}>
              {pending.length === 0 ? (
                <div className="mutedSmall">Нет новых заявок.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Участник</th>
                      <th>Мероприятие</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 900 }}>{p.userName || "—"}</div>
                          <div className="mutedSmall">{p.userEmail || "—"}</div>
                        </td>
                        <td><b>{p.eventTitle}</b></td>
                        <td>
                          <div className="row" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <button
                              className="btn btnPrimary"
                              onClick={() => {
                                setErr("");
                                try {
                                  adminDecideApplication(p.id, "APPROVED");
                                } catch (e) {
                                  setErr(String(e?.message || e));
                                }
                              }}
                            >
                              Одобрить
                            </button>
                            <button
                              className="btn"
                              onClick={() => {
                                setErr("");
                                try {
                                  adminDecideApplication(p.id, "REJECTED");
                                } catch (e) {
                                  setErr(String(e?.message || e));
                                }
                              }}
                            >
                              Отклонить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="cardInner" style={{ overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Мероприятие</th>
                    <th>Статус</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="muted" style={{ padding: 12 }}>
                        —
                      </td>
                    </tr>
                  ) : (
                    mine.map((a) => (
                      <tr key={a.id}>
                        <td><b>{a.eventTitle}</b></td>
                        <td>{statusChip(a.status)}</td>
                        <td className="mutedSmall">{a.createdAt ? String(a.createdAt).slice(0, 10) : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}