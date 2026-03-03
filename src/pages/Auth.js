import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

export default function Auth() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, isManager, login, register } = useAppStore();

  const next = useMemo(() => {
    const sp = new URLSearchParams(loc.search || "");
    const v = sp.get("next");
    return v && v.startsWith("/") ? v : "";
  }, [loc.search]);

  const [mode, setMode] = useState("login"); // login | register
  const [err, setErr] = useState("");

  // login/register common
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register
  const [role, setRole] = useState("participant");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState(20);
  const [educationLevel, setEducationLevel] = useState("");
  const [city, setCity] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [skills, setSkills] = useState("");

  const isParticipant = role === "participant";

  useEffect(() => {
    if (!user) return;

    if (next) {
      nav(next, { replace: true });
      return;
    }

    if (isManager()) nav("/admin/attempts", { replace: true });
    else nav("/my-cases", { replace: true });
  }, [user, next, nav, isManager]);

  const submitLogin = () => {
    setErr("");
    try {
      login(email, password);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const submitRegister = () => {
    setErr("");
    try {
      register({
        email,
        password,
        role,
        profile: { fullName, age: Number(age || 0), educationLevel, city, university, major, skills }
      });
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1">Вход / регистрация</div>
            <div className="mutedSmall">
              {mode === "login"
                ? "Войдите, чтобы решать кейсы и видеть прогресс."
                : "Создайте аккаунт и выберите роль."}
            </div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className={`btn ${mode === "login" ? "btnPrimary" : ""}`} onClick={() => setMode("login")}>
              Вход
            </button>
            <button className={`btn ${mode === "register" ? "btnPrimary" : ""}`} onClick={() => setMode("register")}>
              Регистрация
            </button>
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        <div className="grid2">
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Аккаунт</div>

              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Email *</label>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Пароль *</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {mode === "login" ? (
                <button className="btn btnPrimary" onClick={submitLogin}>
                  Войти
                </button>
              ) : (
                <div className="mutedSmall">
                  Для участника обязательны: возраст, город, образование.
                </div>
              )}
            </div>
          </div>

          {mode === "register" ? (
            <div className="card">
              <div className="cardInner col" style={{ gap: 10 }}>
                <div className="h2">Профиль</div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Роль *</label>
                  <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="participant">Участник</option>
                    <option value="bank_staff">Сотрудник банка</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Имя *</label>
                  <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>

                <div className="grid2">
                  <div className="col" style={{ gap: 6 }}>
                    <label className="mutedSmall">Возраст {isParticipant ? "*" : ""}</label>
                    <input className="input" type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
                  </div>
                  <div className="col" style={{ gap: 6 }}>
                    <label className="mutedSmall">Город {isParticipant ? "*" : ""}</label>
                    <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Образование {isParticipant ? "*" : ""}</label>
                  <input className="input" value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} />
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Университет</label>
                  <input className="input" value={university} onChange={(e) => setUniversity(e.target.value)} />
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Направление</label>
                  <input className="input" value={major} onChange={(e) => setMajor(e.target.value)} />
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Навыки</label>
                  <textarea className="textarea" value={skills} onChange={(e) => setSkills(e.target.value)} />
                </div>

                <button className="btn btnPrimary" onClick={submitRegister}>
                  Зарегистрироваться
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="cardInner col" style={{ gap: 10 }}>
                <div className="h2">Подсказка</div>
                <div className="mutedSmall">
                  Администратор/сотрудник банка проверяет решения в разделе «Проверка решений».
                </div>
                {next ? <div className="mutedSmall">После входа вернём на: {next}</div> : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}