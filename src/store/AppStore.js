import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { id } from "../lib/id";
import { estimateTokens } from "../lib/token";
import { mockLLMReply } from "../lib/mockLLM";
import { loadDB, saveDB, nowISO } from "../lib/storage";

const Ctx = createContext(null);

function hashPassword(pw) {
  const s = String(pw || "");
  let h = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return "h_" + h.toString(16);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function isManager(user) {
  return !!user && (user.role === "admin" || user.role === "bank_staff");
}

function sortByTitle(a, b) {
  return String(a.title || "").localeCompare(String(b.title || ""));
}

function getAccess(db, userId, eventId) {
  return db.eventAccess.find((x) => x.userId === userId && x.eventId === eventId) || null;
}

function canAccessEvent(db, user, event) {
  if (!event) return false;
  if (isManager(user)) return true; // manager bypass
  if (event.visibility === "PUBLIC") return true;
  if (!user) return false;
  const a = getAccess(db, user.id, event.id);
  return a?.status === "APPROVED";
}

function migrateDB(d) {
  const src = d && typeof d === "object" ? d : {};
  const prevVersion = Number(src.version || 0);

  const db = { ...src };

  if (!db.version) db.version = 2;
  if (!db.theme) db.theme = "light";

  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.events)) db.events = [];
  if (!Array.isArray(db.cases)) db.cases = [];
  if (!Array.isArray(db.eventAccess)) db.eventAccess = [];
  if (!Array.isArray(db.attempts)) db.attempts = [];
  if (!Array.isArray(db.chat)) db.chat = [];
  if (typeof db.currentUserId === "undefined") db.currentUserId = null;

  db.users = db.users.map((u) => ({
    ...u,
    role: u.role || "participant",
    profile: u.profile || {
      fullName: "",
      age: 0,
      educationLevel: "",
      city: "",
      university: "",
      major: "",
      skills: ""
    },
    avatarDataUrl: u.avatarDataUrl || "",
    passwordHash: u.passwordHash || ""
  }));

  // manager review fields (на будущее, чтобы не ломало)
  db.attempts = db.attempts.map((a) => ({
    ...a,
    managerComment: a.managerComment || "",
    managerScore: typeof a.managerScore === "number" ? a.managerScore : null,
    managerReviewedAt: a.managerReviewedAt || ""
  }));

  // ✅ one-time migration to v5: убрать "публичные кейсы" из PRIVATE мероприятий
  if (prevVersion < 5) {
    const eventById = Object.fromEntries(db.events.map((e) => [e.id, e]));

    db.cases = db.cases.map((c) => {
      const ev = eventById[c.eventId];
      if (ev?.visibility === "PRIVATE" && c.isPublic) return { ...c, isPublic: false };
      return c;
    });

    // (не обязательно, но полезно) если в демо кто-то случайно сделал ev_public PRIVATE — вернём обратно
    db.events = db.events.map((e) => {
      if (e.id === "ev_public") return { ...e, visibility: "PUBLIC" };
      return e;
    });

    db.version = 5;
  }

  const admin = db.users.find((u) => u.email === "admin@local");
  if (admin) {
    admin.role = "admin";
    if (!admin.passwordHash) admin.passwordHash = hashPassword("admin123");
  }

  return db;
}

