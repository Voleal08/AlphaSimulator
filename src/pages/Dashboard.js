import React, { useMemo } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, db, isManager } = useAppStore();
  const nav = useNavigate();
  const mgr = isManager();

  const myCases = useMemo(() => {
    if (!user || mgr) return [];

    const attemptsByCase = Object.fromEntries(db.attempts.filter((a) => a.userId === user.id).map((a) => [a.caseId, a]));
    const eventById = Object.fromEntries(db.events.map((e) => [e.id, e]));

    return db.cases
      .map((c) => {
        const a = attemptsByCase[c.id] || null;
        return {
          ...c,
          eventTitle: eventById[c.eventId]?.title || "",
          status: a?.status || "NOT_STARTED",
          score: a?.score ?? null
        };
      })
      .sort((x, y) => x.level - y.level || x.title.localeCompare(y.title));
  }, [db, user, mgr]);

  if (!user) {
    return (
      <SiteShell>
        <div className="toastErr">Нужно войти</div>
        <button className="btn btnPrimary" onClick={() => nav("/auth")}>
          Войти
        </button>
      </SiteShell>
    );
  }

  if (mgr) {
    return (
      <SiteShell>
        <div className="col">
          <div className="h1">Управление</div>
          <div className="grid2">
            <Link className="card eventCard" to="/admin/attempts">
              <div className="cardInner col">
                <div className="h2">Проверка решений</div>
                <div className="mutedSmall">Диалоги, решения участников, ответы администратора</div>
              </div>
            </Link>

            <Link className="card eventCard" to="/admin/cases">
              <div className="cardInner col">
                <div className="h2">Кейсы</div>
                <div className="mutedSmall">Создание и редактирование кейсов</div>
              </div>
            </Link>

            <Link className="card eventCard" to="/notifications">
              <div className="cardInner col">
                <div className="h2">Уведомления</div>
                <div className="mutedSmall">Заявки на приватные мероприятия</div>
              </div>
            </Link>

            <Link className="card eventCard" to="/analytics">
              <div className="cardInner col">
                <div className="h2">Аналитика</div>
                <div className="mutedSmall">Сводные метрики по платформе</div>
              </div>
            </Link>
          </div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="col">
        <div className="rowBetween">
          <div className="h1">Мои кейсы</div>
        </div>

        <div className="grid2">
          {myCases.map((c) => (
            <Link key={c.id} className="card eventCard" to={`/cases/${c.id}`}>
              <div className="cardInner col" style={{ gap: 10 }}>
                <div className="rowBetween">
                  <div className="col" style={{ gap: 6 }}>
                    <div className="mutedSmall">
                      {c.eventTitle} · Уровень {c.level}
                    </div>
                    <div className="h2">{c.title}</div>
                  </div>
                  <span
                    className={`chip ${
                      c.status === "SCORED" ? "chipGood" : c.status === "IN_PROGRESS" ? "chipWarn" : "chipMuted"
                    }`}
                  >
                    {c.status === "SCORED" ? "Завершён" : c.status === "IN_PROGRESS" ? "В работе" : "Не начат"}
                  </span>
                </div>

                <div className="mutedSmall">{c.score != null ? `Баллы: ${c.score}/${c.maxScore}` : `Макс: ${c.maxScore}`}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}