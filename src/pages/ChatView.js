import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

function roleLabel(role) {
  if (role === "user") return "Участник";
  if (role === "assistant") return "Модель";
  if (role === "manager") return "Администратор";
  return role || "—";
}

export default function ChatView() {
  const { caseId } = useParams();
  const bottomRef = useRef(null);

  const { isManager, getCase, getAttemptByCase, getChat, sendChat } = useAppStore();
  const mgr = isManager();

  const c = getCase(caseId);

  const attempt = useMemo(() => {
    if (mgr) return null;
    return getAttemptByCase(caseId);
  }, [mgr, getAttemptByCase, caseId]);

  const messages = useMemo(() => {
    if (!attempt) return [];
    return (getChat(attempt.id) || [])
      .slice()
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }, [attempt, getChat]);

  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (!c) {
    return (
      <SiteShell>
        <div className="toastErr">Кейс не найден</div>
        <Link className="btn" to="/">На главную</Link>
      </SiteShell>
    );
  }

  if (mgr) {
    return (
      <SiteShell>
        <div className="toastErr">Администратор не проходит кейсы. Используйте «Проверка решений».</div>
        <Link className="btn btnPrimary" to="/admin/attempts">Перейти</Link>
      </SiteShell>
    );
  }

  if (!attempt) {
    return (
      <SiteShell>
        <div className="toastErr">Кейс ещё не начат</div>
        <Link className="btn btnPrimary" to={`/cases/${caseId}`}>Перейти к кейсу</Link>
      </SiteShell>
    );
  }

  const onSend = () => {
    setErr("");
    try {
      sendChat(attempt.id, text);
      setText("");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1" style={{ fontSize: 24 }}>Диалог</div>
            <div className="mutedSmall">{c.title}</div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className="chip chipMuted">Токены: {attempt.tokensSpent || 0}</span>
            <Link className="btn" to={`/cases/${caseId}`}>К кейсу</Link>
          </div>
        </div>

        <div className="card">
          <div className="chatThread">
            {messages.length === 0 ? (
              <div className="mutedSmall">Пока нет сообщений. Задайте первый уточняющий вопрос.</div>
            ) : (
              messages.map((m) => {
                const rowCls =
                  m.role === "user" ? "msgRow msgRow--user"
                  : m.role === "manager" ? "msgRow msgRow--manager"
                  : "msgRow msgRow--assistant";

                const bubbleCls =
                  m.role === "user" ? "bubble bubble--user"
                  : m.role === "manager" ? "bubble bubble--manager"
                  : "bubble bubble--assistant";

                return (
                  <div key={m.id} className={rowCls}>
                    <div className={bubbleCls}>
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                      <div className="msgMeta">
                        {roleLabel(m.role)} · {m.createdAt ? String(m.createdAt).slice(11, 16) : "—"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        <div className="card">
          <div className="cardInner col" style={{ gap: 10 }}>
            <div className="h2">Сообщение модели</div>
            <textarea
              className="textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите вопрос/уточнение..."
            />
            <div className="rowBetween" style={{ flexWrap: "wrap" }}>
              <button className="btn btnPrimary" onClick={onSend} disabled={attempt.status === "SCORED"}>
                Отправить
              </button>
              {attempt.status === "SCORED" ? (
                <div className="mutedSmall">Кейс завершён — диалог закрыт.</div>
              ) : (
                <div className="mutedSmall">Совет: формулируйте вопросы коротко и по делу.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}