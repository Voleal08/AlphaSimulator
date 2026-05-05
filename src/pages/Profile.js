import React, { useMemo, useState } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

function roleLabel(user) {
  if (!user) return "—";
  return user.role === "admin" ? "Администратор" : "Участник";
}

function fastTrackLabel(user) {
  if (!user) return null;
  if (user.fastTrack) return "Fast-track";
  return null;
}

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

export default function Profile() {
  const { user, updateMyProfile, selfBecomeParticipant, isManager } = useAppStore();
  const mgr = isManager();

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const initial = useMemo(() => {
    return {
      fullName: user?.profile?.fullName || "",
      age: String(user?.profile?.age ?? ""),
      educationLevel: user?.profile?.educationLevel || "",
      city: user?.profile?.city || "",
      university: user?.profile?.university || "",
      major: user?.profile?.major || "",
      skills: user?.profile?.skills || ""
    };
  }, [user]);

  const [fullName, setFullName] = useState(initial.fullName);
  const [age, setAge] = useState(initial.age);
  const [educationLevel, setEducationLevel] = useState(initial.educationLevel);
  const [city, setCity] = useState(initial.city);
  const [university, setUniversity] = useState(initial.university);
  const [major, setMajor] = useState(initial.major);
  const [skills, setSkills] = useState(initial.skills);

  if (!user) {
    return (
      <SiteShell>
        <div className="toastErr">Нужно войти</div>
      </SiteShell>
    );
  }

  const minAge = user.role === "participant" ? 9 : 0;
  const isDefaultAdmin = user.email === "admin";

  const onSave = async () => {
    setErr("");
    setOk("");

    const fn = String(fullName || "").trim();
    if (!fn) return setErr("Имя пользователя обязательно");
    if (!FULLNAME_RE.test(fn)) return setErr("Имя: только буквы, пробел, дефис, точка и апостроф");

    const a = Number(age);
    if (!Number.isFinite(a) || a < minAge || a > 120) {
      return setErr(`Возраст должен быть от ${minAge} до 120`);
    }

    try {
      setSaving(true);
      await updateMyProfile({
        profile: { fullName: fn, age: a, educationLevel, city, university, major, skills }
      });
      setOk("Сохранено");
      setTimeout(() => setOk(""), 1200);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const onBecomeParticipant = async () => {
    setErr("");
    setOk("");
    try {
      await selfBecomeParticipant();
      setOk("Роль изменена на участник");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1">Профиль</div>
            <div className="mutedSmall">{user.email}</div>
          </div>

          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <span className={`chip ${mgr ? "chipRed" : "chipMuted"}`}>{roleLabel(user)}</span>
            {fastTrackLabel(user) && (
              <span className="chip chipGreen">{fastTrackLabel(user)}</span>
            )}
            <button className="btn btnPrimary" onClick={onSave} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>

        {user.role === "admin" && !isDefaultAdmin ? (
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardInner rowBetween" style={{ flexWrap: "wrap" }}>
              <div className="mutedSmall">Можно вернуть права участника.</div>
              <button className="btn" onClick={onBecomeParticipant}>
                Снять роль администратора
              </button>
            </div>
          </div>
        ) : null}

        {err ? <div className="toastErr">{err}</div> : null}
        {ok ? (
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardInner mutedSmall">{ok}</div>
          </div>
        ) : null}

        <div className="grid2">
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Основное</div>

              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Имя *</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div className="grid2">
                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Возраст</label>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(normalizeDigits(e.target.value))}
                    onBlur={() => setAge(normalizeAgeDisplay(age, minAge, 120))}
                  />
                </div>
                <div className="col" style={{ gap: 6 }}>
                  <label className="mutedSmall">Город</label>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>

              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Образование</label>
                <input className="input" value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Дополнительно</div>

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
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}