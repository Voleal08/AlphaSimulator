import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteShell from "../../components/SiteShell";
import { useAppStore } from "../../store/AppStore";

export default function AdminAttempts() {
  const { adminListAttempts } = useAppStore();

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await adminListAttempts();
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [adminListAttempts]);

  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((a) => {
      const hay = [a.userName, a.userEmail, a.caseTitle, a.eventTitle, a.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [rows, query]);

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="h1">Проверка решений</div>

          <div style={{ width: "min(360px, 100%)" }}>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по участнику, кейсу, мероприятию"
            />
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        <div className="card">
          <div className="cardInner" style={{ overflow: "auto" }}>
            {loading ? (
              <div className="mutedSmall">Загрузка...</div>
            ) : filtered.length === 0 ? (
              <div className="mutedSmall">Решений пока нет.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Участник</th>
                    <th>Мероприятие</th>
                    <th>Кейс</th>
                    <th>Статус</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 900 }}>
                          <Link to={`/admin/users/${a.userId}`} style={{ textDecoration: "underline" }}>
                            {a.userName || "—"}
                          </Link>
                        </div>
                        <div className="mutedSmall">
                          <Link to={`/admin/users/${a.userId}`} style={{ textDecoration: "underline" }}>
                            {a.userEmail || "—"}
                          </Link>
                        </div>
                      </td>
                      <td className="mutedSmall">{a.eventTitle || "—"}</td>
                      <td>{a.caseTitle || "—"}</td>
                      <td className="mutedSmall">{a.status || "—"}</td>
                      <td>
                        <Link className="btn btnPrimary" to={`/admin/attempts/${a.id}`}>
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}