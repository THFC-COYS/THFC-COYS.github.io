import { DietaryProfile, MenuAnalysis, ScanHistoryItem } from './types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  analyze: (imageBase64: string, userId: string, mediaType = 'image/jpeg') =>
    request<MenuAnalysis>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64, user_id: userId, media_type: mediaType }),
    }),

  getProfile: (userId: string) =>
    request<DietaryProfile>(`/api/users/${userId}/profile`),

  updateProfile: (userId: string, profile: DietaryProfile) =>
    request<{ success: boolean }>(`/api/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId, ...profile }),
    }),

  getHistory: (userId: string) =>
    request<{ scans: ScanHistoryItem[] }>(`/api/users/${userId}/history`),

  getScan: (scanId: string) =>
    request<MenuAnalysis>(`/api/scans/${scanId}`),
};
