import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/AppStore";
import ThemeToggle from "./ThemeToggle";
import { AlfaLogo, SiriusLogo } from "./Logos";

function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 7h16v2H4V7m0 6h16v2H4v-2m0 6h16v2H4v-2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4m0 2c-4.42 0-8 2-8 4.5V20h16v-1.5c0-2.5-3.58-4.5-8-4.5"
      />
    </svg>
  );
}

function SideLink({ to, label, onClick }) {
  const loc = useLocation();
  const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
  return (
    <Link className={`sideLink ${active ? "sideLinkActive" : ""}`} to={to} onClick={onClick}>
      {label}
    </Link>
  );
}

export default function SiteShell({ children }) {
  const nav = useNavigate();
  const { user, logout, isManager } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const mgr = isManager();

  const userLabel = useMemo(() => {
    if (!user) return "";
    return user.profile?.fullName || user.email;
  }, [user]);

  const close = () => setMenuOpen(false);

  const Sidebar = ({ onClick }) => (
    <div className="sidebarCard" style={{ boxShadow: "none" }}>
      <SideLink to="/" label="Главная" onClick={onClick} />
      <SideLink to="/events" label="Мероприятия" onClick={onClick} />
      <SideLink to="/leaderboard" label="Рейтинг" onClick={onClick} />

      {mgr && (
        <>
          <div className="sidebarSep" />
          <SideLink to="/admin/attempts" label="Проверка решений" onClick={onClick} />
          <SideLink to="/admin/cases" label="Кейсы (админ)" onClick={onClick} />
          <SideLink to="/notifications" label="Уведомления" onClick={onClick} />
          <SideLink to="/analytics" label="Аналитика" onClick={onClick} />
        </>
      )}

      <div className="sidebarSep" />

      {!user ? (
        <SideLink to="/auth" label="Войти / регистрация" onClick={onClick} />
      ) : (
        <>
          {!mgr && <SideLink to="/my-cases" label="Мои кейсы" onClick={onClick} />}
          <SideLink to="/profile" label="Профиль" onClick={onClick} />

          <button
            className="sideBtn sideBtnLogout"
            onClick={() => {
              logout();
              if (onClick) onClick();
              nav("/");
            }}
          >
            Выйти
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div className="topbarInner">
          <button className="iconBtn mobileOnly" onClick={() => setMenuOpen(true)} aria-label="Меню">
            <BurgerIcon />
          </button>

          <Link className="brand" to="/">
            <div className="row" style={{ gap: 10 }}>
              <AlfaLogo />
              <SiriusLogo />
              <div className="brandTitle">
                <b>УПРАВЛЕНЧЕСКИЙ СИМУЛЯТОР</b>
                <span className="mutedSmall">платформа</span>
              </div>
            </div>
          </Link>

          <div className="row" style={{ gap: 10 }}>
            <ThemeToggle />
            {!user ? (
              <button className="btn btnPrimary" onClick={() => nav("/auth")}>
                Войти
              </button>
            ) : (
              <button className="userBtn" onClick={() => nav("/profile")} title={user.email}>
                {user.avatarDataUrl ? (
                  <img className="avatar" src={user.avatarDataUrl} alt="avatar" />
                ) : (
                  <span className="avatar avatarIcon" aria-hidden="true">
                    <UserIcon />
                  </span>
                )}
                <span className="userBtnText">{userLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="layout">
          <aside className="sidebar desktopOnly">
            <Sidebar />
          </aside>

          <main className="main">
            <div className="page">{children}</div>
          </main>
        </div>
      </div>

      {menuOpen && (
        <div className="drawerOverlay" onMouseDown={close} role="presentation">
          <div className="drawer" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="drawerHeader">
              <div className="h2">Меню</div>
              <button className="btn" onClick={close}>
                Закрыть
              </button>
            </div>
            <div className="drawerBody">
              <Sidebar onClick={close} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}