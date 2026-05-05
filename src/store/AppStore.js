import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  apiLogin,
  apiRegister,
  apiMe,
  apiMeBundle,
  apiUpdateMe,
  apiListEvents,
  apiListPublicCases,
  apiListCasesForEvent,
  apiGetCase,
  apiApplyToEvent,
  apiGetAttemptByCase,
  apiStartAttempt,
  apiGetChat,
  apiSendChat,
  apiSubmitSolution,
  apiAdminUsers,
  apiAdminUser,
  apiAdminSetUserRole,
  apiAdminCreateEvent,
  apiAdminUpdateEvent,
  apiAdminCreateCase,
  apiAdminUpdateCase,
  apiAdminDeleteCase,
  apiAdminAttempts,
  apiAdminAttempt,
  apiAdminSendChat,
  apiAdminReviewAttempt,
  apiLeaderboard,
  apiLeaderboardByEvent,
  apiAnalytics,
  getCachedUser,
  clearAuth
} from "../lib/api";

const Ctx = createContext(null);

function sortByTitle(a, b) {
  return String(a.title || "").localeCompare(String(b.title || ""));
}

function mergeById(listA = [], listB = []) {
  const map = new Map();
  for (const x of [...listA, ...listB]) {
    if (x && x.id) map.set(x.id, x);
  }
  return Array.from(map.values());
}

