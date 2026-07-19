import type { ProgressSummary } from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function json<T>(path: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    return null;
  }
  return response.status === 204 ? (null as T) : ((await response.json()) as T);
}

export function getProgress(): Promise<ProgressSummary | null> {
  return json<ProgressSummary>('/me/progress');
}

export async function markComplete(slug: string): Promise<void> {
  await json(`/me/progress/${encodeURIComponent(slug)}`, { method: 'POST' });
}

export async function markIncomplete(slug: string): Promise<void> {
  await json(`/me/progress/${encodeURIComponent(slug)}`, { method: 'DELETE' });
}

export function logPractice(
  minutes: number,
  contentSlug?: string,
): Promise<ProgressSummary | null> {
  return json<ProgressSummary>('/me/practice', {
    method: 'POST',
    body: JSON.stringify({ minutes, contentSlug }),
  });
}
