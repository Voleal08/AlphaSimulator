import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import Modal from "../components/Modal";
import { useAppStore } from "../store/AppStore";

export default function Events() {
  const { listEvents, refreshEvents, isManager, adminCreateEvent } = useAppStore();
  const mgr = isManager();
  const loc = useLocation();

  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        setRows(null);
        await refreshEvents();
        if (!alive) return;
        setRows(listEvents());
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setRows([]);
      }
    })();

    return () => { alive = false; };
  }, [refreshEvents]); // eslint-disable-line

  useEffect(() => {
    if (!mgr) return;
    const sp = new URLSearchParams(loc.search || "");
    if (sp.get("create") === "1") setOpen(true);
  }, [mgr, loc.search]);

  const onCreate = async () => {
    try {
      setErr("");
      setSaving(true);

      await adminCreateEvent({ title, visibility, description });
      await refreshEvents();
      setRows(listEvents());

      setOpen(false);
      setTitle("");
      setVisibility("PUBLIC");
      setDescription("");
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SiteShell>
      <div className="col">
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="h1">Мероприятия</div>
          {mgr && (
            <button className="btn btnPrimary" onClick={() => { setErr(""); setOpen(true); }}>
              + Добавить
            </button>
          )}
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        {rows === null ? (
          <div className="mutedSmall">Загрузка...</div>
        ) : (
          <div className="grid2">
            {rows.map((e) => (
              <Link key={e.id} className="card eventCard" to={`/events/${e.id}`}>
                <div className="cardInner col">
                  <div className="rowBetween">
                    <div className="h2">{e.title}</div>
                    <span className={`chip ${e.visibility === "PUBLIC" ? "chipGood" : "chipRed"}`}>
                      {e.visibility === "PUBLIC" ? "Открыто" : "По заявке"}
                    </span>
                  </div>
                  <div className="mutedSmall">{e.description || "—"}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Modal open={open} title="Новое мероприятие" onClose={() => setOpen(false)}>
          <div className="col">
            {err ? <div className="toastErr">{err}</div> : null}

            <label className="mutedSmall">Название *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

            <label className="mutedSmall">Тип *</label>
            <select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="PUBLIC">Открыто</option>
              <option value="PRIVATE">По заявке</option>
            </select>

            <label className="mutedSmall">Описание</label>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btnPrimary" onClick={onCreate} disabled={saving}>
                {saving ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SiteShell>
  );
}