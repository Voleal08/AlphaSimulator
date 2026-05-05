import React, { useMemo } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";
import { useNavigate } from "react-router-dom";
import StatusPill from "../components/StatusPill";

export default function Progress() {
  const { user, db, isManager } = useAppStore();
  const nav = useNavigate();
  const mgr = isManager();

  // ✅ Хук вызывается всегда, без условий
  const data = useMemo(() => {
    if (!user || mgr) {
      return {
        totals: {
          solved: 0,
          inProgress: 0,
          tokens: 0,
          score: 0,
          maxScore: 0
        },
        byEvent: []
      };
    }

    const myAttempts = (db.attempts || []).filter((a) => a.userId === user.id);
    const byCase = Object.fromEntries(myAttempts.map((a) => [a.caseId, a]));
    const eventById = Object.fromEntries((db.events || []).map((e) => [e.id, e]));

    const cases = (db.cases || []).map((c) => {
      const a = byCase[c.id] || null;
      return {
        ...c,
        eventTitle: eventById[c.eventId]?.title || "",
        status: a?.status || "NOT_STARTED",
        score: a?.score ?? null,
        tokensSpent: a?.tokensSpent || 0
      };
    });

    const totals = {
      solved: myAttempts.filter((a) => a.status === "SCORED").length,
      inProgress: myAttempts.filter((a) => a.status === "IN_PROGRESS").length,
      tokens: myAttempts.reduce((s, a) => s + (a.tokensSpent || 0), 0),
      score: myAttempts.reduce((s, a) => s + (typeof a.score === "number" ? a.score : 0), 0),
      maxScore: cases.reduce((s, c) => s + (typeof c.maxScore === "number" ? c.maxScore : 0), 0)
    };

    const byEvent = Object.values(
      cases.reduce((acc, c) => {
        const key = c.eventId || "no_event";
        if (!acc[key]) {
          acc[key] = {
            eventId: c.eventId || null,
            title: c.eventId ? (eventById[c.eventId]?.title || "Мероприятие") : "Без мероприятия",
            cases: []
          };
        }
        acc[key].cases.push(c);
        return acc;
      }, {})
    ).map((g) => {
      const solved = g.cases.filter((c) => c.status === "SCORED").length;
      const inProgress = g.cases.filter((c) => c.status === "IN_PROGRESS").length;
      const score = g.cases.reduce((s, c) => s + (typeof c.score === "number" ? c.score : 0), 0);
      const maxScore = g.cases.reduce((s, c) => s + (typeof c.maxScore === "number" ? c.maxScore : 0), 0);
      const tokens = g.cases.reduce((s, c) => s + (c.tokensSpent || 0), 0);
      return { ...g, solved, inProgress, score, maxScore, tokens };
    });

    byEvent.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));

    return { totals, byEvent };
  }, [db, user, mgr]);

  if (!user) {
    return (
      <SiteShell>
        <div className="toastErr">Нужно войти</div>
        <button className="btn btnPrimary" onClick={() => nav("/auth?mode=login")}>
          Войти
        </button>
      </SiteShell>
    );
  }

  if (mgr) {
    return (
      <SiteShell>
        <div className="toastErr">Прогресс доступен только участникам.</div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="h1">Прогресс</div>
          <span className="chip chipMuted">Решено: {data.totals.solved}</span>
        </div>

        <div className="grid3">
          <div className="card">
            <div className="cardInner col">
              <div className="mutedSmall">Баллы</div>
              <div style={{ fontWeight: 950, fontSize: 22 }}>{data.totals.score}</div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner col">
              <div className="mutedSmall">Токены</div>
              <div style={{ fontWeight: 950, fontSize: 22 }}>{data.totals.tokens}</div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner col">
              <div className="mutedSmall">В работе</div>
              <div style={{ fontWeight: 950, fontSize: 22 }}>{data.totals.inProgress}</div>
            </div>
          </div>
        </div>

        {data.byEvent.map((g) => (
          <div key={g.eventId || "no_event"} className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                <div className="col" style={{ gap: 4 }}>
                  <div className="h2">{g.title}</div>
                  <div className="mutedSmall">
                    Решено: {g.solved} · В работе: {g.inProgress} · Баллы: {g.score}/{g.maxScore} · Токены: {g.tokens}
                  </div>
                </div>
                <span className="chip chipMuted">Кейсов: {g.cases.length}</span>
              </div>

              <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
                <div className="cardInner" style={{ padding: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Кейс</th>
                        <th style={{ width: 140 }}>Статус</th>
                        <th style={{ width: 120 }}>Баллы</th>
                        <th style={{ width: 110 }}>Токены</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.cases.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 950 }}>{c.title}</td>
                          <td><StatusPill status={c.status} /></td>
                          <td className="mutedSmall">
                            {c.score != null ? `${c.score}/${c.maxScore}` : `—/${c.maxScore}`}
                          </td>
                          <td className="mutedSmall">{c.tokensSpent || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SiteShell>
  );
}