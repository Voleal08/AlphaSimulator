export type Theme = "light" | "dark";
export type Role = "participant" | "admin";

export type CaseLevel = 1 | 2 | 3;

export type CaseStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "SCORED";

export type User = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type CaseItem = {
  id: string;
  title: string;
  level: CaseLevel;
  shortDescription: string;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
};

export type Attempt = {
  id: string;
  userId: string;
  caseId: string;
  status: CaseStatus;
  tokensSpent: number;
  startedAt?: string;
  submittedAt?: string;
  score?: number;
  feedback?: string;
  solution?: string;
};

export type ChatMessage = {
  id: string;
  attemptId: string;
  role: "user" | "assistant";
  content: string;
  tokens: number;
  createdAt: string;
};

export type DB = {
  version: 1;
  theme: Theme;

  users: User[];
  currentUserId: string | null;

  cases: CaseItem[];
  attempts: Attempt[];
  chat: ChatMessage[];
};