import React, { useMemo, useState } from "react";
import SiteShell from "../../components/SiteShell";
import Modal from "../../components/Modal";
import { useAppStore } from "../../store/AppStore";

export default function AdminCases() {
  const { db, listEvents, adminAddCase, adminUpdateCase, adminDeleteCase } = useAppStore();

  const events = useMemo(() => listEvents(), [listEvents]);
  const eventById = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events]);

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const editing = useMemo(() => db.cases.find((c) => c.id === editingId) || null, [db.cases, editingId]);

  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState(1);
  const [shortDescription, setShortDescription] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [isPublic, setIsPublic] = useState(false);

  const [err, setErr] = useState(null);

  const rows = useMemo(() => {
    const qq = (q || "").trim().toLowerCase();
    const data = db.cases
      .slice()
      .sort((a, b) => (a.level - b.level) || String(a.title || "").localeCompare(String(b.title || "")));

    if (!qq) return data;

    return data.filter((c) => {
      const ev = eventById[c.eventId];
      const hay = `${c.title} ${c.shortDescription} ${ev?.title || ""}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [db.cases, q, eventById]);

  function resetForm() {
    setErr(null);
    setEditingId(null);

    setEventId(events[0]?.id || "");
    setTitle("");
    setLevel(1);
    setShortDescription("");
    setMaxScore(100);
    setIsPublic(false);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(id) {
    const c = db.cases.find((x) => x.id === id);
    if (!c) return;

    setErr(null);
    setEditingId(id);

    setEventId(c.eventId || events[0]?.id || "");
    setTitle(c.title || "");
    setLevel(Number(c.level || 1));
    setShortDescription(c.shortDescription || "");
    setMaxScore(Number(c.maxScore || 100));
    setIsPublic(!!c.isPublic);

    setOpen(true);
  }

  function submit() {
    setErr(null);

    const t = title.trim();
    const d = shortDescription.trim();

    if (!eventId) return setErr("Выберите мероприятие");
    if (!t) return setErr("Введите название кейса");
    if (!d) return setErr("Введите текст/описание");
    if (!Number.isFinite(maxScore) || maxScore <= 0) return setErr("maxScore должен быть > 0");
    if (![1, 2, 3].includes(level)) return setErr("Уровень должен быть 1..3");

    try {
      if (editingId) {
        adminUpdateCase(editingId, {
          eventId,
          title: t,
          level,
          shortDescription: d,
          maxScore,
          isPublic
        });
      } else {
        adminAddCase({
          eventId,
          title: t,
          level,
          shortDescription: d,
          maxScore,
          isPublic
        });
      }

      setOpen(false);
      resetForm();
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1">Кейсы (админ)</div>
            <div className="mutedSmall">Создание и редактирование кейсов (пока локально, позже заменится на API).</div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ width: "min(420px, 72vw)" }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по кейсам..."
            />
            <button className="btn btnPrimary" onClick={openCreate} disabled={events.length === 0}>
              + Добавить кейс
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="toastErr">Сначала создайте хотя бы одно мероприятие (страница «Мероприятия»).</div>
        ) : null}

        <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
          <div className="cardInner" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Мероприятие</th>
                  <th>Кейс</th>
                  <th>Уровень</th>
                  <th>Открытый</th>
                  <th>Макс</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted" style={{ padding: 12 }}>
                      Кейсов пока нет.
                    </td>
                  </tr>
                ) : (
                  rows.map((c) => {
                    const ev = eventById[c.eventId];
                    return (
                      <tr key={c.id}>
                        <td className="mutedSmall">{ev?.title || "—"}</td>
                        <td>
                          <div style={{ fontWeight: 950 }}>{c.title}</div>
                          <div className="mutedSmall" style={{ maxWidth: 520 }}>
                            {c.shortDescription || "—"}
                          </div>
                        </td>
                        <td className="mutedSmall">{c.level}</td>
                        <td>
                          <span className={`chip ${c.isPublic ? "chipGood" : "chipMuted"}`}>
                            {c.isPublic ? "Да" : "Нет"}
                          </span>
                        </td>
                        <td className="mutedSmall">{c.maxScore}</td>
                        <td>
                          <div className="row" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <button className="btn" onClick={() => openEdit(c.id)}>
                              Редактировать
                            </button>
                            <button
                              className="btn"
                              style={{
                                borderColor: "rgba(var(--brand-red), 0.55)",
                                color: "rgb(var(--brand-red))",
                                background: "transparent"
                              }}
                              onClick={() => {
                                if (window.confirm("Удалить кейс? Также удалятся попытки и чат по нему.")) {
                                  adminDeleteCase(c.id);
                                }
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          open={open}
          title={editing ? "Редактирование кейса" : "Новый кейс"}
          onClose={() => {
            setOpen(false);
            resetForm();
          }}
        >
          <div className="col" style={{ gap: 10 }}>
            {err && <div className="toastErr">{err}</div>}

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Мероприятие *</label>
              <select className="select" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.visibility === "PUBLIC" ? "Открыто" : "По заявке"})
                  </option>
                ))}
              </select>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Название *</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid2">
              <div className="col" style={{ gap: 6 }}>
                <label className="mutedSmall">Уровень *</label>
                <select className="select" value={level} onChange={(e) => setLevel(Number(e.target.value))}>
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
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Открытый кейс</label>
              <select className="select" value={isPublic ? "yes" : "no"} onChange={(e) => setIsPublic(e.target.value === "yes")}>
                <option value="no">Нет</option>
                <option value="yes">Да</option>
              </select>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Текст/описание *</label>
              <textarea className="textarea" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
            </div>

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button
                className="btn"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Отмена
              </button>
              <button className="btn btnPrimary" onClick={submit}>
                {editing ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SiteShell>
  );
}