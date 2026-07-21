import type { AchievementsInput, AchievementsView } from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function json<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    });
    if (!response.ok) return null;
    return response.status === 204 ? (null as T) : ((await response.json()) as T);
  } catch {
    return null;
  }
}

/** The current user's persisted achievements, or `null` for anon / off / on error. */
export function getAchievements(): Promise<AchievementsView | null> {
  return json<AchievementsView>('/me/achievements');
}

/** Create or replace the current user's achievements (idempotent upsert). Best-effort. */
export function saveAchievements(input: AchievementsInput): Promise<AchievementsView | null> {
  return json<AchievementsView>('/me/achievements', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
