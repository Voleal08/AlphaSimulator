import React, { useMemo } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

export default function Leaderboard() {
  const { leaderboard } = useAppStore();

  const rows = useMemo(() => {
    try {
      return leaderboard();
    } catch {
      return [];
    }
  }, [leaderboard]);

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1">Рейтинг</div>
            <div className="mutedSmall">Сумма баллов по завершённым кейсам.</div>
          </div>
          <span className="chip chipMuted">Участников: {rows.length}</span>
        </div>

        <div className="card">
          <div className="cardInner" style={{ overflow: "auto" }}>
            {rows.length === 0 ? (
              <div className="mutedSmall">Пока нет результатов.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Место</th>
                    <th>Участник</th>
                    <th style={{ width: 120 }}>Решено</th>
                    <th style={{ width: 140 }}>Баллы</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.userId}>
                      <td style={{ fontWeight: 950 }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 950 }}>{r.name || r.email}</div>
                        <div className="mutedSmall">{r.email}</div>
                      </td>
                      <td className="mutedSmall">{r.solved}</td>
                      <td style={{ fontWeight: 950 }}>{r.totalScore}</td>
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