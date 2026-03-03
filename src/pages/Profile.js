import React, { useMemo, useState } from "react";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

function roleLabel(role) {
  if (role === "participant") return "Участник";
  if (role === "bank_staff") return "Сотрудник банка";
  if (role === "admin") return "Администратор";
  return role || "—";
}

export default function Profile() {
  const { user, isManager, updateMyProfile } = useAppStore();
  const mgr = isManager();

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const initial = useMemo(() => {
    return {
      fullName: user?.profile?.fullName || "",
      age: user?.profile?.age || 0,
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

  const onSave = () => {
    setErr("");
    setOk("");
    try {
      updateMyProfile({
        profile: { fullName, age: Number(age || 0), educationLevel, city, university, major, skills }
      });
      setOk("Сохранено");
      setTimeout(() => setOk(""), 1200);
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

          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className={`chip ${mgr ? "chipRed" : "chipMuted"}`}>{roleLabel(user.role)}</span>
            <button className="btn btnPrimary" onClick={onSave}>
              Сохранить
            </button>
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}
        {ok ? <div className="card" style={{ boxShadow: "none" }}><div className="cardInner mutedSmall">{ok}</div></div> : null}

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
                  <input className="input" type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
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