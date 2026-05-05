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

  const {
    user,
    isManager,
    getCase,
    getCaseSync,
    getCaseEvent,
    getAttemptByCase,
    getAttemptByCaseSync,
    getChat,
    getChatSync,
    sendChat
  } = useAppStore();

  const mgr = isManager();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [caseData, setCaseData] = useState(() => getCaseSync(caseId));
  const [eventData, setEventData] = useState(() => getCaseEvent(caseId));

  const [attempt, setAttempt] = useState(() => getAttemptByCaseSync(caseId));
  const [messages, setMessages] = useState(() => {
    const att = getAttemptByCaseSync(caseId);
    return att ? getChatSync(att.id) : [];
  });

  const [text, setText] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        let c = getCaseSync(caseId);
        if (!c) {
          c = await getCase(caseId);
        }
        if (!alive) return;

        setCaseData(c || null);
        setEventData(getCaseEvent(caseId));

        if (user?.role === "participant" && !mgr) {
          const a = await getAttemptByCase(caseId);
          if (!alive) return;

          setAttempt(a || null);

          if (a?.id) {
            const chatRows = await getChat(a.id);
            if (!alive) return;
            setMessages(Array.isArray(chatRows) ? chatRows : []);
          } else {
            setMessages([]);
          }
        } else {
          setAttempt(null);
          setMessages([]);
        }
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setCaseData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [caseId]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const onSend = async () => {
    try {
      setErr("");
      if (!attempt) throw new Error("Кейс ещё не начат");
      if (!text.trim()) return;

      await sendChat(attempt.id, text);
      setText("");

      const chatRows = await getChat(attempt.id);
      setMessages(Array.isArray(chatRows) ? chatRows : []);

      const nextAttempt = await getAttemptByCase(caseId);
      setAttempt(nextAttempt || attempt);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  if (loading) {
    return (
      <SiteShell>
        <div className="mutedSmall">Загрузка...</div>
      </SiteShell>
    );
  }

  if (!caseData) {
    return (
      <SiteShell>
        <div className="toastErr">{err || "Кейс не найден"}</div>
        <Link className="btn btnPrimary" to="/events">
          К мероприятиям
        </Link>
      </SiteShell>
    );
  }

  if (mgr || user?.role !== "participant") {
    return (
      <SiteShell>
        <div className="toastErr">Диалог с моделью доступен только участнику.</div>
        <div className="row">
          <Link className="btn btnPrimary" to={`/cases/${caseId}`}>
            К кейсу
          </Link>
        </div>
      </SiteShell>
    );
  }

  if (!attempt) {
    return (
      <SiteShell>
        <div className="toastErr">Кейс ещё не начат. Откройте страницу кейса и начните решение.</div>
        <div className="row">
          <Link className="btn btnPrimary" to={`/cases/${caseId}`}>
            К кейсу
          </Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
            <div className="h1" style={{ fontSize: 24 }}>Диалог с моделью</div>
            <div className="mutedSmall">
              {caseData.title}
              {eventData?.title ? ` · ${eventData.title}` : ""}
            </div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <Link className="btn" to={`/cases/${caseId}`}>
              К кейсу
            </Link>
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        <div className="card">
          <div className="cardInner col" style={{ gap: 10 }}>
            <div className="chatThread chatThreadPage">
              {messages.length === 0 ? (
                <div className="mutedSmall">Пока нет сообщений. Задайте первый вопрос.</div>
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
                        <div className="bubbleText">{m.content}</div>
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

            <textarea
              className="textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={attempt.status === "SCORED" ? "Кейс завершён — диалог закрыт." : "Введите сообщение..."}
              disabled={attempt.status === "SCORED"}
              style={{ minHeight: 110 }}
            />

            <div className="rowBetween" style={{ flexWrap: "wrap" }}>
              <button className="btn btnPrimary" onClick={onSend} disabled={attempt.status === "SCORED"}>
                Отправить
              </button>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}