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

  const [bundle, setBundle] = useState(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [text, setText] = useState("");
  const [comment, setComment] = useState("");
  const [score, setScore] = useState("");

  const messages = useMemo(() => {
    if (!bundle?.chat) return [];
    return bundle.chat.slice().sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }, [bundle]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await adminGetAttemptBundle(attemptId);
        if (!alive) return;
        setBundle(data || null);
        setComment(data?.attempt?.managerComment || "");
        setScore(typeof data?.attempt?.managerScore === "number" ? String(data.attempt.managerScore) : "");
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setBundle(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [attemptId, adminGetAttemptBundle]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const onSend = async () => {
    try {
      setErr("");
      setOk("");
      if (!text.trim()) return;
      await adminSendChat(attemptId, text);
      setText("");
      const data = await adminGetAttemptBundle(attemptId);
      setBundle(data);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onSave = async () => {
    try {
      setErr("");
      setOk("");
      setSaving(true);

      if (bundle?.attempt?.status !== "SCORED") {
        throw new Error("Пока кейс не завершён участником, оценка/комментарий недоступны.");
      }

      const raw = String(score ?? "").trim();
      const max = Number(bundle?.case?.maxScore ?? 100);

      let managerScore = null;
      if (raw !== "") {
        // поддержим ввод "10,5" → 10.5, но по факту ждём целое
        const normalized = raw.replace(",", ".");
        const n = Number(normalized);
        if (!Number.isFinite(n)) throw new Error("Оценка должна быть числом");
        if (n < 0 || n > max) throw new Error(`Оценка должна быть в диапазоне 0..${max}`);
        if (!Number.isInteger(n)) throw new Error("Оценка должна быть целым числом");
        managerScore = n;
      }

      await adminSetAttemptReview(attemptId, {
        managerComment: comment,
        managerScore
      });
      const data = await adminGetAttemptBundle(attemptId);
      setBundle(data);
      setComment(data?.attempt?.managerComment || "");
      setScore(typeof data?.attempt?.managerScore === "number" ? String(data.attempt.managerScore) : "");
      setOk("Сохранено");
    } catch (e) {
      setErr(String(e?.message || e));
      setOk("");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SiteShell>
        <div className="mutedSmall">Загрузка...</div>
      </SiteShell>
    );
  }

  if (!bundle) {
    return (
      <SiteShell>
        <div className="toastErr">{err || "Попытка не найдена"}</div>
        <Link className="btn btnPrimary" to="/admin/attempts">Назад</Link>
      </SiteShell>
    );
  }

  const { attempt, user, case: c } = bundle;
  const maxScore = Number(c?.maxScore ?? 100);
  const canReview = attempt?.status === "SCORED";
  const effectiveScore =
    typeof attempt?.managerScore === "number"
      ? attempt.managerScore
      : typeof attempt?.score === "number"
        ? attempt.score
        : null;

  return (
    <SiteShell>
      <div className="col" style={{ gap: 12 }}>
        <div className="rowBetween" style={{ flexWrap: "wrap" }}>
          <div className="col" style={{ gap: 6 }}>
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
        {ok ? (
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="cardInner mutedSmall">{ok}</div>
          </div>
        ) : null}

        <div className="grid2">
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Диалог</div>

              <div className="chatThread" style={{ height: 520 }}>
                {messages.length === 0 ? (
                  <div className="mutedSmall">Сообщений пока нет.</div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={m.role === "user" ? "msgRow msgRow--user" : "msgRow msgRow--assistant"}>
                      <div className={m.role === "user" ? "bubble bubble--user" : "bubble bubble--assistant"}>
                        <div className="bubbleText">{m.content}</div>
                        <div className="msgMeta">{roleLabel(m.role)}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="h2">Сообщение участнику</div>
              <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn btnPrimary" onClick={onSend}>Отправить</button>
            </div>
          </div>

          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                <div className="h2">Решение</div>
                <span className="chip chipMuted">
                  {attempt?.submittedAt ? `Сдано: ${attempt.submittedAt}` : "Не сдано"}
                </span>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardInner" style={{ whiteSpace: "pre-wrap", minHeight: 220 }}>
                  {attempt?.solution || "—"}
                </div>
              </div>

              <div className="h2">Оценка</div>

              <div className="grid2" style={{ justifyItems: "stretch" }}>
                <div className="card" style={{ boxShadow: "none" }}>
                  <div className="cardInner col" style={{ gap: 6 }}>
                    <div className="mutedSmall">Оценка модели</div>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>
                      {typeof attempt?.score === "number" ? `${attempt.score}/${maxScore}` : "—"}
                    </div>
                    <div className="mutedSmall">
                      Итоговая: {effectiveScore == null ? "—" : `${effectiveScore}/${maxScore}`}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ boxShadow: "none" }}>
                  <div className="cardInner col" style={{ gap: 6 }}>
                    <div className="mutedSmall">Статус</div>
                    <div className="mutedSmall">
                      {attempt?.status === "SCORED"
                        ? "Кейс завершён участником — можно корректировать оценку/комментарий."
                        : "Кейс ещё не завершён — администратор может только отвечать в чате."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h2" style={{ marginTop: 4 }}>Корректировка администратора</div>

              <label className="mutedSmall">Комментарий</label>
              <textarea
                className="textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!canReview}
                placeholder={!canReview ? "Доступно после завершения кейса участником." : ""}
              />

              <label className="mutedSmall">Оценка (0..{maxScore})</label>
              <input
                className="input"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                disabled={!canReview}
                placeholder={!canReview ? "Доступно после завершения кейса участником." : ""}
              />

              <button className="btn btnPrimary" onClick={onSave} disabled={saving || !canReview}>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}