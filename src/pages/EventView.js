import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import CaseCard from "../components/CaseCard";
import Modal from "../components/Modal";
import { useAppStore } from "../store/AppStore";

export default function EventView() {
  const { eventId } = useParams();
  const nav = useNavigate();

  const {
    user,
    isManager,
    getEvent,
    listCasesForEvent,
    myEventAccess,
    applyToEvent,
    adminUpdateEvent,
    adminAddCase,
    adminListAttemptsForEvent
  } = useAppStore();

  const mgr = isManager();
  const ev = getEvent(eventId);

  const [err, setErr] = useState(null);

  // edit event
  const [editOpen, setEditOpen] = useState(false);
  const [evTitle, setEvTitle] = useState("");
  const [evVis, setEvVis] = useState("PUBLIC");
  const [evDesc, setEvDesc] = useState("");

  // add case
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseLevel, setCaseLevel] = useState(1);
  const [caseMax, setCaseMax] = useState(100);
  const [casePublic, setCasePublic] = useState(false);
  const [caseDesc, setCaseDesc] = useState("");

  const access = user && ev ? myEventAccess(ev.id) : null;
  const cases = ev ? listCasesForEvent(ev.id) : [];

  const lockedForParticipant = !!ev && ev.visibility === "PRIVATE" && !mgr && access?.status !== "APPROVED";

  const attempts = useMemo(() => {
    if (!mgr || !ev) return [];
    try {
      return adminListAttemptsForEvent(ev.id);
    } catch {
      return [];
    }
  }, [mgr, ev, adminListAttemptsForEvent]);

  if (!ev) {
    return (
      <SiteShell>
        <div className="toastErr">Мероприятие не найдено</div>
        <Link className="btn btnPrimary" to="/events">
          К мероприятиям
        </Link>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1">{ev.title}</div>
            <div className="mutedSmall">{ev.description || "—"}</div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className={`chip ${ev.visibility === "PUBLIC" ? "chipGood" : "chipRed"}`}>
              {ev.visibility === "PUBLIC" ? "Открыто" : "По заявке"}
            </span>

            {!mgr && ev.visibility === "PRIVATE" ? (
              access?.status === "APPROVED" ? (
                <span className="chip chipGood">Доступ подтверждён</span>
              ) : access?.status === "PENDING" ? (
                <span className="chip chipWarn">Заявка на рассмотрении</span>
              ) : (
                <span className="chip chipRed">Нет доступа</span>
              )
            ) : null}

            {lockedForParticipant && (
              <>
                {!user ? (
                  <button className="btn btnPrimary" onClick={() => nav("/auth")}>
                    Войти, чтобы подать заявку
                  </button>
                ) : (
                  <button
                    className="btn btnPrimary"
                    onClick={() => {
                      setErr(null);
                      try {
                        applyToEvent(ev.id);
                      } catch (e) {
                        setErr(String(e?.message || e));
                      }
                    }}
                  >
                    Подать заявку
                  </button>
                )}
              </>
            )}

            {mgr && (
              <>
                <button
                  className="btn"
                  onClick={() => {
                    setErr(null);
                    setEvTitle(ev.title);
                    setEvVis(ev.visibility);
                    setEvDesc(ev.description || "");
                    setEditOpen(true);
                  }}
                >
                  Редактировать
                </button>

                <button
                  className="btn btnPrimary"
                  onClick={() => {
                    setErr(null);
                    setAddCaseOpen(true);
                  }}
                >
                  + Кейс
                </button>
              </>
            )}
          </div>
        </div>

        {err && <div className="toastErr">{err}</div>}

        {lockedForParticipant ? (
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardInner col" style={{ gap: 8 }}>
              <div className="h2">Доступ по заявке</div>
              <div className="mutedSmall">
                Это мероприятие закрытое. Подайте заявку — после одобрения кейсы станут доступны.
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid2">
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} locked={c.locked} eventTitle={ev.title} />
          ))}
        </div>

        {/* manager: attempts for this event -> link to full review pages */}
        {mgr && (
          <>
            <div className="rowBetween" style={{ marginTop: 10, flexWrap: "wrap" }}>
              <div className="col" style={{ gap: 6 }}>
                <div className="h2">Попытки участников</div>
                <div className="mutedSmall">
                  Открой попытку, чтобы увидеть решение и диалог и ответить участнику.
                </div>
              </div>

              <Link className="btn" to="/admin/attempts">
                Вся проверка решений
              </Link>
            </div>

            <div className="card" style={{ boxShadow: "none" }}>
              <div className="cardInner" style={{ overflow: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Участник</th>
                      <th>Кейс</th>
                      <th>Статус</th>
                      <th>Баллы</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="muted">
                          —
                        </td>
                      </tr>
                    ) : (
                      attempts.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div style={{ fontWeight: 900 }}>{a.userName || "—"}</div>
                            <div className="mutedSmall">{a.userEmail || "—"}</div>
                          </td>
                          <td>
                            <b>{a.caseTitle}</b>
                          </td>
                          <td>
                            <span className={`chip ${a.status === "SCORED" ? "chipGood" : "chipWarn"}`}>
                              {a.status === "SCORED" ? "Завершён" : "В работе"}
                            </span>
                          </td>
                          <td className="mutedSmall">{a.score ?? "—"}</td>
                          <td>
                            <Link className="btn btnPrimary" to={`/admin/attempts/${a.id}`}>
                              Открыть
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* edit event */}
        <Modal open={editOpen} title="Мероприятие" onClose={() => setEditOpen(false)}>
          <div className="col" style={{ gap: 10 }}>
            {err && <div className="toastErr">{err}</div>}

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Название *</label>
              <input className="input" value={evTitle} onChange={(e) => setEvTitle(e.target.value)} />
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Тип *</label>
              <select className="select" value={evVis} onChange={(e) => setEvVis(e.target.value)}>
                <option value="PUBLIC">Открыто</option>
                <option value="PRIVATE">По заявке</option>
              </select>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Описание</label>
              <textarea className="textarea" value={evDesc} onChange={(e) => setEvDesc(e.target.value)} />
            </div>

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button
                className="btn btnPrimary"
                onClick={() => {
                  setErr(null);
                  try {
                    adminUpdateEvent(ev.id, { title: evTitle, visibility: evVis, description: evDesc });
                    setEditOpen(false);
                  } catch (e) {
                    setErr(String(e?.message || e));
                  }
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </Modal>

        {/* add case */}
        <Modal open={addCaseOpen} title="Новый кейс" onClose={() => setAddCaseOpen(false)}>
          <div className="col" style={{ gap: 10 }}>
            {err && <div className="toastErr">{err}</div>}

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Название *</label>
              <input className="input" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} />
            </div>

            <div className="grid2">
              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Уровень *</label>
                <select className="select" value={caseLevel} onChange={(e) => setCaseLevel(Number(e.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Max score *</label>
                <input
                  className="input"
                  type="number"
                  value={caseMax}
                  onChange={(e) => setCaseMax(Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Открытый кейс</label>
              <select
                className="select"
                value={casePublic ? "yes" : "no"}
                onChange={(e) => setCasePublic(e.target.value === "yes")}
              >
                <option value="no">Нет</option>
                <option value="yes">Да</option>
              </select>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Текст *</label>
              <textarea className="textarea" value={caseDesc} onChange={(e) => setCaseDesc(e.target.value)} />
            </div>

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button
                className="btn btnPrimary"
                onClick={() => {
                  setErr(null);
                  try {
                    adminAddCase({
                      eventId: ev.id,
                      title: caseTitle,
                      level: caseLevel,
                      maxScore: caseMax,
                      isPublic: casePublic,
                      shortDescription: caseDesc
                    });

                    setAddCaseOpen(false);
                    setCaseTitle("");
                    setCaseLevel(1);
                    setCaseMax(100);
                    setCasePublic(false);
                    setCaseDesc("");
                  } catch (e) {
                    setErr(String(e?.message || e));
                  }
                }}
              >
                Создать
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SiteShell>
  );
}