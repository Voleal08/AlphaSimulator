import React from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import CaseCard from "../components/CaseCard";
import { useAppStore } from "../store/AppStore";

export default function Landing() {
  const nav = useNavigate();
  const { user, listPublicCases, listEvents, isManager } = useAppStore();
  const mgr = isManager();

  const publicCases = listPublicCases();
  const events = listEvents();

  return (
    <SiteShell>
      <div className="col" style={{ gap: 14 }}>
        <div className="heroXL">
          <div className="rowBetween" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="col" style={{ gap: 10 }}>
              <div className="h1">Управленческий симулятор</div>
              <div className="heroLead">
                Платформа мероприятий и отборов: кейсы, диалоговый формат, результаты.
              </div>

              <div className="row" style={{ flexWrap: "wrap" }}>
                <button className="btn btnPrimary" onClick={() => nav(user ? "/events" : "/auth")}>
                  {user ? "К событиям" : "Войти"}
                </button>
                <Link className="btn" to="/events">Мероприятия</Link>
                <Link className="btn" to="/leaderboard">Рейтинг</Link>

                {mgr && (
                  <>
                    <Link className="btn btnPrimary" to="/events?create=1">+ Мероприятие</Link>
                    <Link className="btn btnPrimary" to="/admin/cases">+ Кейс</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rowBetween">
          <div className="h2">События</div>
          <Link className="mutedSmall" to="/events">все</Link>
        </div>

        <div className="grid3">
          {events.slice(0, 3).map((e) => (
            <Link key={e.id} className="card eventCard" to={`/events/${e.id}`}>
              <div className="cardInner col">
                <div className="rowBetween">
                  <div className="h2">{e.title}</div>
                  <span className={`chip ${e.visibility === "PUBLIC" ? "chipGood" : "chipRed"}`}>
                    {e.visibility === "PUBLIC" ? "Открыто" : "По заявке"}
                  </span>
                </div>
                <div className="mutedSmall">{e.description || "—"}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="rowBetween">
          <div className="h2">Открытые кейсы</div>
        </div>

        {publicCases.length === 0 ? (
          <div className="muted">—</div>
        ) : (
          <div className="grid2">
            {publicCases.map((x) => (
              <CaseCard key={x.id} c={x} locked={false} eventTitle={x.event?.title || ""} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}