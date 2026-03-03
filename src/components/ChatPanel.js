import React, { useMemo, useState } from "react";
import { useAppStore } from "../store/AppStore";

export default function ChatPanel({ attemptId, disabledReason }) {
  const { getChat, sendChat } = useAppStore();
  const [text, setText] = useState("");
  const [err, setErr] = useState(null);

  const messages = useMemo(() => (attemptId ? getChat(attemptId) : []), [attemptId, getChat]);

  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div className="cardInner col">
        <div className="rowBetween">
          <div className="h2">Диалог</div>
        </div>

        {disabledReason && <div className="toastErr">{disabledReason}</div>}
        {err && <div className="toastErr">{err}</div>}

        <div className="card chatBox">
          <div className="cardInner col" style={{ gap: 10 }}>
            {messages.length === 0 ? (
              <div className="muted">—</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  <b>{m.role === "user" ? "Вы" : "Модель"}:</b> {m.content}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="row" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: 1 }} className="col">
            <input
              className="input"
              value={text}
              disabled={!!disabledReason}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (disabledReason) return;
                  if (!text.trim()) return;
                  setErr(null);
                  try {
                    sendChat(attemptId, text);
                    setText("");
                  } catch (ex) {
                    setErr(String(ex.message || ex));
                  }
                }
              }}
              placeholder="Сообщение…"
            />
          </div>

          <button
            className="btn btnPrimary"
            disabled={!!disabledReason || !text.trim()}
            onClick={() => {
              if (disabledReason) return;
              if (!text.trim()) return;
              setErr(null);
              try {
                sendChat(attemptId, text);
                setText("");
              } catch (ex) {
                setErr(String(ex.message || ex));
              }
            }}
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}