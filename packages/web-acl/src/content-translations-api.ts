// Credentialed client wrappers for content translations (ADR 0034 Phase 2) — the admin surface that
// translates catalogue / collection / help *content* fields (over `entity_translations`).

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type TranslatableEntityType = 'content' | 'collection' | 'help' | 'faq';

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

/** How a localizable field is edited: single-line, multi-line plain, or WYSIWYG rich markdown. */
export type FieldKind = 'plain' | 'multiline' | 'rich';

/** One localizable field: its overlay key + how it renders. */
export interface LocalizableFieldSpec {
  field: string;
  kind: FieldKind;
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

/**
 * The statically-known localizable fields per entity type (overlay keys + render kind). Collections
 * also carry *dynamic* fields (per-section / per-outcome / per-item) derived from a loaded entity —
 * see {@link dynamicLocalizableFields}. Keys match the read-path overlay (`applyContentOverlay` /
 * `applyCollectionOverlay`): `details.<fact>`, `section.<id>.title|description`, `outcome.<i>`,
 * `item.<slug>.curatorNote`.
 */
export const LOCALIZABLE_FIELDS: Record<TranslatableEntityType, LocalizableFieldSpec[]> = {
  content: [
    { field: 'title', kind: 'plain' },
    { field: 'summary', kind: 'multiline' },
    { field: 'bodyMdx', kind: 'rich' },
    { field: 'details.key', kind: 'plain' },
    { field: 'details.era', kind: 'plain' },
    { field: 'details.form', kind: 'plain' },
    { field: 'details.timeSignature', kind: 'plain' },
    { field: 'details.composer', kind: 'plain' },
    { field: 'details.composerDates', kind: 'plain' },
    { field: 'details.composedYear', kind: 'plain' },
  ],
  collection: [
    { field: 'title', kind: 'plain' },
    { field: 'summary', kind: 'multiline' },
    { field: 'bodyMdx', kind: 'rich' },
    { field: 'curatorBio', kind: 'multiline' },
  ],
  help: [
    { field: 'term', kind: 'plain' },
    { field: 'body', kind: 'rich' },
  ],
  faq: [
    { field: 'question', kind: 'plain' },
    { field: 'answer', kind: 'rich' },
  ],
};

/** Flat list of translatable field names per entity type (the server-facing view). */
export const TRANSLATABLE_FIELDS: Record<TranslatableEntityType, string[]> = {
  content: LOCALIZABLE_FIELDS.content.map((f) => f.field),
  collection: LOCALIZABLE_FIELDS.collection.map((f) => f.field),
  help: LOCALIZABLE_FIELDS.help.map((f) => f.field),
  faq: LOCALIZABLE_FIELDS.faq.map((f) => f.field),
};

/** The block-editor profile matching how each entity type authors its body (see the entity forms). */
export const EDITOR_PROFILE: Record<TranslatableEntityType, 'full' | 'minimal' | 'collection'> = {
  content: 'full',
  collection: 'collection',
  help: 'minimal',
  faq: 'minimal',
};

const LIST_PATH: Record<TranslatableEntityType, string> = {
  // Catalogue search paginates (default 20); pull the max page for the picker (clamped to 100 server-side).
  content: '/catalogue/items?pageSize=100',
  collection: '/collections',
  help: '/help-topics',
  faq: '/faq-entries',
};
const DETAIL_PATH: Record<TranslatableEntityType, (slug: string) => string> = {
  content: (slug) => `/catalogue/items/${encodeURIComponent(slug)}`,
  collection: (slug) => `/collections/${encodeURIComponent(slug)}`,
  help: (slug) => `/help-topics/${encodeURIComponent(slug)}`,
  faq: (slug) => `/faq-entries/${encodeURIComponent(slug)}`,
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
  /** Every localizable field (static + entity-derived dynamic), in display order. */
  specs: LocalizableFieldSpec[];
  /** field → base (English) value, for every field in `specs`. */
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
      items: { slug: string; title?: string; term?: string; question?: string }[];
    };
    return data.items.map((i) => ({
      slug: i.slug,
      title: i.title ?? i.term ?? i.question ?? i.slug,
    }));
  } catch {
    return [];
  }
}

