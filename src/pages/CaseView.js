import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteShell from "../components/SiteShell";
import { useAppStore } from "../store/AppStore";

export default function CaseView() {
  const { caseId } = useParams();
  const nav = useNavigate();

  const {
    user,
    isManager,
    getCase,
    getCaseEvent,
    myEventAccess,
    getAttemptByCase,
    startAttempt,
    submitSolution
  } = useAppStore();

  const mgr = isManager();
  const c = getCase(caseId);
  const ev = getCaseEvent(caseId);

  const access = useMemo(() => {
    if (!user || !ev) return null;
    try {
      return myEventAccess(ev.id);
    } catch {
      return null;
    }
  }, [user, ev, myEventAccess]);

  const lockedForParticipant = !!ev && ev.visibility === "PRIVATE" && !mgr && access?.status !== "APPROVED";

  const attempt = useMemo(() => {
    if (mgr) return null;
    return getAttemptByCase(caseId);
  }, [mgr, getAttemptByCase, caseId]);

  const [solution, setSolution] = useState(attempt?.solution || "");
  const [err, setErr] = useState("");

  if (!c) {
    return (
      <SiteShell>
        <div className="toastErr">Кейс не найден</div>
        <Link className="btn" to="/">
          На главную
        </Link>
      </SiteShell>
    );
  }

  const levelLabel = c.level === 1 ? "Уровень 1" : c.level === 2 ? "Уровень 2" : "Уровень 3";

  const onStart = () => {
    setErr("");
    try {
      startAttempt(c.id);
      nav(`/cases/${c.id}/chat`);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  };

  const onSubmit = () => {
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
      <div className="col" style={{ gap: 12 }}>
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
                {ev?.visibility === "PRIVATE" ? <span className="chip chipRed">По заявке</span> : <span className="chip chipGood">Открыто</span>}
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
                <Link className="btn btnPrimary" to="/admin/attempts">
                  Перейти в проверку решений
                </Link>
              </div>
            ) : lockedForParticipant ? (
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="cardInner col" style={{ gap: 10 }}>
                  <div className="h2">Доступ по заявке</div>
                  <div className="mutedSmall">
                    Этот кейс находится в закрытом мероприятии. Подайте заявку на мероприятие — после одобрения сможете начать кейс.
                  </div>
                  <div className="row" style={{ flexWrap: "wrap" }}>
                    <Link className="btn btnPrimary" to={`/events/${ev.id}`}>
                      Перейти к мероприятию
                    </Link>
                    <Link className="btn" to="/events">
                      Все мероприятия
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                {!attempt ? (
                  <button className="btn btnPrimary" onClick={onStart}>
                    Начать кейс
                  </button>
                ) : (
                  <div className="row" style={{ flexWrap: "wrap" }}>
                    <Link className="btn btnPrimary" to={`/cases/${c.id}/chat`}>
                      Открыть диалог
                    </Link>
                    <span className="chip chipMuted">Токены: {attempt.tokensSpent || 0}</span>
                    <span className={`chip ${attempt.status === "SCORED" ? "chipGood" : "chipWarn"}`}>
                      {attempt.status === "SCORED" ? "Завершён" : "В работе"}
                    </span>
                    {attempt.score != null ? <span className="chip chipGood">Баллы: {attempt.score}</span> : null}
                  </div>
                )}

                <Link className="btn" to="/my-cases">
                  К списку
                </Link>
              </div>
            )}
          </div>
        </div>

        {!mgr && !lockedForParticipant && attempt?.status === "IN_PROGRESS" ? (
          <div className="card">
            <div className="cardInner col" style={{ gap: 10 }}>
              <div className="h2">Сдача решения</div>
              <div className="mutedSmall">Опишите план действий: кадровые, операционные, PR и финансовые меры.</div>
              <textarea className="textarea" value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Ваше решение..." />
              <div className="rowBetween" style={{ flexWrap: "wrap" }}>
                <button className="btn btnPrimary" onClick={onSubmit}>
                  Отправить решение
                </button>
                <div className="mutedSmall">После отправки кейс будет закрыт для повторного прохождения.</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SiteShell>
  );
}