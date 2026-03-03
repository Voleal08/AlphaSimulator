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
    user,
    isManager,
    getCase,
    getCaseEvent,
    getAttemptByCase,
    startAttempt,
    getChat,
    sendChat,
    submitSolution
  } = useAppStore();

  const mgr = isManager();
  const c = getCase(caseId);
  const ev = getCaseEvent(caseId);

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

  const [err, setErr] = useState("");
  const [chatText, setChatText] = useState("");

  const [solution, setSolution] = useState("");

  // подхватываем решение, если оно уже есть в attempt
  useEffect(() => {
    setSolution(attempt?.solution || "");
  }, [attempt?.id]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (!c) {
    return (
      <SiteShell>
        <div className="toastErr">Кейс не найден или недоступен</div>
        <Link className="btn btnPrimary" to="/events">К мероприятиям</Link>
      </SiteShell>
    );
  }

  const levelLabel = c.level === 1 ? "Уровень 1" : c.level === 2 ? "Уровень 2" : "Уровень 3";

  const onStart = () => {
    setErr("");
    try {
      startAttempt(c.id);
      // остаёмся на этой странице — чат справа появится сам
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onSendChat = () => {
    setErr("");
    try {
      if (!attempt) throw new Error("Сначала начните кейс");
      sendChat(attempt.id, chatText);
      setChatText("");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onSubmitSolution = () => {
    setErr("");
    try {
      if (!attempt) throw new Error("Сначала начните кейс");
      submitSolution(attempt.id, solution);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  return (
    <SiteShell>
      <div className="workspace">
        {/* LEFT: case + solution */}
        <div className="workspaceMain col" style={{ gap: 12 }}>
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="rowBetween" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                <div className="col" style={{ gap: 6, minWidth: 0 }}>
                  <div className="mutedSmall">
                    {levelLabel}
                    {ev?.title ? ` · ${ev.title}` : ""}
                  </div>
                  <div className="h1" style={{ fontSize: 26 }}>
                    {c.title}
                  </div>
                </div>

                <div className="row" style={{ flexWrap: "wrap" }}>
                  <span className="chip chipMuted">Макс: {c.maxScore}</span>
                  {attempt ? (
                    <>
                      <span className="chip chipMuted">Токены: {attempt.tokensSpent || 0}</span>
                      <span className={`chip ${attempt.status === "SCORED" ? "chipGood" : "chipWarn"}`}>
                        {attempt.status === "SCORED" ? "Завершён" : "В работе"}
                      </span>
                      {attempt.score != null ? <span className="chip chipGood">Баллы: {attempt.score}</span> : null}
                    </>
                  ) : null}
                </div>
              </div>

              <div className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                {c.shortDescription}
              </div>

              {err ? <div className="toastErr">{err}</div> : null}

              {mgr ? (
                <div className="col" style={{ gap: 10 }}>
                  <div className="mutedSmall">
                    Вы вошли как администратор/сотрудник. Решать кейсы нельзя — используйте «Проверка решений».
                  </div>
                  <button className="btn btnPrimary" onClick={() => nav("/admin/attempts")}>
                    Перейти в проверку решений
                  </button>
                </div>
              ) : !attempt ? (
                <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                  <button className="btn btnPrimary" onClick={onStart}>
                    Начать кейс
                  </button>
                  <Link className="btn" to="/my-cases">К списку</Link>
                </div>
              ) : (
                <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                  <div className="mutedSmall">
                    Диалог справа. Заполняйте решение ниже и отправляйте, когда будете готовы.
                  </div>
                  <Link className="btn" to="/my-cases">К списку</Link>
                </div>
              )}
            </div>
          </div>

          {!mgr && attempt?.status === "IN_PROGRESS" ? (
            <div className="card">
              <div className="cardInner col" style={{ gap: 10 }}>
                <div className="h2">Решение</div>
                <div className="mutedSmall">
                  Опишите план действий: кадровые, операционные, PR и финансовые меры.
                </div>

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
                  <div className="mutedSmall">После отправки кейс будет закрыт для повторного прохождения.</div>
                </div>
              </div>
            </div>
          ) : null}

          {!mgr && attempt?.status === "SCORED" ? (
            <div className="card">
              <div className="cardInner col" style={{ gap: 10 }}>
                <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                  <div className="h2">Результат</div>
                  <span className="chip chipGood">
                    Баллы: {attempt.score}/{c.maxScore}
                  </span>
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

        {/* RIGHT: chat */}
        <div className="workspaceChat">
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                <div className="h2">Диалог с моделью</div>
                {attempt ? <span className="chip chipMuted">tokens: {attempt.tokensSpent || 0}</span> : null}
              </div>

              {!attempt ? (
                <div className="mutedSmall">
                  Начните кейс, чтобы открыть диалог.
                </div>
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

                  <textarea
                    className="textarea"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder={attempt.status === "SCORED" ? "Кейс завершён — диалог закрыт." : "Введите вопрос..."}
                    disabled={attempt.status === "SCORED"}
                    style={{ minHeight: 90 }}
                  />

                  <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                    <button className="btn btnPrimary" onClick={onSendChat} disabled={attempt.status === "SCORED"}>
                      Отправить
                    </button>
                    <div className="mutedSmall">Чем короче вопросы — тем лучше по токенам.</div>
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