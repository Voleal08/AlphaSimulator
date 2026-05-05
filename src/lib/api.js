const TOKEN_KEY = "finmath_api_token";
const USER_KEY = "finmath_api_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getToken();

  let res;
  try {
    res = await fetch(path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (e) {
    const err = new Error("Failed to fetch");
    err.status = 0;
    throw err;
  }

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

/* =========================
   AUTH
   ========================= */
export async function apiLogin(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: { email, password }
  });
  if (data?.token) setToken(data.token);
  if (data?.user) setCachedUser(data.user);
  return data;
}

export async function apiRegister(payload) {
  const data = await request("/auth/register", {
    method: "POST",
    body: payload
  });
  if (data?.token) setToken(data.token);
  if (data?.user) setCachedUser(data.user);
  return data;
}

export async function apiMe() {
  const me = await request("/me");
  setCachedUser(me);
  return me;
}

export async function apiMeBundle() {
  const data = await request("/me/bundle");
  if (data?.user) setCachedUser(data.user);
  return data;
}

export async function apiUpdateMe(payload) {
  const me = await request("/me", {
    method: "PATCH",
    body: payload
  });
  setCachedUser(me);
  return me;
}

/* =========================
   EVENTS / CASES
   ========================= */
export async function apiListEvents() {
  return request("/events");
}

export async function apiGetEvent(eventId) {
  return request(`/events/${eventId}`);
}

export async function apiListPublicCases() {
  return request("/cases/public");
}

export async function apiListCasesForEvent(eventId) {
  return request(`/events/${eventId}/cases`);
}

export async function apiGetCase(caseId) {
  return request(`/cases/${caseId}`);
}

export async function apiApplyToEvent(eventId) {
  return request(`/events/${eventId}/apply`, {
    method: "POST"
  });
}

/* =========================
   ATTEMPTS / CHAT
   ========================= */
export async function apiGetAttemptByCase(caseId) {
  return request(`/cases/${caseId}/attempt`);
}

export async function apiStartAttempt(caseId) {
  return request(`/cases/${caseId}/start`, {
    method: "POST"
  });
}

export async function apiGetChat(attemptId) {
  return request(`/attempts/${attemptId}/chat`);
}

export async function apiSendChat(attemptId, message) {
  return request(`/attempts/${attemptId}/chat`, {
    method: "POST",
    body: { message }
  });
}

export async function apiSubmitSolution(attemptId, solution) {
  return request(`/attempts/${attemptId}/submit`, {
    method: "POST",
    body: { solution }
  });
}

/* =========================
   ADMIN
   ========================= */
export async function apiAdminUsers() {
  return request("/admin/users");
}

export async function apiAdminUser(userId) {
  return request(`/admin/users/${userId}`);
}

export async function apiAdminSetUserRole(userId, role) {
  return request(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: { role }
  });
}

export async function apiAdminCreateEvent(payload) {
  return request("/admin/events", {
    method: "POST",
    body: payload
  });
}

export async function apiAdminUpdateEvent(eventId, patch) {
  return request(`/admin/events/${eventId}`, {
    method: "PATCH",
    body: patch
  });
}

export async function apiAdminCreateCase(payload) {
  return request("/admin/cases", {
    method: "POST",
    body: payload
  });
}

export async function apiAdminUpdateCase(caseId, patch) {
  return request(`/admin/cases/${caseId}`, {
    method: "PATCH",
    body: patch
  });
}

export async function apiAdminDeleteCase(caseId) {
  return request(`/admin/cases/${caseId}`, {
    method: "DELETE"
  });
}

export async function apiAdminAttempts() {
  return request("/admin/attempts");
}

export async function apiAdminAttempt(attemptId) {
  return request(`/admin/attempts/${attemptId}`);
}

export async function apiAdminSendChat(attemptId, message) {
  return request(`/admin/attempts/${attemptId}/chat`, {
    method: "POST",
    body: { message }
  });
}

export async function apiAdminReviewAttempt(attemptId, payload) {
  return request(`/admin/attempts/${attemptId}/review`, {
    method: "PATCH",
    body: payload
  });
}

/* =========================
   LEADERBOARD / ANALYTICS
   ========================= */
export async function apiLeaderboard() {
  return request("/leaderboard");
}

export async function apiLeaderboardByEvent(eventId) {
  const id = String(eventId || "").trim();
  if (!id) return apiLeaderboard();
  return request(`/leaderboard?eventId=${encodeURIComponent(id)}`);
}

export async function apiAnalytics() {
  return request("/admin/analytics");
}