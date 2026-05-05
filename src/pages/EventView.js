import React, { useEffect, useMemo, useState } from "react";
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
    adminListAttemptsForEvent,
    refreshEvents
  } = useAppStore();

  const mgr = isManager();
  const ev = getEvent(eventId);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [evTitle, setEvTitle] = useState("");
  const [evVis, setEvVis] = useState("PUBLIC");
  const [evDesc, setEvDesc] = useState("");
  const [evActive, setEvActive] = useState(true);
  const [evStartAt, setEvStartAt] = useState("");
  const [evEndAt, setEvEndAt] = useState("");

  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseLevel, setCaseLevel] = useState(1);
  const [caseMax, setCaseMax] = useState(100);
  const [caseDesc, setCaseDesc] = useState("");

  const access = user && ev ? myEventAccess(ev.id) : null;
  const lockedForParticipant = !!ev && ev.visibility === "PRIVATE" && !mgr && access?.status !== "APPROVED";

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!ev) return;
      try {
        setLoading(true);
        setErr("");

        const caseRows = await listCasesForEvent(ev.id);
        if (!alive) return;
        setCases(Array.isArray(caseRows) ? caseRows : []);

        if (mgr) {
          const attemptsRows = await adminListAttemptsForEvent(ev.id);
          if (!alive) return;
          setAttempts(Array.isArray(attemptsRows) ? attemptsRows : []);
        }
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setCases([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [ev?.id]); // eslint-disable-line

  if (!ev) {
    return (
      <SiteShell>
        <div className="toastErr">Мероприятие не найдено</div>
        <Link className="btn btnPrimary" to="/events">К мероприятиям</Link>
      </SiteShell>
    );
  }

  const onApply = async () => {
    try {
      setErr("");
      await applyToEvent(ev.id);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onSaveEvent = async () => {
    try {
      setErr("");
      await adminUpdateEvent(ev.id, {
        title: evTitle,
        visibility: evVis,
        description: evDesc,
        isActive: evActive,
        startAt: evStartAt,
        endAt: evEndAt
      });
      await refreshEvents();
      setEditOpen(false);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onCreateCase = async () => {
    try {
      setErr("");
      await adminAddCase({
        eventId: ev.id,
        title: caseTitle,
        level: caseLevel,
        maxScore: caseMax,
        shortDescription: caseDesc
      });

      const caseRows = await listCasesForEvent(ev.id);
      setCases(Array.isArray(caseRows) ? caseRows : []);

      setAddCaseOpen(false);
      setCaseTitle("");
      setCaseLevel(1);
      setCaseMax(100);
      setCaseDesc("");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  return (
    <SiteShell>
      <div className="col">
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1">{ev.title}</div>
            <div className="mutedSmall">{ev.description || "—"}</div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className={`chip ${ev.visibility === "PUBLIC" ? "chipGood" : "chipRed"}`}>
              {ev.visibility === "PUBLIC" ? "Открыто" : "По заявке"}
            </span>

            {lockedForParticipant && (
              <button className="btn btnPrimary" onClick={onApply}>
                Подать заявку
              </button>
            )}

            {mgr && (
              <>
                <button
                  className="btn"
                  onClick={() => {
                    setEvTitle(ev.title);
                    setEvVis(ev.visibility);
                    setEvDesc(ev.description || "");
                    setEvActive(ev.isActive !== false);
                    setEvStartAt(ev.startAt || "");
                    setEvEndAt(ev.endAt || "");
                    setEditOpen(true);
                  }}
                >
                  Редактировать
                </button>

                <button className="btn btnPrimary" onClick={() => setAddCaseOpen(true)}>
                  + Кейс
                </button>
              </>
            )}
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        {lockedForParticipant ? (
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardInner col" style={{ gap: 8 }}>
              <div className="h2">Доступ по заявке</div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="mutedSmall">Загрузка...</div>
        ) : (
          <div className="grid2">
            {cases.map((c) => (
              <CaseCard key={c.id} c={c} locked={false} eventTitle={ev.title} />
            ))}
          </div>
        )}

        {mgr && (
          <>
            <div className="rowBetween" style={{ marginTop: 10 }}>
              <div className="h2">Попытки участников</div>
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
                        <td colSpan={5} className="muted">—</td>
                      </tr>
                    ) : (
                      attempts.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div style={{ fontWeight: 900 }}>{a.userName || "—"}</div>
                            <div className="mutedSmall">{a.userEmail || "—"}</div>
                          </td>
                          <td><b>{a.caseTitle}</b></td>
                          <td className="mutedSmall">{a.status}</td>
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

        <Modal open={editOpen} title="Мероприятие" onClose={() => setEditOpen(false)}>
          <div className="col" style={{ gap: 10 }}>
            <label className="mutedSmall">Название *</label>
            <input className="input" value={evTitle} onChange={(e) => setEvTitle(e.target.value)} />

            <label className="mutedSmall">Тип *</label>
            <select className="select" value={evVis} onChange={(e) => setEvVis(e.target.value)}>
              <option value="PUBLIC">Открыто</option>
              <option value="PRIVATE">По заявке</option>
            </select>

            <label className="mutedSmall">Активно</label>
            <select className="select" value={evActive ? "1" : "0"} onChange={(e) => setEvActive(e.target.value === "1")}>
              <option value="1">Да</option>
              <option value="0">Нет</option>
            </select>

            <div className="grid2">
              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Начало периода (ISO)</label>
                <input className="input" value={evStartAt} onChange={(e) => setEvStartAt(e.target.value)} placeholder="2026-03-01T00:00:00.000Z" />
              </div>
              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Конец периода (ISO)</label>
                <input className="input" value={evEndAt} onChange={(e) => setEvEndAt(e.target.value)} placeholder="2026-04-01T00:00:00.000Z" />
              </div>
            </div>

            <label className="mutedSmall">Описание</label>
            <textarea className="textarea" value={evDesc} onChange={(e) => setEvDesc(e.target.value)} />

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btnPrimary" onClick={onSaveEvent}>Сохранить</button>
            </div>
          </div>
        </Modal>

        <Modal open={addCaseOpen} title="Новый кейс" onClose={() => setAddCaseOpen(false)}>
          <div className="col" style={{ gap: 10 }}>
            <label className="mutedSmall">Название *</label>
            <input className="input" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} />

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
                <input className="input" type="number" value={caseMax} onChange={(e) => setCaseMax(Number(e.target.value))} />
              </div>
            </div>

            <label className="mutedSmall">Описание *</label>
            <textarea className="textarea" value={caseDesc} onChange={(e) => setCaseDesc(e.target.value)} />

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btnPrimary" onClick={onCreateCase}>Создать</button>
            </div>
          </div>
        </Modal>
      </div>
    </SiteShell>
  );
}