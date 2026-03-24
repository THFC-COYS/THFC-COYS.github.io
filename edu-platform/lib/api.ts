/**
 * SAGE API client — connects to the education-backend FastAPI server.
 */

import type {
  User, TutoringSession, Quiz, QuizResult,
  ProgressEntry, ProgressInsights, Curriculum,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Users ──────────────────────────────────────────────────────────────────

export const createUser = (body: {
  name: string; email: string; grade_level: string;
  role?: string; subjects?: string[];
}) => request<User>('/api/users', { method: 'POST', body: JSON.stringify(body) });

export const getUser = (userId: string) =>
  request<User>(`/api/users/${userId}`);

// ── Sessions ───────────────────────────────────────────────────────────────

export const startSession = (body: {
  user_id: string; subject: string; grade_level: string; topic?: string;
}) => request<TutoringSession>('/api/sessions', { method: 'POST', body: JSON.stringify(body) });

export const sendMessage = (sessionId: string, body: { content: string; user_id: string }) =>
  request<{ message: { role: string; content: string }; xp_earned: number }>(
    `/api/sessions/${sessionId}/message`,
    { method: 'POST', body: JSON.stringify(body) },
  );

export const getSession = (sessionId: string) =>
  request<TutoringSession>(`/api/sessions/${sessionId}`);

export const listSessions = (userId: string) =>
  request<TutoringSession[]>(`/api/users/${userId}/sessions`);

// ── Quizzes ────────────────────────────────────────────────────────────────

export const createQuiz = (body: {
  user_id: string; subject: string; topic: string;
  grade_level: string; num_questions?: number;
  question_types?: string[];
}) => request<Quiz>('/api/quizzes', { method: 'POST', body: JSON.stringify(body) });

export const getQuiz = (quizId: string) => request<Quiz>(`/api/quizzes/${quizId}`);

export const submitQuiz = (quizId: string, body: {
  user_id: string; answers: string[]; time_taken_seconds: number;
}) => request<QuizResult>(`/api/quizzes/${quizId}/submit`, {
  method: 'POST', body: JSON.stringify(body),
});

// ── Progress ───────────────────────────────────────────────────────────────

export const getProgress = (userId: string) =>
  request<{ user: User; progress: ProgressEntry[]; total_subjects: number; avg_mastery: number }>(
    `/api/users/${userId}/progress`,
  );

export const getInsights = (userId: string) =>
  request<ProgressInsights>(`/api/users/${userId}/insights`);

// ── Curriculum ─────────────────────────────────────────────────────────────

export const createCurriculum = (body: {
  creator_id: string; title: string; subject: string; grade_level: string;
  duration_weeks: number; objectives: string[]; context?: string; is_public?: boolean;
}) => request<Curriculum>('/api/curricula', { method: 'POST', body: JSON.stringify(body) });

export const listCurricula = (subject?: string, grade_level?: string) => {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (grade_level) params.set('grade_level', grade_level);
  return request<Curriculum[]>(`/api/curricula?${params}`);
};

// ── WebSocket Tutor ────────────────────────────────────────────────────────

const WS_BASE = BASE_URL.replace(/^http/, 'ws');

export type TutorSocketMessage =
  | { type: 'token'; content: string }
  | { type: 'done'; xp_earned: number }
  | { type: 'error'; content: string };

export function createTutorSocket(
  sessionId: string,
  onMessage: (msg: TutorSocketMessage) => void,
  onClose?: () => void,
): { send: (content: string, userId: string) => void; close: () => void } {
  const ws = new WebSocket(`${WS_BASE}/ws/tutor/${sessionId}`);

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data) as TutorSocketMessage;
      onMessage(msg);
    } catch {
      /* ignore malformed */
    }
  };

  ws.onclose = () => onClose?.();

  return {
    send: (content: string, userId: string) =>
      ws.send(JSON.stringify({ content, user_id: userId })),
    close: () => ws.close(),
  };
}
