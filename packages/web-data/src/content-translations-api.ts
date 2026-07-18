// Credentialed client wrappers for content translations (ADR 0034 Phase 2) — the admin surface that
// translates catalogue / collection / help *content* fields (over `entity_translations`).

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type TranslatableEntityType = 'content' | 'collection' | 'help';

export interface EntityTranslationRow {
  id: string;
  entityType: string;
  entityId: string;
  locale: string;
  field: string;
  draftValue?: string;
  publishedValue?: string;
  status: string;
  deleted: boolean;
  updatedAt: string;
  updatedBy?: string;
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

/** The translatable text fields per entity type (matches the read-path overlay). */
export const TRANSLATABLE_FIELDS: Record<TranslatableEntityType, string[]> = {
  content: ['title', 'summary', 'bodyMdx'],
  collection: ['title', 'summary', 'bodyMdx', 'curatorBio'],
  help: ['term', 'body'],
};

const LIST_PATH: Record<TranslatableEntityType, string> = {
  // Catalogue search paginates (default 20); pull the max page for the picker (clamped to 100 server-side).
  content: '/catalogue/items?pageSize=100',
  collection: '/collections',
  help: '/help-topics',
};
const DETAIL_PATH: Record<TranslatableEntityType, (slug: string) => string> = {
  content: (slug) => `/catalogue/items/${encodeURIComponent(slug)}`,
  collection: (slug) => `/collections/${encodeURIComponent(slug)}`,
  help: (slug) => `/help-topics/${encodeURIComponent(slug)}`,
};

export interface TranslationTargetSummary {
  slug: string;
  title: string;
}

export interface TranslationTarget {
  entityType: TranslatableEntityType;
  entityId: string;
  slug: string;
  title: string;
  /** field → base (English) value, for the fields that are translatable. */
  fields: Record<string, string>;
}

/** Browse translatable entities of one type (base title + slug). Empty on error. */
export async function listTranslationTargets(
  entityType: TranslatableEntityType,
): Promise<TranslationTargetSummary[]> {
  try {
    const response = await fetch(`${API_BASE}${LIST_PATH[entityType]}`);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as {
      items: { slug: string; title?: string; term?: string }[];
    };
    return data.items.map((i) => ({ slug: i.slug, title: i.title ?? i.term ?? i.slug }));
  } catch {
    return [];
  }
}

/** Load one entity's id + base translatable field values (for the editor). */
export async function getTranslationTarget(
  entityType: TranslatableEntityType,
  slug: string,
): Promise<TranslationTarget | null> {
  const response = await fetch(`${API_BASE}${DETAIL_PATH[entityType](slug)}`);
  if (!response.ok) {
    return null;
  }
  const detail = (await response.json()) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  for (const field of TRANSLATABLE_FIELDS[entityType]) {
    const value = detail[field];
    fields[field] = typeof value === 'string' ? value : '';
  }
  return {
    entityType,
    entityId: String(detail.id ?? ''),
    slug,
    title: String(detail.title ?? detail.term ?? slug),
    fields,
  };
}

/** Admin CMS for per-locale content translations (RBAC-gated on the API). */
export const contentTranslationApi = {
  list: (entityType: string, entityId: string) =>
    adminRequest<{ items: EntityTranslationRow[] }>(
      `/admin/translations?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&includeDeleted=true`,
      { method: 'GET' },
    ).then((r) => r.items),
  upsert: (body: {
    entityType: string;
    entityId: string;
    locale: string;
    field: string;
    value: string;
  }) =>
    adminRequest<EntityTranslationRow>('/admin/translations', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    adminRequest<EntityTranslationRow>(`/admin/translations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  restore: (id: string) =>
    adminRequest<EntityTranslationRow>(`/admin/translations/${encodeURIComponent(id)}/restore`, {
      method: 'POST',
    }),
  publish: (entityType: string, entityId: string) =>
    adminRequest<{ published: number }>('/admin/translations/publish', {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId }),
    }).then((r) => r.published),
};
