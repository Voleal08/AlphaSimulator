import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteShell from "../../components/SiteShell";
import Modal from "../../components/Modal";
import { useAppStore } from "../../store/AppStore";

export default function AdminPanel() {
  const nav = useNavigate();
  const {
    user,
    db,
    adminAnalytics,
    adminPendingApplications,
    adminDecideApplication,
    adminCreateEvent,
    adminUpdateEvent,
    adminDeleteEvent,
    adminAddCase,
    adminUpdateCase,
    adminDeleteCase,
    adminSetUserRole
  } = useAppStore();

  const isAdmin = user?.role === "admin";

  // Hooks — всегда наверху (до любых return)
  const [tab, setTab] = useState("analytics"); // analytics|applications|events|cases|users

  const analytics = useMemo(() => {
    if (!isAdmin) return null;
    try {
      return adminAnalytics();
    } catch {
      return null;
    }
  }, [isAdmin, db, adminAnalytics]);

  const pending = useMemo(() => {
    if (!isAdmin) return [];
    try {
      return adminPendingApplications();
    } catch {
      return [];
    }
  }, [isAdmin, db, adminPendingApplications]);

  // Event modal
  const [evOpen, setEvOpen] = useState(false);
  const [evEditId, setEvEditId] = useState(null);
  const evEditing = db.events.find((e) => e.id === evEditId) || null;

  const [evTitle, setEvTitle] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evVis, setEvVis] = useState("PUBLIC");

  function openCreateEvent() {
    setEvEditId(null);
    setEvTitle("");
    setEvDesc("");
    setEvVis("PUBLIC");
    setEvOpen(true);
  }

  function openEditEvent(e) {
    setEvEditId(e.id);
    setEvTitle(e.title);
    setEvDesc(e.description);
    setEvVis(e.visibility);
    setEvOpen(true);
  }

  // Case modal
  const [caseOpen, setCaseOpen] = useState(false);
  const [caseEditId, setCaseEditId] = useState(null);
  const caseEditing = db.cases.find((c) => c.id === caseEditId) || null;

  const [caseEventId, setCaseEventId] = useState(db.events[0]?.id || "");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseLevel, setCaseLevel] = useState(1);
  const [caseDesc, setCaseDesc] = useState("");
  const [caseMax, setCaseMax] = useState(100);
  const [casePublic, setCasePublic] = useState(false);

  useEffect(() => {
    // если удалили/создали events и текущий eventId стал невалидным
    if (!db.events.length) {
      setCaseEventId("");
      return;
    }
    const exists = db.events.some((e) => e.id === caseEventId);
    if (!exists) setCaseEventId(db.events[0].id);
  }, [db.events, caseEventId]);

  function openCreateCase() {
    setCaseEditId(null);
    setCaseEventId(db.events[0]?.id || "");
    setCaseTitle("");
    setCaseLevel(1);
    setCaseDesc("");
    setCaseMax(100);
    setCasePublic(false);
    setCaseOpen(true);
  }

  function openEditCase(c) {
    setCaseEditId(c.id);
    setCaseEventId(c.eventId);
    setCaseTitle(c.title);
    setCaseLevel(c.level);
    setCaseDesc(c.shortDescription);
    setCaseMax(c.maxScore);
    setCasePublic(!!c.isPublic);
    setCaseOpen(true);
  }

  // После hooks — можно делать ранние return
  if (!user) {
    return (
      <SiteShell>
        <div className="toastErr">Нужно войти</div>
        <button className="btn btnPrimary" onClick={() => nav("/auth")}>
          Войти
        </button>
      </SiteShell>
    );
  }

  if (!isAdmin) {
    return (
      <SiteShell>
        <div className="toastErr">Только для администратора</div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="col">
        <div className="rowBetween">
          <div>
            <div className="h1">Админ</div>
            <div className="muted">Мероприятия · Кейсы · Заявки · Аналитика</div>
          </div>
        </div>

        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className={`btn ${tab === "analytics" ? "btnPrimary" : ""}`} onClick={() => setTab("analytics")}>
            Аналитика
          </button>
          <button className={`btn ${tab === "applications" ? "btnPrimary" : ""}`} onClick={() => setTab("applications")}>
            Заявки
          </button>
          <button className={`btn ${tab === "events" ? "btnPrimary" : ""}`} onClick={() => setTab("events")}>
            Мероприятия
          </button>
          <button className={`btn ${tab === "cases" ? "btnPrimary" : ""}`} onClick={() => setTab("cases")}>
            Кейсы
          </button>
          <button className={`btn ${tab === "users" ? "btnPrimary" : ""}`} onClick={() => setTab("users")}>
            Пользователи
          </button>
        </div>

        {tab === "analytics" && (
          <div className="col">
            <div className="grid3">
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardInner col">
                  <div className="h2">Пользователи</div>
                  <div style={{ fontSize: 26, fontWeight: 1000 }}>{analytics?.totals?.users ?? 0}</div>
                </div>
              </div>
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardInner col">
                  <div className="h2">Кейсы</div>
                  <div style={{ fontSize: 26, fontWeight: 1000 }}>{analytics?.totals?.cases ?? 0}</div>
                </div>
              </div>
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardInner col">
                  <div className="h2">Решения (SCORED)</div>
                  <div style={{ fontSize: 26, fontWeight: 1000 }}>{analytics?.totals?.solved ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
              <div className="cardInner col">
                <div className="h2">Статистика по кейсам</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Кейс</th>
                      <th>Решено</th>
                      <th>Avg score</th>
                      <th>Avg tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.perCase || []).map((r) => (
                      <tr key={r.caseId}>
                        <td><b>{r.title}</b></td>
                        <td>{r.solved}</td>
                        <td className="muted">{r.avgScore}</td>
                        <td className="muted">{r.avgTokens}</td>
                      </tr>
                    ))}
                    {(analytics?.perCase || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="muted">Пока нет данных.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "applications" && (
          <div className="col">
            <div className="h2">Заявки (PENDING)</div>

            {pending.length === 0 ? (
              <div className="muted">Нет заявок.</div>
            ) : (
              <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Участник</th>
                      <th>Мероприятие</th>
                      <th>Статус</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((p) => (
                      <tr key={p.id}>
                        <td>{p.user?.email}</td>
                        <td><b>{p.event?.title}</b></td>
                        <td className="muted">{p.status}</td>
                        <td>
                          <div className="row" style={{ justifyContent: "flex-end" }}>
                            <button className="btn" onClick={() => adminDecideApplication(p.id, "APPROVED")}>
                              Одобрить
                            </button>
                            <button className="btn btnDanger" onClick={() => adminDecideApplication(p.id, "REJECTED")}>
                              Отклонить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "events" && (
          <div className="col">
            <div className="rowBetween">
              <div className="h2">Мероприятия</div>
              <button className="btn btnPrimary" onClick={openCreateEvent}>+ Добавить</button>
            </div>

            <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Тип</th>
                    <th>Описание</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {db.events.map((e) => (
                    <tr key={e.id}>
                      <td><b>{e.title}</b></td>
                      <td className="muted">{e.visibility}</td>
                      <td className="muted">{e.description}</td>
                      <td>
                        <div className="row" style={{ justifyContent: "flex-end" }}>
                          <button className="btn" onClick={() => openEditEvent(e)}>Редактировать</button>
                          <button
                            className="btn btnDanger"
                            onClick={() => window.confirm("Удалить мероприятие и всё внутри?") && adminDeleteEvent(e.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {db.events.length === 0 && (
                    <tr><td colSpan={4} className="muted">Нет мероприятий.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <Modal
              open={evOpen}
              title={evEditing ? "Редактирование мероприятия" : "Новое мероприятие"}
              onClose={() => setEvOpen(false)}
            >
              <div className="col">
                <div className="col" style={{ gap: 8 }}>
                  <label className="small muted">Название</label>
                  <input className="input" value={evTitle} onChange={(e) => setEvTitle(e.target.value)} />
                </div>

                <div className="col" style={{ gap: 8 }}>
                  <label className="small muted">Тип</label>
                  <select className="select" value={evVis} onChange={(e) => setEvVis(e.target.value)}>
                    <option value="PUBLIC">PUBLIC (открыто)</option>
                    <option value="PRIVATE">PRIVATE (по заявке)</option>
                  </select>
                </div>

                <div className="col" style={{ gap: 8 }}>
                  <label className="small muted">Описание</label>
                  <textarea className="textarea" value={evDesc} onChange={(e) => setEvDesc(e.target.value)} />
                </div>

                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => setEvOpen(false)}>Отмена</button>
                  <button
                    className="btn btnPrimary"
                    onClick={() => {
                      try {
                        if (evEditing) {
                          adminUpdateEvent(evEditing.id, { title: evTitle, description: evDesc, visibility: evVis });
                        } else {
                          adminCreateEvent({ title: evTitle, description: evDesc, visibility: evVis });
                        }
                        setEvOpen(false);
                      } catch (e) {
                        alert(String(e.message || e));
                      }
                    }}
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {tab === "cases" && (
          <div className="col">
            <div className="rowBetween">
              <div className="h2">Кейсы</div>
              <button className="btn btnPrimary" onClick={openCreateCase}>+ Добавить</button>
            </div>

            <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Кейс</th>
                    <th>Event</th>
                    <th>Level</th>
                    <th>Public</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {db.cases.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <b>{c.title}</b>
                        <div className="small muted">{c.shortDescription}</div>
                      </td>
                      <td className="muted">{db.events.find((e) => e.id === c.eventId)?.title || "—"}</td>
                      <td className="muted">{c.level}</td>
                      <td className="muted">{c.isPublic ? "yes" : "no"}</td>
                      <td>
                        <div className="row" style={{ justifyContent: "flex-end" }}>
                          <button className="btn" onClick={() => openEditCase(c)}>Редактировать</button>
                          <button
                            className="btn btnDanger"
                            onClick={() => window.confirm("Удалить кейс?") && adminDeleteCase(c.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {db.cases.length === 0 && (
                    <tr><td colSpan={5} className="muted">Нет кейсов.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <Modal
              open={caseOpen}
              title={caseEditing ? "Редактирование кейса" : "Новый кейс"}
              onClose={() => setCaseOpen(false)}
            >
              <div className="col">
                <div className="col" style={{ gap: 8 }}>
                  <label className="small muted">Мероприятие</label>
                  <select className="select" value={caseEventId} onChange={(e) => setCaseEventId(e.target.value)}>
                    {db.events.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid2">
                  <div className="col" style={{ gap: 8 }}>
                    <label className="small muted">Название</label>
                    <input className="input" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} />
                  </div>
                  <div className="col" style={{ gap: 8 }}>
                    <label className="small muted">Уровень</label>
                    <select className="select" value={caseLevel} onChange={(e) => setCaseLevel(Number(e.target.value))}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                </div>

                <div className="grid2">
                  <div className="col" style={{ gap: 8 }}>
                    <label className="small muted">Max score</label>
                    <input className="input" type="number" value={caseMax} onChange={(e) => setCaseMax(Number(e.target.value))} />
                  </div>
                  <div className="col" style={{ gap: 8 }}>
                    <label className="small muted">Открытый кейс (виден без входа)</label>
                    <select
                      className="select"
                      value={casePublic ? "yes" : "no"}
                      onChange={(e) => setCasePublic(e.target.value === "yes")}
                    >
                      <option value="no">no</option>
                      <option value="yes">yes</option>
                    </select>
                  </div>
                </div>

                <div className="col" style={{ gap: 8 }}>
                  <label className="small muted">Описание</label>
                  <textarea className="textarea" value={caseDesc} onChange={(e) => setCaseDesc(e.target.value)} />
                </div>

                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => setCaseOpen(false)}>Отмена</button>
                  <button
                    className="btn btnPrimary"
                    onClick={() => {
                      try {
                        if (caseEditing) {
                          adminUpdateCase(caseEditing.id, {
                            eventId: caseEventId,
                            title: caseTitle,
                            level: caseLevel,
                            shortDescription: caseDesc,
                            maxScore: caseMax,
                            isPublic: casePublic
                          });
                        } else {
                          adminAddCase({
                            eventId: caseEventId,
                            title: caseTitle,
                            level: caseLevel,
                            shortDescription: caseDesc,
                            maxScore: caseMax,
                            isPublic: casePublic
                          });
                        }
                        setCaseOpen(false);
                      } catch (e) {
                        alert(String(e.message || e));
                      }
                    }}
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {tab === "users" && (
          <div className="col">
            <div className="h2">Пользователи</div>

            <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Имя</th>
                    <th>Возраст</th>
                    <th>Роль</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {db.users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td className="muted">{u.profile?.fullName || ""}</td>
                      <td className="muted">{u.profile?.age || ""}</td>
                      <td>
                        <select
                          className="select"
                          value={u.role}
                          onChange={(e) => adminSetUserRole(u.id, e.target.value)}
                          disabled={u.email === "admin@local"}
                        >
                          <option value="participant">participant</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="muted">{u.email === "admin@local" ? "locked" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}