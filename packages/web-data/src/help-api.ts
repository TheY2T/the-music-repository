import type { HelpTopic, HelpTopicWriteInput } from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/** All help topics (public). Empty on error so the Info View degrades quietly. `locale` overlays
 *  published term/body translations (ADR 0034); omit/`en` for the base language. */
export async function listHelpTopics(locale?: string): Promise<HelpTopic[]> {
  try {
    const query = locale && locale !== 'en' ? `?locale=${encodeURIComponent(locale)}` : '';
    const response = await fetch(`${API_BASE}/help-topics${query}`);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as { items: HelpTopic[] };
    return data.items;
  } catch {
    return [];
  }
}

export async function getHelpTopic(slug: string): Promise<HelpTopic | null> {
  const response = await fetch(`${API_BASE}/help-topics/${encodeURIComponent(slug)}`);
  return response.ok ? ((await response.json()) as HelpTopic) : null;
}

async function adminRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const problem = (await response.json()) as { detail?: string; title?: string };
      message = problem.detail ?? problem.title ?? message;
    } catch {
      // keep the status line
    }
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

/** Admin CMS for help topics. */
export const helpAdminApi = {
  create: (body: HelpTopicWriteInput) =>
    adminRequest<HelpTopic>('/admin/help-topics', { method: 'POST', body: JSON.stringify(body) }),
  update: (slug: string, body: HelpTopicWriteInput) =>
    adminRequest<HelpTopic>(`/admin/help-topics/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  remove: (slug: string) =>
    adminRequest<void>(`/admin/help-topics/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
};
