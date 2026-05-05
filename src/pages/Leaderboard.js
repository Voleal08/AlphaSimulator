import React, { useEffect, useMemo, useState } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

export default function Leaderboard() {
  const { leaderboard, leaderboardByEvent, listEvents, db, user } = useAppStore();

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState("");

  const isParticipant = user?.role === "participant";
  const events = useMemo(() => listEvents(), [listEvents]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        const data = eventId ? await leaderboardByEvent(eventId) : await leaderboard();
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

    return () => {
      alive = false;
    };
  }, [leaderboard, leaderboardByEvent, eventId]);

  const data = useMemo(() => {
    const top = Array.isArray(rows) ? rows.slice(0, 20) : [];

    let me = null;
    if (user && isParticipant) {
      const foundIdx = rows.findIndex((r) => r.userId === user.id);

      if (foundIdx >= 0) {
        me = { ...rows[foundIdx], rank: foundIdx + 1 };
      } else {
        const mySolved = (db.attempts || []).filter(
          (a) => a.userId === user.id && a.status === "SCORED"
        );

        const totalScore = mySolved.reduce(
          (s, a) => s + (typeof a.managerScore === "number" ? a.managerScore : (a.score || 0)),
          0
        );
        const totalTokens = mySolved.reduce((s, a) => s + (a.tokensSpent || 0), 0);

        me = {
          userId: user.id,
          email: user.email,
          name: user.profile?.fullName || "",
          solved: mySolved.length,
          totalScore,
          totalTokens,
          rank: null
        };
      }
    }

    const meInTop = !!(me && top.some((r) => r.userId === me.userId));
    return { top, me, meInTop };
  }, [rows, db.attempts, user, isParticipant]);

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <div className="h1">Рейтинг</div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <select className="select" value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ width: "min(360px, 100%)" }}>
              <option value="">Все мероприятия</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <span className="chip chipMuted">Топ‑{data.top.length || 0}</span>
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        <div className="card">
          <div className="cardInner" style={{ overflow: "auto" }}>
            {loading ? (
              <div className="mutedSmall">Загрузка...</div>
            ) : data.top.length === 0 ? (
              <div className="mutedSmall">Пока нет результатов.</div>
            ) : (
              <table className="table leaderboardTable">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Место</th>
                    <th>Участник</th>
                    <th style={{ width: 120 }}>Решено</th>
                    <th style={{ width: 140 }}>Баллы</th>
                    <th style={{ width: 140 }}>Токены</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top.map((r, idx) => {
                    const isMe = !!isParticipant && r.userId === user?.id;

                    return (
                      <tr key={r.userId} className={isMe ? "leaderboardRowMe" : ""}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 950 }}>
                            {r.name || r.email} {isMe ? "• вы" : ""}
                          </div>
                          <div className="mutedSmall">{r.email}</div>
                        </td>
                        <td className="mutedSmall">{r.solved}</td>
                        <td style={{ fontWeight: 950 }}>{r.totalScore}</td>
                        <td className="mutedSmall">{r.totalTokens ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {data.me && !data.meInTop ? (
          <div className="card leaderboardMeCard">
            <div className="cardInner">
              <div className="mutedSmall" style={{ marginBottom: 8 }}>Ваше место</div>
              <table className="table leaderboardTable">
                <tbody>
                  <tr className="leaderboardRowMe">
                    <td style={{ width: 70 }}>{data.me.rank ?? "—"}</td>
                    <td>
                      <div style={{ fontWeight: 950 }}>
                        {data.me.name || data.me.email} • вы
                      </div>
                      <div className="mutedSmall">{data.me.email}</div>
                    </td>
                    <td style={{ width: 120 }} className="mutedSmall">{data.me.solved}</td>
                    <td style={{ width: 140, fontWeight: 950 }}>{data.me.totalScore}</td>
                    <td style={{ width: 140 }} className="mutedSmall">{data.me.totalTokens ?? "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </SiteShell>
  );
}