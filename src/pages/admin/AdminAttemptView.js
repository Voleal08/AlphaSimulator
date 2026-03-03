import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteShell from "../../components/SiteShell";
import { useAppStore } from "../../store/AppStore";

function roleLabel(role) {
  if (role === "user") return "Участник";
  if (role === "assistant") return "Модель";
  if (role === "manager") return "Администратор";
  return role || "—";
}

export default function AdminAttemptView() {
  const { attemptId } = useParams();
  const bottomRef = useRef(null);

  const { adminGetAttemptBundle, adminSendChat, adminSetAttemptReview } = useAppStore();

  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const [reviewComment, setReviewComment] = useState("");
  const [reviewScore, setReviewScore] = useState("");

  const bundle = useMemo(() => {
    try {
      return { data: adminGetAttemptBundle(attemptId), err: "" };
    } catch (e) {
      return { data: null, err: String(e?.message || e) };
    }
  }, [adminGetAttemptBundle, attemptId]);

  const messages = useMemo(() => {
    if (!bundle.data) return [];
    return (bundle.data.chat || []).slice().sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }, [bundle.data]);

  useEffect(() => {
    if (!bundle.data?.attempt) return;
    setReviewComment(bundle.data.attempt.managerComment || "");
    setReviewScore(
      typeof bundle.data.attempt.managerScore === "number" ? String(bundle.data.attempt.managerScore) : ""
    );
  }, [bundle.data?.attempt?.id]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const onSend = () => {
    setErr("");
    try {
      adminSendChat(attemptId, text);
      setText("");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onSaveReview = () => {
    setErr("");
    try {
      adminSetAttemptReview(attemptId, {
        managerComment: reviewComment,
        managerScore: reviewScore === "" ? null : Number(reviewScore)
      });
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  if (bundle.err) {
    return (
      <SiteShell>
        <div className="toastErr">{bundle.err}</div>
        <Link className="btn btnPrimary" to="/admin/attempts">Назад</Link>
      </SiteShell>
    );
  }

  const { attempt, user, case: c } = bundle.data;
  const finalScore = typeof attempt.managerScore === "number" ? attempt.managerScore : attempt.score;

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6, minWidth: 0 }}>
            <div className="h1" style={{ fontSize: 24 }}>Попытка</div>
            <div className="mutedSmall">
              {user?.profile?.fullName || "—"} · {user?.email || "—"} · {c?.title || "—"}
            </div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className="chip chipMuted">Токены: {attempt?.tokensSpent || 0}</span>
            <span className={`chip ${attempt?.status === "SCORED" ? "chipGood" : "chipWarn"}`}>
              {attempt?.status === "SCORED" ? "Завершён" : "В работе"}
            </span>
            {attempt?.status === "SCORED" ? (
              <span className="chip chipGood">Итог: {finalScore ?? "—"}</span>
            ) : null}
            <Link className="btn" to="/admin/attempts">Назад</Link>
          </div>
        </div>

        {err ? <div className="toastErr">{err}</div> : null}

        <div className="grid2">
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Диалог</div>

              <div className="chatThread" style={{ height: 520 }}>
                {messages.length === 0 ? (
                  <div className="mutedSmall">Сообщений пока нет.</div>
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

              <div className="h2">Ответ участнику</div>
              <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение от администратора..." />
              <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                <button className="btn btnPrimary" onClick={onSend}>Отправить</button>
                <div className="mutedSmall">Сообщение появится у участника в этом же чате.</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="rowBetween">
                <div className="h2">Решение участника</div>
                <span className="chip chipMuted">{attempt?.submittedAt ? `Сдано: ${attempt.submittedAt}` : "Ещё не сдано"}</span>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardInner" style={{ whiteSpace: "pre-wrap", minHeight: 220 }}>
                  {attempt?.solution ? attempt.solution : "Пока нет решения."}
                </div>
              </div>

              <div className="h2">Комментарий и оценка</div>
              <div className="col" style={{ gap: 8 }}>
                <label className="mutedSmall">Комментарий администратора</label>
                <textarea className="textarea" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />

                <label className="mutedSmall">Оценка (необязательно)</label>
                <input className="input" type="number" value={reviewScore} onChange={(e) => setReviewScore(e.target.value)} />

                <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                  <button className="btn btnPrimary" onClick={onSaveReview}>Сохранить</button>
                  <div className="mutedSmall">
                    {attempt?.managerReviewedAt ? `Обновлено: ${attempt.managerReviewedAt}` : "—"}
                  </div>
                </div>
              </div>

              {attempt?.managerComment ? (
                <div className="card" style={{ boxShadow: "none" }}>
                  <div className="cardInner">
                    <div className="mutedSmall">Текущий комментарий:</div>
                    <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{attempt.managerComment}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}