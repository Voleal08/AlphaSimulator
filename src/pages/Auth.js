import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

const FULLNAME_RE = /^[a-zA-Zа-яА-ЯёЁ][a-zA-Zа-яА-ЯёЁ\s.'-]{1,79}$/;

function normalizeDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function normalizeAgeDisplay(value, min, max) {
  const digits = normalizeDigits(value);
  if (!digits) return "";
  const n = Math.max(min, Math.min(max, Number(digits)));
  return String(n);
}

export default function Auth() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, isManager, login, register } = useAppStore();

  const next = useMemo(() => {
    const sp = new URLSearchParams(loc.search || "");
    const v = sp.get("next");
    return v && v.startsWith("/") ? v : "";
  }, [loc.search]);

  const mode = useMemo(() => {
    const sp = new URLSearchParams(loc.search || "");
    return sp.get("mode") === "register" ? "register" : "login";
  }, [loc.search]);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("20");
  const [educationLevel, setEducationLevel] = useState("");
  const [city, setCity] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [skills, setSkills] = useState("");

  // если уже авторизован и зашёл на /auth руками
  useEffect(() => {
    if (!user) return;

    if (next) {
      nav(next, { replace: true });
      return;
    }

    if (isManager()) nav("/admin/attempts", { replace: true });
    else nav("/", { replace: true });
  }, [user, next, nav, isManager]);

  const goAfterAuth = (loggedUser) => {
    if (!loggedUser) return;

    if (next) {
      nav(next, { replace: true });
      return;
    }

    if (loggedUser.role === "admin") nav("/admin/attempts", { replace: true });
    else nav("/", { replace: true });
  };

  const submitLogin = async () => {
    setErr("");
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      goAfterAuth(loggedUser);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    setErr("");

    const fn = String(fullName || "").trim();
    if (!fn) return setErr("Имя пользователя обязательно");
    if (!FULLNAME_RE.test(fn)) return setErr("Имя: только буквы, пробел, дефис, точка и апостроф");

    const a = Number(age);
    if (!Number.isFinite(a) || a < 9 || a > 120) return setErr("Возраст участника: от 9 до 120");
    if (!String(city || "").trim()) return setErr("Город обязателен");
    if (!String(educationLevel || "").trim()) return setErr("Образование обязательно");

    setLoading(true);

    try {
      const newUser = await register({
        email,
        password,
        role: "participant",
        profile: {
          fullName: fn,
          age: a,
          educationLevel,
          city,
          university,
          major,
          skills
        }
      });

      goAfterAuth(newUser);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="col" style={{ gap: 6 }}>
          <div className="h1">{mode === "login" ? "Вход" : "Регистрация"}</div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        <div className="grid2">
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Аккаунт</div>

              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Логин *</label>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Пароль *</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {mode === "login" ? (
                <button className="btn btnPrimary" type="button" onClick={submitLogin} disabled={loading}>
                  {loading ? "Вход..." : "Войти"}
                </button>
              ) : null}
            </div>
          </div>

          {mode === "register" ? (
            <div className="card">
              <div className="cardInner col" style={{ gap: 10 }}>
                <div className="h2">Профиль</div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Имя *</label>
                  <input
                    className="input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="grid2">
                  <div className="col" style={{ gap: 6 }}>
                    <label className="mutedSmall">Возраст *</label>
                    <input
                      className="input"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => setAge(normalizeDigits(e.target.value))}
                      onBlur={() => setAge(normalizeAgeDisplay(age, 9, 120))}
                    />
                  </div>

                  <div className="col" style={{ gap: 6 }}>
                    <label className="mutedSmall">Город *</label>
                    <input
                      className="input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Образование *</label>
                  <input
                    className="input"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                  />
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Университет</label>
                  <input
                    className="input"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Направление</label>
                  <input
                    className="input"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                  />
                </div>

                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Навыки</label>
                  <textarea
                    className="textarea"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>

                <button className="btn btnPrimary" type="button" onClick={submitRegister} disabled={loading}>
                  {loading ? "Регистрация..." : "Зарегистрироваться"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </SiteShell>
  );
}