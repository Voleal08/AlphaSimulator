import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteShell from "../../components/SiteShell";
import { useAppStore } from "../../store/AppStore";

function roleLabel(user) {
  if (!user) return "—";
  return user.role === "admin" ? "Администратор" : "Участник";
}

export default function AdminUsers() {
  const { adminUsers } = useAppStore();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        setRows(null);
        const data = await adminUsers();
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setRows([]);
      }
    })();

    return () => { alive = false; };
  }, [adminUsers]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = String(query || "").trim().toLowerCase();
    return rows.filter((u) => {
      const fullName = String(u.profile?.fullName || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      return !q || fullName.includes(q) || email.includes(q);
    });
  }, [rows, query]);

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="h1">Пользователи</div>
          <div style={{ width: "min(360px, 100%)" }}>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по имени или логину"
            />
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        <div className="card">
          <div className="cardInner" style={{ overflow: "auto" }}>
            {rows === null ? (
              <div className="mutedSmall">Загрузка...</div>
            ) : filtered.length === 0 ? (
              <div className="mutedSmall">Пользователей нет.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Логин</th>
                    <th>Роль</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 900 }}>
                        <Link to={`/admin/users/${u.id}`} style={{ textDecoration: "underline" }}>
                          {u.profile?.fullName || "—"}
                        </Link>
                      </td>
                      <td className="mutedSmall">
                        <Link to={`/admin/users/${u.id}`} style={{ textDecoration: "underline" }}>
                          {u.email}
                        </Link>
                      </td>
                      <td className="mutedSmall">{roleLabel(u)}</td>
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