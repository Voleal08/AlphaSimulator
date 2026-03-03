import React from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";
import { useNavigate } from "react-router-dom";

export default function Progress() {
  const { user, leaderboard } = useAppStore();
  const nav = useNavigate();

  if (!user) {
    return (
      <SiteShell>
        <div className="toastErr">Нужно войти</div>
        <button className="btn btnPrimary" onClick={() => nav("/auth")}>Войти</button>
      </SiteShell>
    );
  }

  const rows = leaderboard();
  const me = rows.find((r) => r.email === user.email);

  return (
    <SiteShell>
      <div className="col">
        <div className="h1">Прогресс</div>
        <div className="muted">
          Здесь простая версия. “Карту прогресса как в Сириус” (пороги/уровни/открыто-закрыто) можно добавить следующим шагом.
        </div>

        <div className="card" style={{ boxShadow: "none" }}>
          <div className="cardInner col">
            <div className="rowBetween">
              <div className="h2">Ваши итоги (если есть решения)</div>
              <span className="pill pillMuted">{me ? "есть" : "нет"}</span>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {me ? `Баллы: ${me.totalScore}, токены: ${me.totalTokens}, решено: ${me.solved}` : "Пока нет завершённых кейсов."}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}