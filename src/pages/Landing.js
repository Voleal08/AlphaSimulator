import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import CaseCard from "../components/CaseCard";
import { useAppStore } from "../store/AppStore";

export default function Landing() {
  const nav = useNavigate();
  const { listPublicCases, listEvents, refreshEvents, refreshPublicCases, isManager } = useAppStore();
  const mgr = isManager();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        await refreshEvents();
        await refreshPublicCases();
      } catch (e) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshEvents, refreshPublicCases]);

  const publicCases = listPublicCases();
  const events = listEvents();

  return (
    <SiteShell>
      <div className="col" style={{ gap: 14 }}>
        <div className="heroXL">
          <div className="rowBetween" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="col" style={{ gap: 10 }}>
              <div className="h1">Управленческий симулятор</div>

              <div className="row" style={{ flexWrap: "wrap" }}>
                <button className="btn btnPrimary" onClick={() => nav("/events")}>
                  Мероприятия
                </button>

                <Link className="btn btnPrimary" to="/leaderboard">
                  Рейтинг
                </Link>

                {mgr && (
                  <>
                    <Link className="btn btnPrimary" to="/events?create=1">
                      + Мероприятие
                    </Link>
                    <Link className="btn btnPrimary" to="/admin/cases">
                      + Кейс
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        <div className="rowBetween">
          <div className="h2">Мероприятия</div>
          <Link className="mutedSmall" to="/events">
            все
          </Link>
        </div>

        {loading ? (
          <div className="mutedSmall">Загрузка...</div>
        ) : (
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
        )}

        <div className="rowBetween">
          <div className="h2">Кейсы публичных мероприятий</div>
        </div>

        {loading ? (
          <div className="mutedSmall">Загрузка...</div>
        ) : publicCases.length === 0 ? (
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