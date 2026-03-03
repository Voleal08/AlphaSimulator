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

  const [err, setErr] = useState("");
  const [text, setText] = useState("");

  const [comment, setComment] = useState("");
  const [score, setScore] = useState("");

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!bundle.data?.attempt) return;
    setComment(bundle.data.attempt.managerComment || "");
    setScore(typeof bundle.data.attempt.managerScore === "number" ? String(bundle.data.attempt.managerScore) : "");
  }, [bundle.data?.attempt?.id]); // eslint-disable-line

  if (bundle.err) {
    return (
      <SiteShell>
        <div className="toastErr">{bundle.err}</div>
        <Link className="btn btnPrimary" to="/admin/attempts">Назад</Link>
      </SiteShell>
    );
  }

  const { attempt, user, case: c } = bundle.data;

  const onSend = () => {
    setErr("");
    try {
      adminSendChat(attemptId, text);
      setText("");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onSave = () => {
    setErr("");
    try {
      adminSetAttemptReview(attemptId, {
        managerComment: comment,
        managerScore: score === "" ? null : Number(score)
      });
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6, minWidth: 0 }}>
            <div className="h1" style={{ fontSize: 24 }}>Попытка</div>
            <div className="mutedSmall">
              <Link to={`/admin/users/${user?.id}`} style={{ textDecoration: "underline" }}>
                {user?.profile?.fullName || "—"} · {user?.email || "—"}
              </Link>
              {" "}· {c?.title || "—"}
            </div>
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
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
                  messages.map((m) => (
                    <div key={m.id} style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.5 }}>
                      <b>{roleLabel(m.role)}:</b> {m.content}
                      <div className="mutedSmall">{m.createdAt ? String(m.createdAt).slice(0, 19).replace("T", " ") : ""}</div>
                      <div style={{ height: 10 }} />
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="h2">Сообщение участнику</div>
              <textarea
                className="textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Сообщение от администратора..."
              />
              <button className="btn btnPrimary" onClick={onSend}>Отправить</button>
            </div>
          </div>

          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                <div className="h2">Решение</div>
                <span className="chip chipMuted">{attempt?.submittedAt ? `Сдано: ${attempt.submittedAt}` : "Не сдано"}</span>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardInner" style={{ whiteSpace: "pre-wrap", minHeight: 220 }}>
                  {attempt?.solution || "—"}
                </div>
              </div>

              <div className="h2">Комментарий и оценка</div>

              <label className="mutedSmall">Комментарий</label>
              <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} />

              <label className="mutedSmall">Оценка (0..{c?.maxScore ?? 100})</label>
              <input className="input" type="number" value={score} onChange={(e) => setScore(e.target.value)} />

              <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                <button className="btn btnPrimary" onClick={onSave}>Сохранить</button>
                <div className="mutedSmall">{attempt?.managerReviewedAt ? `Обновлено: ${attempt.managerReviewedAt}` : "—"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}