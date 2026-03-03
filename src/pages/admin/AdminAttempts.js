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
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1">Проверка решений</div>
            <div className="mutedSmall">Открой попытку, чтобы увидеть решение и диалог и ответить участнику.</div>
          </div>
        </div>

        <div className="card" style={{ boxShadow: "none" }}>
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
                    <th>Баллы</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 900 }}>{a.userName || "—"}</div>
                        <div className="mutedSmall">{a.userEmail || "—"}</div>
                      </td>
                      <td className="mutedSmall">{a.eventTitle || "—"}</td>
                      <td>{a.caseTitle || "—"}</td>
                      <td>
                        <span className={`chip ${a.status === "SCORED" ? "chipGood" : "chipWarn"}`}>
                          {a.status === "SCORED" ? "Завершён" : "В работе"}
                        </span>
                      </td>
                      <td className="mutedSmall">{a.score == null ? "—" : a.score}</td>
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