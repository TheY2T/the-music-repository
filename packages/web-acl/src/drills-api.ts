import type {
  DrillAttempt,
  DrillAttemptResult,
  DrillStatsSummary,
  SkillMastery,
} from '@TheY2T/tmr-api-client';

const EMPTY_STATS: DrillStatsSummary = {
  skills: [],
  streakDays: 0,
  attemptsToday: 0,
};

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as T;
}

/** Record an objectively-graded drill attempt; returns the SM-2 state + celebration signals. */
export function recordDrillAttempt(attempt: DrillAttempt): Promise<DrillAttemptResult | null> {
  return request<DrillAttemptResult>('/me/drills/attempts', {
    method: 'POST',
    body: JSON.stringify(attempt),
  });
}

export async function getDrillStats(): Promise<DrillStatsSummary> {
  return (await request<DrillStatsSummary>('/me/drills/stats')) ?? EMPTY_STATS;
}

export function getDeckMastery(deck: string): Promise<SkillMastery | null> {
  return request<SkillMastery>(`/me/drills/stats/${encodeURIComponent(deck)}`);
}
