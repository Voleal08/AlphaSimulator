import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteShell from "../../components/SiteShell";
import { useAppStore } from "../../store/AppStore";

export default function AdminAttempts() {
  const { adminListAttempts } = useAppStore();

  const rows = useMemo(() => {
    try {
      return adminListAttempts();
    } catch {
      return [];
    }
  }, [adminListAttempts]);

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="h1">Проверка решений</div>
        <div className="mutedSmall">Открой попытку, чтобы увидеть решение и диалог и ответить участнику.</div>

        <div className="card">
          <div className="cardInner" style={{ overflow: "auto" }}>
            {rows.length === 0 ? (
              <div className="mutedSmall">Пока нет попыток.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Участник</th>
                    <th>Мероприятие</th>
                    <th>Кейс</th>
                    <th>Статус</th>
                    <th>Проверено</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => {
                    const reviewed = !!(a.managerReviewedAt || a.managerComment || typeof a.managerScore === "number");
                    return (
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
                          <span className={`chip ${reviewed ? "chipGood" : "chipMuted"}`}>
                            {reviewed ? "Да" : "Нет"}
                          </span>
                        </td>

                        <td>
                          <Link className="btn btnPrimary" to={`/admin/attempts/${a.id}`}>
                            Открыть
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}