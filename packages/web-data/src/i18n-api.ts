// Credentialed client wrappers for the localization CMS (ADR 0034). Types are declared locally (the
// generated api-client names them per-operation) so callers get a clean row shape.

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface UiMessageRow {
  id: string;
  locale: string;
  key: string;
  draftValue?: string;
  publishedValue?: string;
  status: string;
  seeded: boolean;
  deleted: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export interface UiMessageRevision {
  id: string;
  action: string;
  value?: string;
  editedBy?: string;
  editedAt: string;
}

export interface UiMessageListParams {
  search?: string;
  locale?: string;
  status?: string;
  includeDeleted?: boolean;
}

export interface LocaleInfo {
  code: string;
  label: string;
}

/** The locales the CMS knows about (public read; empty on error). */
export async function listLocales(): Promise<LocaleInfo[]> {
  try {
    const response = await fetch(`${API_BASE}/i18n/locales`);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as { items: LocaleInfo[] };
    return data.items;
  } catch {
    return [];
  }
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

function queryString(params: UiMessageListParams): string {
  const search = new URLSearchParams();
  if (params.search) search.set('search', params.search);
  if (params.locale) search.set('locale', params.locale);
  if (params.status) search.set('status', params.status);
  if (params.includeDeleted) search.set('includeDeleted', 'true');
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** Admin CMS for UI message strings. All calls are credentialed (RBAC-gated on the API). */
export const localeAdminApi = {
  list: (params: UiMessageListParams = {}) =>
    adminRequest<{ items: UiMessageRow[] }>(`/admin/i18n/messages${queryString(params)}`, {
      method: 'GET',
    }).then((r) => r.items),
  create: (body: { locale: string; key: string; value: string }) =>
    adminRequest<UiMessageRow>('/admin/i18n/messages', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, value: string) =>
    adminRequest<UiMessageRow>(`/admin/i18n/messages/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
  remove: (id: string) =>
    adminRequest<UiMessageRow>(`/admin/i18n/messages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  restore: (id: string) =>
    adminRequest<UiMessageRow>(`/admin/i18n/messages/${encodeURIComponent(id)}/restore`, {
      method: 'POST',
    }),
  revisions: (id: string) =>
    adminRequest<{ items: UiMessageRevision[] }>(
      `/admin/i18n/messages/${encodeURIComponent(id)}/revisions`,
      { method: 'GET' },
    ).then((r) => r.items),
  restoreRevision: (id: string, revisionId: string) =>
    adminRequest<UiMessageRow>(
      `/admin/i18n/messages/${encodeURIComponent(id)}/revisions/${encodeURIComponent(revisionId)}/restore`,
      { method: 'POST' },
    ),
  publish: (locale?: string) =>
    adminRequest<{ versions: Record<string, string> }>('/admin/i18n/publish', {
      method: 'POST',
      body: JSON.stringify(locale ? { locale } : {}),
    }).then((r) => r.versions),
  createLocale: (body: { code: string; label: string }) =>
    adminRequest<LocaleInfo>('/admin/i18n/locales', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  importStrings: (body: { locale: string; label?: string; entries: Record<string, string> }) =>
    adminRequest<{ imported: number }>('/admin/i18n/import', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.imported),
};
