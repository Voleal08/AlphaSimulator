import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteShell from "../../components/SiteShell";
import { useAppStore } from "../../store/AppStore";

function roleLabel(user) {
  if (!user) return "—";
  return user.role === "admin" ? "Администратор" : "Участник";
}

export default function AdminUserView() {
  const { userId } = useParams();
  const { adminGetUser, adminSetUserRole } = useAppStore();

  const [u, setU] = useState(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      setErr("");
      setLoading(true);
      const data = await adminGetUser(userId);
      setU(data || null);
    } catch (e) {
      setErr(String(e?.message || e));
      setU(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]); // eslint-disable-line

  const onMakeAdmin = async () => {
    try {
      setErr("");
      setOk("");
      await adminSetUserRole(u.id, "admin");
      setOk("Сохранено");
      await loadUser();
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onRemoveAdmin = async () => {
    try {
      setErr("");
      setOk("");
      await adminSetUserRole(u.id, "participant");
      setOk("Сохранено");
      await loadUser();
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  if (loading) {
    return (
      <SiteShell>
        <div className="mutedSmall">Загрузка...</div>
      </SiteShell>
    );
  }

  if (!u) {
    return (
      <SiteShell>
        <div className="toastErr">Пользователь не найден</div>
        <Link className="btn btnPrimary" to="/admin/users">Назад</Link>
      </SiteShell>
    );
  }

  const isDefaultAdmin = u.email === "admin";

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1">Профиль пользователя</div>
            <div className="mutedSmall">{u.email}</div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className={`chip ${u.role === "admin" ? "chipRed" : "chipMuted"}`}>
              {roleLabel(u)}
            </span>
            <Link className="btn" to="/admin/users">К пользователям</Link>
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}
        {ok ? (
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardInner mutedSmall">{ok}</div>
          </div>
        ) : null}

        {!isDefaultAdmin ? (
          <div className="row" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
            {u.role === "participant" ? (
              <button className="btn btnPrimary" onClick={onMakeAdmin}>
                Назначить админом
              </button>
            ) : (
              <button className="btn" onClick={onRemoveAdmin}>
                Снять роль администратора
              </button>
            )}
          </div>
        ) : null}

        {isDefaultAdmin ? (
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardInner mutedSmall">
              Это дефолтный администратор. Его роль нельзя снять.
            </div>
          </div>
        ) : null}

        <div className="grid2">
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Основное</div>
              <div style={{ fontWeight: 950 }}>{u.profile?.fullName || "—"}</div>
              <div className="mutedSmall">Возраст: {u.profile?.age ?? "—"}</div>
              <div className="mutedSmall">Город: {u.profile?.city || "—"}</div>
              <div className="mutedSmall">Образование: {u.profile?.educationLevel || "—"}</div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Дополнительно</div>
              <div className="mutedSmall">Университет: {u.profile?.university || "—"}</div>
              <div className="mutedSmall">Направление: {u.profile?.major || "—"}</div>

              <div className="h2" style={{ marginTop: 8 }}>Навыки</div>
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardInner" style={{ whiteSpace: "pre-wrap" }}>
                  {u.profile?.skills || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}