import React, { useEffect, useMemo, useState } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

function visLabel(v) {
  if (v === "PUBLIC") return "Публичное";
  if (v === "PRIVATE") return "Приватное";
  return v || "—";
}

export default function Analytics() {
  const { adminAnalytics, isManager, listEvents } = useAppStore();
  const mgr = isManager();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [exportEventId, setExportEventId] = useState("");

  const events = useMemo(() => listEvents(), [listEvents]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!mgr) return;

      try {
        setErr("");
        const stats = await adminAnalytics();
        if (!alive) return;
        setData(stats);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setData(null);
      }
    })();

    return () => { alive = false; };
  }, [adminAnalytics, mgr]);

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
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="h1">Аналитика</div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <select className="select" value={exportEventId} onChange={(e) => setExportEventId(e.target.value)} style={{ width: "min(360px, 100%)" }}>
              <option value="">Все мероприятия</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <button
              className="btn"
              onClick={() => {
                const q = exportEventId ? `&eventId=${encodeURIComponent(exportEventId)}` : "";
                window.open(`/admin/exports/dialogs?format=json${q}`, "_blank", "noopener,noreferrer");
              }}
              disabled={!data}
              title="Экспорт диалогов для разметки (JSON)"
            >
              Экспорт JSON
            </button>
            <button
              className="btn btnPrimary"
              onClick={() => {
                const q = exportEventId ? `&eventId=${encodeURIComponent(exportEventId)}` : "";
                window.open(`/admin/exports/dialogs?format=csv${q}`, "_blank", "noopener,noreferrer");
              }}
              disabled={!data}
              title="Экспорт диалогов для разметки (CSV)"
            >
              Экспорт CSV
            </button>
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        {!data ? (
          <div className="mutedSmall">Загрузка...</div>
        ) : (
          <>
            <div className="grid3">
              <div className="card">
                <div className="cardInner col">
                  <div className="h2">Пользователи</div>
                  <div style={{ fontWeight: 950, fontSize: 22 }}>{data.totals.users}</div>
                </div>
              </div>

              <div className="card">
                <div className="cardInner col">
                  <div className="h2">Попытки</div>
                  <div style={{ fontWeight: 950, fontSize: 22 }}>{data.totals.attempts}</div>
                </div>
              </div>

              <div className="card">
                <div className="cardInner col">
                  <div className="h2">Проверено</div>
                  <div style={{ fontWeight: 950, fontSize: 22 }}>{data.totals.reviewed}</div>
                </div>
              </div>
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
                    {(data.rows || []).map((r) => (
                      <tr key={r.eventId}>
                        <td style={{ fontWeight: 950 }}>{r.title}</td>
                        <td className="mutedSmall">{visLabel(r.visibility)}</td>
                        <td className="mutedSmall">{r.cases}</td>
                        <td className="mutedSmall">{r.solved}</td>
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