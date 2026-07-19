// Credentialed client wrappers for the feature-flag admin CMS (ADR 0035). Types are declared locally so
// callers get a clean row shape (the generated api-client names them per-operation). All admin calls are
// credentialed; the API re-authorizes every mutation (RBAC: `featureFlags` resource, admin-only writes).

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type FlagValue = boolean | string | number | Record<string, unknown> | unknown[];
export type TargetingRule = Record<string, unknown> | null;

export interface FlagSettingRow {
  environmentId: string;
  environmentKey: string;
  enabled: boolean;
  defaultVariant: string;
  variants: Record<string, FlagValue>;
  targeting: TargetingRule;
}

export interface FlagAdminRow {
  id: string;
  key: string;
  description: string;
  domain: string;
  flagType: string;
  defaultValue: FlagValue;
  source: string; // code | runtime
  seeded: boolean;
  deleted: boolean;
  updatedAt: string;
  updatedBy?: string;
  settings: FlagSettingRow[];
}

export interface FlagEnvironmentRow {
  id: string;
  key: string;
  label: string;
  rank: number;
  isDefault: boolean;
  archived: boolean;
  deleted: boolean;
  updatedAt: string;
}

export interface FlagRevisionRow {
  id: string;
  flagId?: string;
  flagKey?: string;
  environmentId?: string;
  environmentKey?: string;
  action: string;
  before?: unknown;
  after?: unknown;
  actorId?: string;
  createdAt: string;
}

export interface FlagListParams {
  search?: string;
  domain?: string;
  includeDeleted?: boolean;
}

export interface FlagSettingWrite {
  enabled?: boolean;
  defaultVariant?: string;
  variants?: Record<string, FlagValue>;
  targeting?: TargetingRule;
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

function flagQuery(params: FlagListParams): string {
  const search = new URLSearchParams();
  if (params.search) search.set('search', params.search);
  if (params.domain) search.set('domain', params.domain);
  if (params.includeDeleted) search.set('includeDeleted', 'true');
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** Admin CMS for feature flags. All calls are credentialed (RBAC-gated on the API). */
export const featureFlagAdminApi = {
  listFlags: (params: FlagListParams = {}) =>
    adminRequest<{ items: FlagAdminRow[] }>(`/admin/feature-flags/flags${flagQuery(params)}`, {
      method: 'GET',
    }).then((r) => r.items),
  createFlag: (body: { key: string; description?: string; defaultValue?: boolean }) =>
    adminRequest<FlagAdminRow>('/admin/feature-flags/flags', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateFlag: (id: string, body: { description?: string; defaultValue?: boolean }) =>
    adminRequest<FlagAdminRow>(`/admin/feature-flags/flags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteFlag: (id: string) =>
    adminRequest<FlagAdminRow>(`/admin/feature-flags/flags/${id}`, { method: 'DELETE' }),
  restoreFlag: (id: string) =>
    adminRequest<FlagAdminRow>(`/admin/feature-flags/flags/${id}/restore`, { method: 'POST' }),
  upsertSetting: (flagId: string, envId: string, body: FlagSettingWrite) =>
    adminRequest<FlagAdminRow>(`/admin/feature-flags/flags/${flagId}/settings/${envId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  listRevisions: (flagId?: string) =>
    adminRequest<{ items: FlagRevisionRow[] }>(
      flagId ? `/admin/feature-flags/flags/${flagId}/revisions` : '/admin/feature-flags/revisions',
      { method: 'GET' },
    ).then((r) => r.items),
  importFlags: (entries: Record<string, unknown>) =>
    adminRequest<{ imported: number }>('/admin/feature-flags/import', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }).then((r) => r.imported),
  listEnvironments: (includeInactive = false) =>
    adminRequest<{ items: FlagEnvironmentRow[] }>(
      `/admin/feature-flags/environments${includeInactive ? '?includeInactive=true' : ''}`,
      { method: 'GET' },
    ).then((r) => r.items),
  createEnvironment: (body: { key: string; label: string; rank?: number; isDefault?: boolean }) =>
    adminRequest<FlagEnvironmentRow>('/admin/feature-flags/environments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateEnvironment: (
    id: string,
    body: { label?: string; rank?: number; isDefault?: boolean; archived?: boolean },
  ) =>
    adminRequest<FlagEnvironmentRow>(`/admin/feature-flags/environments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteEnvironment: (id: string) =>
    adminRequest<FlagEnvironmentRow>(`/admin/feature-flags/environments/${id}`, {
      method: 'DELETE',
    }),
};