type Json = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

/**
 * The localizable fields that only exist once an entity is loaded: a collection's sections, learning
 * outcomes, and per-item curator notes. Content/help have none. Keys mirror the read-path overlay.
 */
export function dynamicLocalizableFields(
  entityType: TranslatableEntityType,
  detail: Json,
): LocalizableFieldSpec[] {
  if (entityType !== 'collection') {
    return [];
  }
  const specs: LocalizableFieldSpec[] = [];
  const sections = Array.isArray(detail.sections) ? (detail.sections as Json[]) : [];
  for (const section of sections) {
    const id = asString(section.id);
    if (!id) {
      continue;
    }
    specs.push({ field: `section.${id}.title`, kind: 'plain' });
    specs.push({ field: `section.${id}.description`, kind: 'multiline' });
  }
  const outcomes = Array.isArray(detail.outcomes) ? (detail.outcomes as unknown[]) : [];
  for (let i = 0; i < outcomes.length; i++) {
    specs.push({ field: `outcome.${i}`, kind: 'plain' });
  }
  const items = Array.isArray(detail.items) ? (detail.items as Json[]) : [];
  for (const item of items) {
    const slug = asString((item.content as Json | undefined)?.slug);
    if (slug && asString(item.curatorNote)) {
      specs.push({ field: `item.${slug}.curatorNote`, kind: 'multiline' });
    }
  }
  return specs;
}

/** Resolve a field's base (English) value from a loaded detail, walking dotted/keyed paths. */
function resolveField(detail: Json, field: string): string {
  if (!field.includes('.')) {
    return asString(detail[field]);
  }
  const parts = field.split('.');
  const head = parts[0];
  if (head === 'details') {
    const details = (detail.details ?? {}) as Json;
    return asString(details[parts.slice(1).join('.')]);
  }
  if (head === 'outcome') {
    const outcomes = Array.isArray(detail.outcomes) ? (detail.outcomes as unknown[]) : [];
    return asString(outcomes[Number(parts[1])]);
  }
  if (head === 'section') {
    const id = parts[1];
    const prop = parts[2];
    const sections = Array.isArray(detail.sections) ? (detail.sections as Json[]) : [];
    const section = sections.find((s) => asString(s.id) === id);
    return section ? asString(section[prop]) : '';
  }
  if (head === 'item') {
    const slug = parts.slice(1, -1).join('.');
    const items = Array.isArray(detail.items) ? (detail.items as Json[]) : [];
    const item = items.find((it) => asString((it.content as Json | undefined)?.slug) === slug);
    return item ? asString(item.curatorNote) : '';
  }
  return '';
}

/** Load one entity's id + every localizable field's base value (static + dynamic) for the editor. */
export async function getTranslationTarget(
  entityType: TranslatableEntityType,
  slug: string,
): Promise<TranslationTarget | null> {
  const response = await fetch(`${API_BASE}${DETAIL_PATH[entityType](slug)}`);
  if (!response.ok) {
    return null;
  }
  const detail = (await response.json()) as Json;
  const specs = [
    ...LOCALIZABLE_FIELDS[entityType],
    ...dynamicLocalizableFields(entityType, detail),
  ];
  const fields: Record<string, string> = {};
  for (const spec of specs) {
    fields[spec.field] = resolveField(detail, spec.field);
  }
  return {
    entityType,
    entityId: asString(detail.id),
    slug,
    title: asString(detail.title) || asString(detail.term) || asString(detail.question) || slug,
    specs,
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
  /** Publish pending drafts for an entity; scope to one `locale` for independent per-locale publish. */
  publish: (entityType: string, entityId: string, locale?: string) =>
    adminRequest<{ published: number }>('/admin/translations/publish', {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, locale }),
    }).then((r) => r.published),
};
