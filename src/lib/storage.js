export const LS_KEY = "finmath_sim_db_v2";

export function nowISO() {
  return new Date().toISOString();
}

export function defaultDB() {
  const e1 = {
    id: "ev_public",
    title: "Открытый трек",
    description: "",
    visibility: "PUBLIC",
    isActive: true,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  const e2 = {
    id: "ev_private",
    title: "День открытых дверей",
    description: "",
    visibility: "PRIVATE",
    isActive: true,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  const cases = [
    {
      id: "case_pub_1",
      eventId: e1.id,
      title: "Открытый кейс",
      level: 1,
      shortDescription: "—",
      maxScore: 100,
      isPublic: true,
      createdAt: nowISO(),
      updatedAt: nowISO()
    },
    {
      id: "case_priv_1",
      eventId: e2.id,
      title: "Кейс (по заявке)",
      level: 2,
      shortDescription: "—",
      maxScore: 100,
      isPublic: false,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
  ];

  return {
    version: 2,
    theme: "light",

    users: [
      {
        id: "u_admin",
        email: "admin@local",
        role: "admin",
        createdAt: nowISO(),
        passwordHash: "", // будет проставлен в store
        profile: {
          fullName: "Администратор",
          age: 22,
          educationLevel: "other",
          city: "Москва",
          university: "",
          major: "",
          skills: ""
        },
        avatarDataUrl: ""
      }
    ],
    currentUserId: null,

    events: [e1, e2],
    cases,

    eventAccess: [],
    attempts: [],
    chat: []
  };
}

export function loadDB() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return defaultDB();
  try {
    return JSON.parse(raw);
  } catch {
    return defaultDB();
  }
}

export function saveDB(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}