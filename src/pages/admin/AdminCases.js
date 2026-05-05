import React, { useEffect, useMemo, useState } from "react";
import SiteShell from "../../components/SiteShell";
import Modal from "../../components/Modal";
import { useAppStore } from "../../store/AppStore";

export default function AdminCases() {
  const { db, listEvents, refreshEvents, adminAddCase, adminUpdateCase, adminDeleteCase } = useAppStore();

  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState("");

  const events = useMemo(() => listEvents(), [listEvents]);
  const eventById = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events]);

  const [eventId, setEventId] = useState("");
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState(1);
  const [shortDescription, setShortDescription] = useState("");
  const [maxScore, setMaxScore] = useState(100);

  useEffect(() => {
    (async () => {
      try {
        await refreshEvents();
      } catch (_) {}
    })();
  }, [refreshEvents]);

  useEffect(() => {
    const q = String(query || "").trim().toLowerCase();

    const data = (db.cases || [])
      .slice()
      .sort((a, b) => (a.level - b.level) || String(a.title || "").localeCompare(String(b.title || "")))
      .filter((c) => {
        if (!q) return true;
        const ev = eventById[c.eventId];
        const hay = `${c.title} ${c.shortDescription} ${ev?.title || ""}`.toLowerCase();
        return hay.includes(q);
      });

    setRows(data);
  }, [db.cases, query, eventById]);

  function resetForm() {
    setErr("");
    setEditingId(null);
    setEventId(events[0]?.id || "");
    setTitle("");
    setLevel(1);
    setShortDescription("");
    setMaxScore(100);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(id) {
    const c = (db.cases || []).find((x) => x.id === id);
    if (!c) return;

    setErr("");
    setEditingId(id);
    setEventId(c.eventId || events[0]?.id || "");
    setTitle(c.title || "");
    setLevel(Number(c.level || 1));
    setShortDescription(c.shortDescription || "");
    setMaxScore(Number(c.maxScore || 100));
    setOpen(true);
  }

  async function submit() {
    setErr("");

    const t = title.trim();
    const d = shortDescription.trim();

    if (!eventId) return setErr("Выберите мероприятие");
    if (!t) return setErr("Введите название кейса");
    if (!d) return setErr("Введите текст/описание");
    if (!Number.isFinite(maxScore) || maxScore <= 0) return setErr("maxScore должен быть > 0");
    if (![1, 2, 3].includes(level)) return setErr("Уровень должен быть 1..3");

    try {
      if (editingId) {
        await adminUpdateCase(editingId, {
          eventId,
          title: t,
          level,
          shortDescription: d,
          maxScore
        });
      } else {
        await adminAddCase({
          eventId,
          title: t,
          level,
          shortDescription: d,
          maxScore
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
          <div className="h1">Кейсы (админ)</div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ width: "min(420px, 72vw)" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по кейсам..."
            />
            <button className="btn btnPrimary" onClick={openCreate} disabled={events.length === 0}>
              + Добавить кейс
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="toastErr">Сначала создайте хотя бы одно мероприятие.</div>
        ) : null}

        <div className="card" style={{ boxShadow: "none", overflow: "auto" }}>
          <div className="cardInner" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Мероприятие</th>
                  <th>Кейс</th>
                  <th>Уровень</th>
                  <th>Макс</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted" style={{ padding: 12 }}>Кейсов пока нет.</td>
                  </tr>
                ) : (
                  rows.map((c) => {
                    const ev = eventById[c.eventId];
                    return (
                      <tr key={c.id}>
                        <td className="mutedSmall">{ev?.title || "—"}</td>
                        <td>
                          <div style={{ fontWeight: 950 }}>{c.title}</div>
                          <div className="mutedSmall" style={{ maxWidth: 520 }}>{c.shortDescription || "—"}</div>
                        </td>
                        <td className="mutedSmall">{c.level}</td>
                        <td className="mutedSmall">{c.maxScore}</td>
                        <td>
                          <div className="row" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <button className="btn" onClick={() => openEdit(c.id)}>Редактировать</button>
                            <button
                              className="btn"
                              style={{
                                borderColor: "rgb(var(--brand-red))",
                                color: "rgb(var(--brand-red))",
                                background: "transparent"
                              }}
                              onClick={async () => {
                                if (window.confirm("Удалить кейс?")) {
                                  await adminDeleteCase(c.id);
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
          title={editingId ? "Редактирование кейса" : "Новый кейс"}
          onClose={() => {
            setOpen(false);
            resetForm();
          }}
        >
          <div className="col" style={{ gap: 10 }}>
            {err ? <div className="toastErr">{err}</div> : null}

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Мероприятие *</label>
              <select className="select" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
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
                <input className="input" type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
              </div>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label className="mutedSmall">Описание *</label>
              <textarea className="textarea" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
            </div>

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btnPrimary" onClick={submit}>
                {editingId ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SiteShell>
  );
}