import React from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

export default function Leaderboard() {
  const { leaderboard } = useAppStore();
  const rows = leaderboard();

  return (
    <SiteShell>
      <div className="col">
        <div className="h1">Рейтинг</div>

        <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Участник</th>
                <th>Баллы</th>
                <th>Решено</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="muted">—</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.userId}>
                    <td>{i + 1}</td>
                    <td>{r.name ? `${r.name} (${r.email})` : r.email}</td>
                    <td><b>{r.totalScore}</b></td>
                    <td className="muted">{r.solved}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SiteShell>
  );
}