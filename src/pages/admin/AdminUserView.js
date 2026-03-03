import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SiteShell from "../../components/SiteShell";
import { useAppStore } from "../../store/AppStore";

function roleLabel(role) {
  if (role === "participant") return "Участник";
  if (role === "bank_staff") return "Сотрудник банка";
  if (role === "admin") return "Администратор";
  return role || "—";
}

export default function AdminUserView() {
  const { userId } = useParams();
  const { adminGetUser } = useAppStore();

  const u = useMemo(() => {
    try {
      return adminGetUser(userId);
    } catch {
      return null;
    }
  }, [adminGetUser, userId]);

  if (!u) {
    return (
      <SiteShell>
        <div className="toastErr">Пользователь не найден или нет доступа</div>
        <Link className="btn btnPrimary" to="/admin/attempts">Назад</Link>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1">Профиль участника</div>
            <div className="mutedSmall">{u.email}</div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className="chip chipMuted">{roleLabel(u.role)}</span>
            <Link className="btn" to="/admin/attempts">К проверке решений</Link>
          </div>
        </div>

        <div className="grid2">
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Основное</div>

              <div className="row" style={{ gap: 12 }}>
                {u.avatarDataUrl ? (
                  <img
                    src={u.avatarDataUrl}
                    alt="avatar"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 999,
                      border: "1px solid rgb(var(--border))",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 999,
                      border: "1px solid rgb(var(--border))",
                      background: "rgb(var(--card) / 0.55)"
                    }}
                  />
                )}

                <div className="col" style={{ gap: 4 }}>
                  <div style={{ fontWeight: 950 }}>{u.profile?.fullName || "—"}</div>
                  <div className="mutedSmall">ID: {u.id}</div>
                  <div className="mutedSmall">Создан: {u.createdAt || "—"}</div>
                </div>
              </div>

              <div className="grid2">
                <div className="col" style={{ gap: 6 }}>
                  <div className="mutedSmall">Возраст</div>
                  <div style={{ fontWeight: 900 }}>{u.profile?.age || "—"}</div>
                </div>
                <div className="col" style={{ gap: 6 }}>
                  <div className="mutedSmall">Город</div>
                  <div style={{ fontWeight: 900 }}>{u.profile?.city || "—"}</div>
                </div>
              </div>

              <div className="col" style={{ gap: 6 }}>
                <div className="mutedSmall">Образование</div>
                <div style={{ fontWeight: 900 }}>{u.profile?.educationLevel || "—"}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Дополнительно</div>

              <div className="col" style={{ gap: 6 }}>
                <div className="mutedSmall">Университет</div>
                <div style={{ fontWeight: 900 }}>{u.profile?.university || "—"}</div>
              </div>

              <div className="col" style={{ gap: 6 }}>
                <div className="mutedSmall">Направление</div>
                <div style={{ fontWeight: 900 }}>{u.profile?.major || "—"}</div>
              </div>

              <div className="col" style={{ gap: 6 }}>
                <div className="mutedSmall">Навыки</div>
                <div className="card" style={{ boxShadow: "none" }}>
                  <div className="cardInner" style={{ whiteSpace: "pre-wrap" }}>
                    {u.profile?.skills || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}