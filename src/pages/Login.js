import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/AppStore";

export default function Login() {
  const { login, db } = useAppStore();
  const nav = useNavigate();

  const [email, setEmail] = useState("user@local");
  const [role, setRole] = useState("participant");

  const hasAdmin = db.users.some((u) => u.email === "admin@local");

  return (
    <div className="container" style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
      <div className="card" style={{ width: "min(520px, 100%)" }}>
        <div className="cardInner col">
          <div className="small muted">FinMath Simulator</div>
          <div className="h1">Вход</div>

          <div className="col" style={{ gap: 8 }}>
            <label className="small muted">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="col" style={{ gap: 8 }}>
            <label className="small muted">Роль (для нового пользователя)</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="participant">participant</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div className="small muted">
            {hasAdmin
              ? "Админ уже есть: admin@local (роль admin). Можно просто войти этим email."
              : "Если создаёте впервые, зайдите как admin@local и выберите роль admin."}
          </div>

          <button
            className="btn btnPrimary"
            onClick={() => {
              login(email, role);
              nav("/dashboard");
            }}
          >
            Продолжить
          </button>

          <div className="small muted">
            Всё хранится в localStorage (ключ <b>finmath_sim_db_v1</b>).
          </div>
        </div>
      </div>
    </div>
  );
}