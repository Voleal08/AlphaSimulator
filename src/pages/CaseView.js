import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

function roleLabel(role) {
  if (role === "user") return "Участник";
  if (role === "assistant") return "Модель";
  if (role === "manager") return "Администратор";
  return role || "—";
}

export default function CaseView() {
  const { caseId } = useParams();
  const nav = useNavigate();
  const bottomRef = useRef(null);

  const {
    db,
    user,
    isManager,
    getCase,
    getCaseSync,
    getCaseEvent,
    getAttemptByCase,
    getAttemptByCaseSync,
    startAttempt,
    getChat,
    getChatSync,
    sendChat,
    submitSolution
  } = useAppStore();

  const mgr = isManager();

  const rawCase = useMemo(() => {
    return (db.cases || []).find((x) => x.id === caseId) || null;
  }, [db.cases, caseId]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [caseData, setCaseData] = useState(() => getCaseSync(caseId) || rawCase);
  const [eventData, setEventData] = useState(() => getCaseEvent(caseId));

  const [attempt, setAttempt] = useState(() => getAttemptByCaseSync(caseId));
  const [messages, setMessages] = useState(() => {
    const att = getAttemptByCaseSync(caseId);
    return att ? getChatSync(att.id) : [];
  });

  const [chatText, setChatText] = useState("");
  const [solution, setSolution] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        let c = getCaseSync(caseId);
        if (!c) c = await getCase(caseId);
        if (!alive) return;

        setCaseData(c || null);
        setEventData(getCaseEvent(caseId));

        if (user?.role === "participant") {
          const a = await getAttemptByCase(caseId);
          if (!alive) return;

          setAttempt(a || null);
          setSolution(a?.solution || "");

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
    setSolution(attempt?.solution || "");
  }, [attempt?.id]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

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

  const levelLabel =
    caseData.level === 1 ? "Уровень 1" :
    caseData.level === 2 ? "Уровень 2" :
    "Уровень 3";

  const onStart = async () => {
    try {
      setErr("");
      const a = await startAttempt(caseData.id);
      setAttempt(a || null);
      setSolution(a?.solution || "");

      if (a?.id) {
        const chatRows = await getChat(a.id);
        setMessages(Array.isArray(chatRows) ? chatRows : []);
      }
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onSendChat = async () => {
    try {
      setErr("");
      if (!attempt) throw new Error("Сначала начните кейс");
      if (!chatText.trim()) return;

      await sendChat(attempt.id, chatText);
      setChatText("");

      const nextAttempt = await getAttemptByCase(caseId);
      setAttempt(nextAttempt || attempt);

      const chatRows = await getChat(attempt.id);
      setMessages(Array.isArray(chatRows) ? chatRows : []);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onSubmitSolution = async () => {
    try {
      setErr("");
      if (!attempt) throw new Error("Сначала начните кейс");
      const a = await submitSolution(attempt.id, solution);
      setAttempt(a || attempt);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  return (
    <SiteShell>
      <div className="workspace">
        <div className="workspaceMain col" style={{ gap: 12 }}>
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="rowBetween caseHeaderRow" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                <div className="col" style={{ gap: 6, minWidth: 0 }}>
                  <div className="mutedSmall">
                    {levelLabel}
                    {eventData?.title ? ` · ${eventData.title}` : ""}
                  </div>
                  <div className="h1" style={{ fontSize: 26 }}>
                    {caseData.title}
                  </div>
                </div>

                <div className="caseHeaderBadges">
                  <span className="chip chipMuted">Макс: {caseData.maxScore}</span>
                  {attempt ? (
                    <>
                      <span className={`chip ${attempt.status === "SCORED" ? "chipGood" : "chipWarn"}`}>
                        {attempt.status === "SCORED" ? "Завершён" : "В работе"}
                      </span>
                      {attempt.score != null ? (
                        <span className="chip chipGood">Баллы: {attempt.score}</span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              <div className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                {caseData.shortDescription}
              </div>

              {err ? <div className="toastErr">{err}</div> : null}

              {mgr ? (
                <div className="col" style={{ gap: 10 }}>
                  <div className="mutedSmall">Администратор не решает кейсы.</div>
                  <button className="btn btnPrimary" onClick={() => nav("/admin/attempts")}>
                    Перейти в проверку
                  </button>
                </div>
              ) : !attempt ? (
                <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                  <button className="btn btnPrimary" onClick={onStart}>
                    Начать кейс
                  </button>
                  <Link className="btn" to="/my-cases">
                    К списку
                  </Link>
                </div>
              ) : (
                <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                  <Link className="btn" to="/my-cases">
                    К списку
                  </Link>
                </div>
              )}
            </div>
          </div>

          {!mgr && attempt?.status === "IN_PROGRESS" ? (
            <div className="card">
              <div className="cardInner col" style={{ gap: 10 }}>
                <div className="h2">Решение</div>
                <textarea
                  className="textarea"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Ваше решение..."
                />

                <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                  <button className="btn btnPrimary" onClick={onSubmitSolution}>
                    Отправить решение
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {!mgr && attempt?.status === "SCORED" ? (
            <div className="card">
              <div className="cardInner col" style={{ gap: 10 }}>
                <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                  <div className="h2">Результат</div>
                  <span className="chip chipGood">Баллы: {attempt.score}/{caseData.maxScore}</span>
                </div>

                <div className="mutedSmall">Отправлено: {attempt.submittedAt || "—"}</div>

                <div className="h2" style={{ marginTop: 6 }}>Ваше решение</div>
                <div className="card" style={{ boxShadow: "none" }}>
                  <div className="cardInner" style={{ whiteSpace: "pre-wrap" }}>
                    {attempt.solution || "—"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="workspaceChat">
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                <div className="h2">Диалог с моделью</div>
                {attempt ? (
                  <Link className="btn" to={`/cases/${caseData.id}/chat`}>
                    Открыть в разделе чата
                  </Link>
                ) : null}
              </div>

              {!attempt ? (
                <div className="mutedSmall">Начните кейс, чтобы открыть диалог.</div>
              ) : (
                <>
                  <div className="chatThread">
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
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder={attempt.status === "SCORED" ? "Кейс завершён — диалог закрыт." : "Введите вопрос..."}
                    disabled={attempt.status === "SCORED"}
                    style={{ minHeight: 90 }}
                  />

                  <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                    <button
                      className="btn btnPrimary"
                      onClick={onSendChat}
                      disabled={attempt.status === "SCORED"}
                    >
                      Отправить
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}