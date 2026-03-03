import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import Modal from "../components/Modal";
import { useAppStore } from "../store/AppStore";

export default function Events() {
  const { listEvents, isManager, adminCreateEvent } = useAppStore();
  const events = listEvents();
  const mgr = isManager();
  const loc = useLocation();

  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!mgr) return;
    const sp = new URLSearchParams(loc.search || "");
    if (sp.get("create") === "1") {
      setErr(null);
      setOpen(true);
    }
  }, [mgr, loc.search]);

  return (
    <SiteShell>
      <div className="col">
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="h1">Мероприятия</div>
          {mgr && (
            <button className="btn btnPrimary" onClick={() => { setErr(null); setOpen(true); }}>
              + Добавить
            </button>
          )}
        </div>

        <div className="grid2">
          {events.map((e) => (
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

        <Modal open={open} title="Новое мероприятие" onClose={() => setOpen(false)}>
          <div className="col">
            {err && <div className="toastErr">{err}</div>}

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
              <button
                className="btn btnPrimary"
                onClick={() => {
                  setErr(null);
                  try {
                    adminCreateEvent({ title, visibility, description });
                    setOpen(false);
                    setTitle("");
                    setVisibility("PUBLIC");
                    setDescription("");
                  } catch (e) {
                    setErr(String(e.message || e));
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