export function AppStoreProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("finmath_theme") || "light");
  const [user, setUser] = useState(() => getCachedUser());

  const [db, setDB] = useState({
    users: [],
    events: [],
    cases: [],
    eventAccess: [],
    attempts: [],
    chat: []
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme || "light");
    localStorage.setItem("finmath_theme", theme || "light");
  }, [theme]);

  /* =========================
     STABLE REFRESHERS
     ========================= */

  const refreshEvents = useCallback(async () => {
    const events = await apiListEvents();
    setDB((prev) => ({
      ...prev,
      events: Array.isArray(events) ? events.slice().sort(sortByTitle) : []
    }));
    return events;
  }, []);

  const refreshPublicCases = useCallback(async () => {
    try {
      const cases = await apiListPublicCases();
      setDB((prev) => ({
        ...prev,
        cases: mergeById(prev.cases, Array.isArray(cases) ? cases : [])
      }));
      return cases;
    } catch (e) {
      // если бэк требует auth, не роняем всё приложение
      if (e?.status === 401 || e?.status === 403) return [];
      throw e;
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const users = await apiAdminUsers();
      setDB((prev) => ({
        ...prev,
        users: Array.isArray(users) ? users : []
      }));
      return users;
    } catch (e) {
      if (e?.status === 401 || e?.status === 403) return [];
      throw e;
    }
  }, []);

  /* =========================
     ONE-TIME BOOTSTRAP
     ========================= */

  const bootstrap = useCallback(async () => {
    // сначала грузим публичные данные
    try { await refreshEvents(); } catch (_) {}
    try { await refreshPublicCases(); } catch (_) {}

    // потом пробуем восстановить пользователя по токену
    try {
      const bundle = await apiMeBundle();
      const me = bundle?.user ? bundle.user : await apiMe();
      setUser(me || null);

      // поднимаем личные данные для "кабинета" (прогресс/изоляция)
      if (bundle && me?.role === "participant") {
        setDB((prev) => ({
          ...prev,
          eventAccess: Array.isArray(bundle.eventAccess) ? bundle.eventAccess : prev.eventAccess,
          attempts: Array.isArray(bundle.attempts) ? bundle.attempts : prev.attempts
        }));
      }

      if (me?.role === "admin") {
        try { await refreshUsers(); } catch (_) {}
      }
    } catch (e) {
      // важно: только auth errors чистят пользователя
      if (e?.status === 401 || e?.status === 403) {
        clearAuth();
        setUser(null);
      }
    }
  }, [refreshEvents, refreshPublicCases, refreshUsers]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  /* =========================
     API FOR PAGES
     ========================= */

  const api = useMemo(() => {
    return {
      db,
      user,

      isManager: () => !!user && user.role === "admin",

      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),

      refreshAll: bootstrap,
      refreshEvents,
      refreshPublicCases,
      refreshUsers,

      /* AUTH */
      login: async (email, password) => {
        const data = await apiLogin(email, password);
        setUser(data.user || null);

        // не ломаем логин, даже если что-то ещё не подгрузилось
        try { await refreshEvents(); } catch (_) {}
        try { await refreshPublicCases(); } catch (_) {}
        if (data.user?.role === "participant") {
          try {
            const bundle = await apiMeBundle();
            setDB((prev) => ({
              ...prev,
              eventAccess: Array.isArray(bundle?.eventAccess) ? bundle.eventAccess : prev.eventAccess,
              attempts: Array.isArray(bundle?.attempts) ? bundle.attempts : prev.attempts
            }));
          } catch (_) {}
        }
        if (data.user?.role === "admin") {
          try { await refreshUsers(); } catch (_) {}
        }

        return data.user;
      },

      register: async (payload) => {
        const data = await apiRegister(payload);
        setUser(data.user || null);

        try { await refreshEvents(); } catch (_) {}
        try { await refreshPublicCases(); } catch (_) {}
        if (data.user?.role === "participant") {
          try {
            const bundle = await apiMeBundle();
            setDB((prev) => ({
              ...prev,
              eventAccess: Array.isArray(bundle?.eventAccess) ? bundle.eventAccess : prev.eventAccess,
              attempts: Array.isArray(bundle?.attempts) ? bundle.attempts : prev.attempts
            }));
          } catch (_) {}
        }

        return data.user;
      },

      logout: async () => {
        clearAuth();
        setUser(null);
        setDB({
          users: [],
          events: [],
          cases: [],
          eventAccess: [],
          attempts: [],
          chat: []
        });

        try { await refreshEvents(); } catch (_) {}
        try { await refreshPublicCases(); } catch (_) {}
      },

      updateMyProfile: async (patch) => {
        const me = await apiUpdateMe(patch);
        setUser(me);
        setDB((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === me.id ? me : u))
        }));
        return me;
      },

      selfBecomeParticipant: async () => {
        if (!user || user.role !== "admin") throw new Error("Недоступно");
        const updated = await apiAdminSetUserRole(user.id, "participant");
        setUser(updated);
        setDB((prev) => ({
          ...prev,
          users: mergeById(prev.users, [updated])
        }));
        return updated;
      },

      selfRequestAdmin: async () => {
        throw new Error("Назначить администратора может только действующий администратор");
      },

      /* EVENTS */
      listEvents: () => db.events.slice().sort(sortByTitle),

      getEvent: (eventId) => db.events.find((e) => e.id === eventId) || null,

      myEventAccess: (eventId) => {
        return db.eventAccess.find((a) => a.eventId === eventId && a.userId === user?.id) || null;
      },

      listMyApplications: () => {
        return db.eventAccess
          .filter((a) => a.userId === user?.id)
          .map((a) => ({
            ...a,
            eventTitle: db.events.find((e) => e.id === a.eventId)?.title || ""
          }));
      },

      applyToEvent: async (eventId) => {
        const access = await apiApplyToEvent(eventId);
        setDB((prev) => ({
          ...prev,
          eventAccess: mergeById(prev.eventAccess, [access])
        }));
        return access;
      },

      adminListApplications: () => {
        if (!user || user.role !== "admin") throw new Error("Нет прав");

        const userById = Object.fromEntries((db.users || []).map((u) => [u.id, u]));
        const eventById = Object.fromEntries((db.events || []).map((e) => [e.id, e]));

        return (db.eventAccess || [])
          .filter((a) => a.status === "PENDING")
          .map((a) => ({
            ...a,
            userEmail: userById[a.userId]?.email || "",
            userName: userById[a.userId]?.profile?.fullName || "",
            eventTitle: eventById[a.eventId]?.title || ""
          }));
      },

      adminDecideApplication: async (accessId, decision) => {
        setDB((prev) => ({
          ...prev,
          eventAccess: prev.eventAccess.map((a) =>
            a.id === accessId ? { ...a, status: decision, decidedAt: new Date().toISOString() } : a
          )
        }));
        return true;
      },

      /* CASES */
      listPublicCases: () => {
        return db.cases
          .filter((c) => c.event?.visibility === "PUBLIC")
          .slice()
          .sort((a, b) => (a.level - b.level) || String(a.title || "").localeCompare(String(b.title || "")));
      },

      listCasesForEvent: async (eventId) => {
        const rows = await apiListCasesForEvent(eventId);
        const event = db.events.find((e) => e.id === eventId) || null;
        const normalized = (Array.isArray(rows) ? rows : []).map((x) => ({ ...x, eventId, event }));

        setDB((prev) => ({
          ...prev,
          cases: mergeById(prev.cases, normalized)
        }));

        return normalized;
      },

      getCase: async (caseId) => {
        const cached = db.cases.find((c) => c.id === caseId);
        if (cached) return cached;

        const c = await apiGetCase(caseId);
        setDB((prev) => ({
          ...prev,
          cases: mergeById(prev.cases, [c])
        }));
        return c;
      },

      getCaseSync: (caseId) => db.cases.find((c) => c.id === caseId) || null,

      getCaseEvent: (caseId) => {
        const c = db.cases.find((x) => x.id === caseId);
        if (!c) return null;
        return db.events.find((e) => e.id === c.eventId) || c.event || null;
      },

      adminAddCase: async (payload) => {
        const c = await apiAdminCreateCase(payload);
        setDB((prev) => ({ ...prev, cases: mergeById(prev.cases, [c]) }));
        return c;
      },

      adminUpdateCase: async (caseId, patch) => {
        const c = await apiAdminUpdateCase(caseId, patch);
        setDB((prev) => ({ ...prev, cases: mergeById(prev.cases, [c]) }));
        return c;
      },

      adminDeleteCase: async (caseId) => {
        await apiAdminDeleteCase(caseId);
        setDB((prev) => ({
          ...prev,
          cases: prev.cases.filter((c) => c.id !== caseId),
          attempts: prev.attempts.filter((a) => a.caseId !== caseId),
          chat: prev.chat.filter((m) => m.caseId !== caseId)
        }));
      },

      /* ATTEMPTS / CHAT */
      getAttemptByCase: async (caseId) => {
        const a = await apiGetAttemptByCase(caseId);
        if (a) {
          setDB((prev) => ({ ...prev, attempts: mergeById(prev.attempts, [a]) }));
        }
        return a;
      },

      getAttemptByCaseSync: (caseId) => {
        return db.attempts.find((a) => a.caseId === caseId && a.userId === user?.id) || null;
      },

      startAttempt: async (caseId) => {
        const a = await apiStartAttempt(caseId);
        setDB((prev) => ({ ...prev, attempts: mergeById(prev.attempts, [a]) }));
        return a;
      },

      getChat: async (attemptId) => {
        const rows = await apiGetChat(attemptId);
        setDB((prev) => ({
          ...prev,
          chat: [
            ...prev.chat.filter((m) => m.attemptId !== attemptId),
            ...(Array.isArray(rows) ? rows : [])
          ]
        }));
        return rows;
      },

      getChatSync: (attemptId) => {
        return db.chat
          .filter((m) => m.attemptId === attemptId)
          .slice()
          .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
      },

      sendChat: async (attemptId, message) => {
        const data = await apiSendChat(attemptId, message);
        const rows = data.messages || [];
        const attempt = data.attempt || null;

        setDB((prev) => ({
          ...prev,
          chat: mergeById(prev.chat, rows),
          attempts: attempt ? mergeById(prev.attempts, [attempt]) : prev.attempts
        }));

        return data;
      },

      submitSolution: async (attemptId, solution) => {
        const a = await apiSubmitSolution(attemptId, solution);
        setDB((prev) => ({ ...prev, attempts: mergeById(prev.attempts, [a]) }));
        return a;
      },

      /* ADMIN USERS */
      adminUsers: async () => {
        // если пользователи уже загружены в память, не дёргаем лишний раз бэкенд
        if (Array.isArray(db.users) && db.users.length > 0) {
          return db.users;
        }

        const users = await apiAdminUsers();
        const safeUsers = Array.isArray(users) ? users : [];

        setDB((prev) => ({ ...prev, users: safeUsers }));
        return safeUsers;
      },

      adminGetUser: async (userId) => {
        const cached = db.users.find((u) => u.id === userId);
        if (cached) return cached;

        const u = await apiAdminUser(userId);
        setDB((prev) => ({ ...prev, users: mergeById(prev.users, [u]) }));
        return u;
      },

      adminSetUserRole: async (userId, role) => {
        const u = await apiAdminSetUserRole(userId, role);
        setDB((prev) => ({ ...prev, users: mergeById(prev.users, [u]) }));
        return u;
      },

      /* ADMIN EVENTS / ATTEMPTS */
      adminCreateEvent: async (payload) => {
        const ev = await apiAdminCreateEvent(payload);
        setDB((prev) => ({ ...prev, events: mergeById(prev.events, [ev]) }));
        return ev;
      },

      adminUpdateEvent: async (eventId, patch) => {
        const ev = await apiAdminUpdateEvent(eventId, patch);
        setDB((prev) => ({ ...prev, events: mergeById(prev.events, [ev]) }));
        return ev;
      },

      adminListAttempts: async () => {
        // попытки пока не кэшируем в db, но не блокируем UI при повторных заходах
        return apiAdminAttempts();
      },

      adminListAttemptsForEvent: async (eventId) => {
        const rows = await apiAdminAttempts();
        const evTitle = db.events.find((e) => e.id === eventId)?.title;
        return (Array.isArray(rows) ? rows : []).filter((x) => x.eventTitle === evTitle);
      },

      adminGetAttemptBundle: async (attemptId) => {
        return apiAdminAttempt(attemptId);
      },

      adminSendChat: async (attemptId, message) => {
        return apiAdminSendChat(attemptId, message);
      },

      adminSetAttemptReview: async (attemptId, payload) => {
        return apiAdminReviewAttempt(attemptId, payload);
      },

      /* LEADERBOARD / ANALYTICS */
      leaderboard: async () => {
        // рейтинг обычно маленький (топ-20), отдельного кэша достаточно на уровне страницы
        return apiLeaderboard();
      },

      leaderboardByEvent: async (eventId) => {
        return apiLeaderboardByEvent(eventId);
      },

      adminAnalytics: async () => {
        // админская аналитика дергается только по запросу, кэш нужен на уровне страницы
        return apiAnalytics();
      }
    };
  }, [db, user, theme, refreshEvents, refreshPublicCases, refreshUsers, bootstrap]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppStore must be used within AppStoreProvider");
  return v;
}