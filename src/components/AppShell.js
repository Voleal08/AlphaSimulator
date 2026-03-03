import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/AppStore";
import ThemeToggle from "./ThemeToggle";

function NavLink({ to, label }) {
  const loc = useLocation();
  const active = loc.pathname.startsWith(to);
  return (
    <Link className={`navLink ${active ? "navLinkActive" : ""}`} to={to}>
      {label}
    </Link>
  );
}

export default function AppShell({ title, children }) {
  const { user, logout } = useAppStore();
  const nav = useNavigate();

  return (
    <div className="container col" style={{ gap: 16 }}>
      <div className="rowBetween">
        <div className="col" style={{ gap: 6 }}>
          <div className="small muted">Альфа‑стиль · симулятор кейсов</div>
          <h1 className="h1">{title}</h1>
          {user && (
            <div className="small muted">
              {user.email} · роль: <b>{user.role}</b>
            </div>
          )}
        </div>

        <div className="row">
          <ThemeToggle />
          <button
            className="btn"
            onClick={() => {
              logout();
              nav("/login");
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="nav">
        <NavLink to="/dashboard" label="Кейсы" />
        <NavLink to="/progress" label="Прогресс" />
        <NavLink to="/leaderboard" label="Лидерборд" />
        {user?.role === "admin" && <NavLink to="/admin/cases" label="Админ: кейсы" />}
      </div>

      <div className="card">
        <div className="cardInner">{children}</div>
      </div>
    </div>
  );
}