export function AppStoreProvider({ children }) {
  const [db, setDB] = useState(() => {
    const next = migrateDB(loadDB());
    try {
      document.documentElement.setAttribute("data-theme", next.theme || "light");
    } catch (_) {}
    return next;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", db.theme || "light");
    saveDB(db);
  }, [db]);

  const user = useMemo(() => {
    if (!db.currentUserId) return null;
    return db.users.find((u) => u.id === db.currentUserId) || null;
  }, [db.currentUserId, db.users]);

  const api = useMemo(() => {
    return {
      db,
      user,
      isManager: () => isManager(user),

      // theme
      theme: db.theme,
      setTheme: (t) => setDB((prev) => ({ ...prev, theme: t })),
      toggleTheme: () => setDB((prev) => ({ ...prev, theme: prev.theme === "light" ? "dark" : "light" })),

      // ---------- AUTH ----------
      login: (email, password) => {
        const e = (email || "").trim().toLowerCase();
        const p = String(password || "");
        if (!e) throw new Error("Введите email");
        if (!p) throw new Error("Введите пароль");

        const u = db.users.find((x) => x.email === e) || null;
        if (!u) throw new Error("Неверный email или пароль");

        const hp = hashPassword(p);

        // dev-migration for old users
        if (!u.passwordHash) {
          const dev = hashPassword("pass1234");
          if (hp !== dev) throw new Error("Неверный email или пароль");
          setDB((prev) => ({
            ...prev,
            users: prev.users.map((uu) => (uu.id === u.id ? { ...uu, passwordHash: dev } : uu)),
            currentUserId: u.id
          }));
          return;
        }

        if (u.passwordHash !== hp) throw new Error("Неверный email или пароль");
        setDB((prev) => ({ ...prev, currentUserId: u.id }));
      },

      register: (payload) => {
        const email = (payload.email || "").trim().toLowerCase();
        const password = String(payload.password || "");
        const role = payload.role || "participant";

        if (!["participant", "bank_staff", "admin"].includes(role)) throw new Error("Некорректная роль");

        const fullName = (payload.profile?.fullName || "").trim();
        const age = Number(payload.profile?.age || 0);
        const educationLevel = (payload.profile?.educationLevel || "").trim();
        const city = (payload.profile?.city || "").trim();

        if (!email) throw new Error("Email обязателен");
        if (db.users.some((u) => u.email === email)) throw new Error("Email занят");
        if (!password || password.length < 6) throw new Error("Пароль: минимум 6 символов");
        if (!fullName) throw new Error("Имя пользователя обязательно");

        if (role === "participant") {
          if (!Number.isFinite(age) || age < 9 || age > 120) throw new Error("Возраст некорректен");
          if (!educationLevel) throw new Error("Образование обязательно");
          if (!city) throw new Error("Город обязателен");
        }

        const newUser = {
          id: id("u"),
          email,
          role,
          createdAt: nowISO(),
          passwordHash: hashPassword(password),
          profile: {
            fullName,
            age: role === "participant" ? age : Number.isFinite(age) ? age : 0,
            educationLevel: role === "participant" ? educationLevel : educationLevel || "",
            city: role === "participant" ? city : city || "",
            university: payload.profile?.university || "",
            major: payload.profile?.major || "",
            skills: payload.profile?.skills || ""
          },
          avatarDataUrl: payload.avatarDataUrl || ""
        };

        setDB((prev) => ({ ...prev, users: [...prev.users, newUser], currentUserId: newUser.id }));
      },

      logout: () => setDB((prev) => ({ ...prev, currentUserId: null })),

      updateMyProfile: (patch) => {
        if (!user) throw new Error("Нужно войти");
        setDB((prev) => ({
          ...prev,
          users: prev.users.map((u) => {
            if (u.id !== user.id) return u;
            return {
              ...u,
              profile: { ...(u.profile || {}), ...(patch.profile || {}) },
              avatarDataUrl: patch.avatarDataUrl !== undefined ? patch.avatarDataUrl : u.avatarDataUrl
            };
          })
        }));
      },

      // ---------- EVENTS ----------
      listEvents: () => db.events.slice().sort(sortByTitle),

      getEvent: (eventId) => db.events.find((e) => e.id === eventId) || null,

      myEventAccess: (eventId) => {
        if (!user) return null;
        return getAccess(db, user.id, eventId);
      },

      listMyApplications: () => {
        if (!user || isManager(user)) return [];
        const mapEvent = Object.fromEntries(db.events.map((e) => [e.id, e]));
        return db.eventAccess
          .filter((a) => a.userId === user.id)
          .map((a) => ({ ...a, eventTitle: mapEvent[a.eventId]?.title || "" }))
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      },

      applyToEvent: (eventId) => {
        if (!user) throw new Error("Нужно войти");
        if (isManager(user)) return;

        const event = db.events.find((e) => e.id === eventId);
        if (!event) throw new Error("Не найдено");
        if (event.visibility === "PUBLIC") return;

        const existing = getAccess(db, user.id, eventId);
        if (existing && existing.status === "PENDING") throw new Error("Уже отправлено");
        if (existing && existing.status === "APPROVED") throw new Error("Уже есть доступ");

        const access = {
          id: id("acc"),
          userId: user.id,
          eventId,
          status: "PENDING",
          createdAt: nowISO(),
          decidedAt: ""
        };

        setDB((prev) => ({
          ...prev,
          eventAccess: [
            ...prev.eventAccess.filter((x) => !(x.userId === user.id && x.eventId === eventId)),
            access
          ]
        }));
      },

      // manager notifications
      adminListApplications: () => {
        if (!isManager(user)) throw new Error("Нет прав");
        const userById = Object.fromEntries(db.users.map((u) => [u.id, u]));
        const eventById = Object.fromEntries(db.events.map((e) => [e.id, e]));

        return db.eventAccess
          .filter((a) => a.status === "PENDING")
          .map((a) => ({
            ...a,
            userEmail: userById[a.userId]?.email || "",
            userName: userById[a.userId]?.profile?.fullName || "",
            eventTitle: eventById[a.eventId]?.title || ""
          }))
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      },

      adminDecideApplication: (accessId, decision) => {
        if (!isManager(user)) throw new Error("Нет прав");
        if (!["APPROVED", "REJECTED"].includes(decision)) throw new Error("Некорректно");

        setDB((prev) => ({
          ...prev,
          eventAccess: prev.eventAccess.map((a) =>
            a.id === accessId ? { ...a, status: decision, decidedAt: nowISO() } : a
          )
        }));
      },

      // manager CRUD
      adminCreateEvent: (data) => {
        if (!isManager(user)) throw new Error("Нет прав");
        const title = (data.title || "").trim();
        if (!title) throw new Error("Название обязательно");

        const ev = {
          id: id("ev"),
          title,
          description: data.description || "",
          visibility: data.visibility || "PUBLIC",
          isActive: true,
          createdAt: nowISO(),
          updatedAt: nowISO()
        };

        setDB((prev) => ({ ...prev, events: [...prev.events, ev] }));
        return ev;
      },

      adminUpdateEvent: (eventId, patch) => {
        if (!isManager(user)) throw new Error("Нет прав");

        setDB((prev) => {
          const nextEvents = prev.events.map((e) => (e.id === eventId ? { ...e, ...patch, updatedAt: nowISO() } : e));
          const updated = nextEvents.find((e) => e.id === eventId);

          let nextCases = prev.cases;
          if (updated?.visibility === "PRIVATE") {
            nextCases = prev.cases.map((c) => (c.eventId === eventId ? { ...c, isPublic: false } : c));
          }

          return { ...prev, events: nextEvents, cases: nextCases };
        });
      },

      // ---------- CASES ----------
      // ✅ Открытые кейсы = isPublic И event PUBLIC
      listPublicCases: () => {
        return db.cases
          .filter((c) => c.isPublic)
          .map((c) => ({ ...c, event: db.events.find((e) => e.id === c.eventId) || null }))
          .filter((x) => x.event && x.event.visibility === "PUBLIC")
          .sort((a, b) => (a.level - b.level) || a.title.localeCompare(b.title));
      },

      // ✅ PRIVATE event без APPROVED: кейсы вообще не возвращаем
      // ✅ для менеджера не подмешиваем status/score (чтобы нигде не было “в работе/баллы” у админа)
      listCasesForEvent: (eventId) => {
        const event = db.events.find((e) => e.id === eventId) || null;
        const accessOk = canAccessEvent(db, user, event);

        if (event?.visibility === "PRIVATE" && !isManager(user) && !accessOk) return [];

        return db.cases
          .filter((c) => c.eventId === eventId)
          .slice()
          .sort((a, b) => (a.level - b.level) || a.title.localeCompare(b.title))
          .map((c) => {
            if (isManager(user)) return { ...c, locked: false, status: undefined, score: null };

            const attempt = user ? (db.attempts.find((a) => a.userId === user.id && a.caseId === c.id) || null) : null;
            return { ...c, status: attempt?.status || "NOT_STARTED", locked: false, score: attempt?.score ?? null };
          });
      },

      // ✅ прямой доступ к кейсу PRIVATE без APPROVED запрещён
      getCase: (caseId) => {
        const c = db.cases.find((x) => x.id === caseId) || null;
        if (!c) return null;
        const ev = db.events.find((e) => e.id === c.eventId) || null;
        if (ev?.visibility === "PRIVATE" && !isManager(user) && !canAccessEvent(db, user, ev)) return null;
        return c;
      },

      getCaseEvent: (caseId) => {
        const c = db.cases.find((x) => x.id === caseId);
        if (!c) return null;
        return db.events.find((e) => e.id === c.eventId) || null;
      },

      adminAddCase: (data) => {
        if (!isManager(user)) throw new Error("Нет прав");
        const title = (data.title || "").trim();
        const shortDescription = (data.shortDescription || "").trim();
        if (!title) throw new Error("Название обязательно");
        if (!shortDescription) throw new Error("Текст обязателен");

        const ev = db.events.find((e) => e.id === data.eventId) || null;
        const safeIsPublic = ev?.visibility === "PRIVATE" ? false : !!data.isPublic;

        const c = {
          id: id("case"),
          eventId: data.eventId,
          title,
          level: Number(data.level) || 1,
          shortDescription,
          maxScore: Number(data.maxScore) || 100,
          isPublic: safeIsPublic,
          createdAt: nowISO(),
          updatedAt: nowISO()
        };

        setDB((prev) => ({ ...prev, cases: [...prev.cases, c] }));
        return c;
      },

      adminUpdateCase: (caseId, patch) => {
        if (!isManager(user)) throw new Error("Нет прав");

        const cur = db.cases.find((x) => x.id === caseId) || null;
        const nextEventId = patch.eventId ?? cur?.eventId;
        const ev = db.events.find((e) => e.id === nextEventId) || null;

        const nextPatch = { ...patch };
        if (typeof nextPatch.isPublic !== "undefined" && ev?.visibility === "PRIVATE") {
          nextPatch.isPublic = false;
        }

        setDB((prev) => ({
          ...prev,
          cases: prev.cases.map((c) => (c.id === caseId ? { ...c, ...nextPatch, updatedAt: nowISO() } : c))
        }));
      },

      adminDeleteCase: (caseId) => {
        if (!isManager(user)) throw new Error("Нет прав");
        setDB((prev) => {
          const attemptIds = new Set(prev.attempts.filter((a) => a.caseId === caseId).map((a) => a.id));
          return {
            ...prev,
            cases: prev.cases.filter((c) => c.id !== caseId),
            attempts: prev.attempts.filter((a) => a.caseId !== caseId),
            chat: prev.chat.filter((m) => !attemptIds.has(m.attemptId))
          };
        });
      },

      // ---------- PARTICIPANT ONLY ----------
      getAttemptByCase: (caseId) => {
        if (!user || isManager(user)) return null;
        return db.attempts.find((a) => a.userId === user.id && a.caseId === caseId) || null;
      },

      startAttempt: (caseId) => {
        if (!user) throw new Error("Нужно войти");
        if (isManager(user)) throw new Error("Администратор не решает кейсы");

        const c = db.cases.find((x) => x.id === caseId);
        if (!c) throw new Error("Не найдено");

        const event = db.events.find((e) => e.id === c.eventId);
        if (!event) throw new Error("Не найдено");

        if (!canAccessEvent(db, user, event)) throw new Error("Нет доступа");

        const existing = db.attempts.find((a) => a.userId === user.id && a.caseId === caseId) || null;
        if (existing && existing.status === "SCORED") throw new Error("Кейс можно решить только один раз.");

        if (!existing) {
          const newAttempt = {
            id: id("att"),
            userId: user.id,
            caseId,
            status: "IN_PROGRESS",
            tokensSpent: 0,
            startedAt: nowISO(),
            submittedAt: "",
            score: null,
            solution: ""
          };
          setDB((prev) => ({ ...prev, attempts: [...prev.attempts, newAttempt] }));
          return newAttempt;
        }

        const updated = { ...existing, status: "IN_PROGRESS" };
        setDB((prev) => ({ ...prev, attempts: prev.attempts.map((a) => (a.id === existing.id ? updated : a)) }));
        return updated;
      },

      getChat: (attemptId) => db.chat.filter((m) => m.attemptId === attemptId),

      sendChat: (attemptId, message) => {
        if (!user) throw new Error("Нужно войти");
        if (isManager(user)) throw new Error("Администратор не ведёт диалог");

        const text = (message || "").trim();
        if (!text) throw new Error("—");

        const attempt = db.attempts.find((a) => a.id === attemptId && a.userId === user.id) || null;
        if (!attempt) throw new Error("—");
        if (attempt.status === "SCORED") throw new Error("—");

        const userTokens = estimateTokens(text);
        const reply = mockLLMReply(text);
        const assistantTokens = estimateTokens(reply);
        const delta = userTokens + assistantTokens;

        const userMsg = { id: id("m"), attemptId, role: "user", content: text, tokens: userTokens, createdAt: nowISO() };
        const asstMsg = { id: id("m"), attemptId, role: "assistant", content: reply, tokens: assistantTokens, createdAt: nowISO() };

        setDB((prev) => ({
          ...prev,
          chat: [...prev.chat, userMsg, asstMsg],
          attempts: prev.attempts.map((a) => (a.id === attemptId ? { ...a, tokensSpent: (a.tokensSpent || 0) + delta } : a))
        }));
      },

      submitSolution: (attemptId, solution) => {
        if (!user) throw new Error("Нужно войти");
        if (isManager(user)) throw new Error("Администратор не сдаёт решения");

        const sol = (solution || "").trim();
        if (!sol) throw new Error("—");

        const attempt = db.attempts.find((a) => a.id === attemptId && a.userId === user.id) || null;
        if (!attempt) throw new Error("—");
        if (attempt.status === "SCORED") throw new Error("—");

        const c = db.cases.find((x) => x.id === attempt.caseId);
        if (!c) throw new Error("—");

        const base = Math.floor(Math.sqrt(sol.length) * 6 + c.level * 12);
        const tokenPenalty = Math.floor((attempt.tokensSpent || 0) / 120);
        const score = clamp(base - tokenPenalty, 0, c.maxScore);

        const updated = { ...attempt, status: "SCORED", submittedAt: nowISO(), score, solution: sol };
        setDB((prev) => ({ ...prev, attempts: prev.attempts.map((a) => (a.id === attemptId ? updated : a)) }));
      },

      // ---------- MANAGER REVIEW (как было) ----------
      adminListAttemptsForEvent: (eventId) => {
        if (!isManager(user)) throw new Error("Нет прав");

        const eventCases = db.cases.filter((c) => c.eventId === eventId);
        const caseIds = new Set(eventCases.map((c) => c.id));
        const caseById = Object.fromEntries(eventCases.map((c) => [c.id, c]));
        const userById = Object.fromEntries(db.users.map((u) => [u.id, u]));

        return db.attempts
          .filter((a) => caseIds.has(a.caseId))
          .slice()
          .sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")))
          .map((a) => ({
            ...a,
            caseTitle: caseById[a.caseId]?.title || "",
            userEmail: userById[a.userId]?.email || "",
            userName: userById[a.userId]?.profile?.fullName || ""
          }));
      },

      adminGetAttemptBundle: (attemptId) => {
        if (!isManager(user)) throw new Error("Нет прав");
        const a = db.attempts.find((x) => x.id === attemptId) || null;
        if (!a) throw new Error("Не найдено");

        const u = db.users.find((x) => x.id === a.userId) || null;
        const c = db.cases.find((x) => x.id === a.caseId) || null;

        const chat = db.chat
          .filter((m) => m.attemptId === attemptId)
          .slice()
          .sort((x, y) => String(x.createdAt).localeCompare(String(y.createdAt)));

        return { attempt: a, user: u, case: c, chat };
      },

      // ---------- LEADERBOARD ----------
      leaderboard: () => {
        const map = {};
        for (const u of db.users) {
          map[u.id] = {
            userId: u.id,
            email: u.email,
            name: u.profile?.fullName || "",
            totalScore: 0,
            solved: 0
          };
        }
        for (const a of db.attempts) {
          if (a.status !== "SCORED") continue;
          const row = map[a.userId];
          if (!row) continue;
          row.totalScore += a.score || 0;
          row.solved += 1;
        }
        return Object.values(map)
          .filter((r) => r.solved > 0)
          .sort((x, y) => y.totalScore - x.totalScore);
      }
    };
  }, [db, user]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppStore must be used within AppStoreProvider");
  return v;
}