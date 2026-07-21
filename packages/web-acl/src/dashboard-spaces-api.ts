import type { DashboardSpacesInput, DashboardSpacesView } from '@TheY2T/tmr-api-client';

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

/** The current user's saved dashboard spaces, or `null` for anon / off / on error. */
export function getDashboardSpaces(): Promise<DashboardSpacesView | null> {
  return json<DashboardSpacesView>('/me/dashboard-spaces');
}

/** Create or replace the current user's dashboard spaces (idempotent upsert). */
export function saveDashboardSpaces(
  input: DashboardSpacesInput,
): Promise<DashboardSpacesView | null> {
  return json<DashboardSpacesView>('/me/dashboard-spaces', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
