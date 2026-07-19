import type { FaqEntry, FaqEntryWriteInput } from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/** All FAQ entries (public), ordered by category then sort order. Empty on error so the page degrades
 *  quietly. `locale` overlays published question/answer translations (ADR 0034); omit/`en` for base. */
export async function listFaqEntries(locale?: string): Promise<FaqEntry[]> {
  try {
    const query = locale && locale !== 'en' ? `?locale=${encodeURIComponent(locale)}` : '';
    const response = await fetch(`${API_BASE}/faq-entries${query}`);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as { items: FaqEntry[] };
    return data.items;
  } catch {
    return [];
  }
}

export async function getFaqEntry(slug: string): Promise<FaqEntry | null> {
  const response = await fetch(`${API_BASE}/faq-entries/${encodeURIComponent(slug)}`);
  return response.ok ? ((await response.json()) as FaqEntry) : null;
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

/** Admin CMS for FAQ entries. */
export const faqAdminApi = {
  create: (body: FaqEntryWriteInput) =>
    adminRequest<FaqEntry>('/admin/faq-entries', { method: 'POST', body: JSON.stringify(body) }),
  update: (slug: string, body: FaqEntryWriteInput) =>
    adminRequest<FaqEntry>(`/admin/faq-entries/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  remove: (slug: string) =>
    adminRequest<void>(`/admin/faq-entries/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
};
