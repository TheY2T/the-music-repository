import type {
  CollectionDetail,
  CollectionItemInput,
  CollectionList,
  CollectionSectionInput,
  CollectionWriteInput,
  ContentAdminList,
  ContentDetail,
  ContentRevisionList,
  ContentWriteInput,
  MediaUploadRequest,
  MediaUploadTicket,
  TaxonomyRef,
} from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/** Credentialed JSON fetch against the CMS API. Throws a readable message on non-2xx (problem+json). */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const problem = (await response.json()) as { detail?: string; title?: string };
      message = problem.detail ?? problem.title ?? message;
    } catch {
      // non-JSON body — keep the status line
    }
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const adminApi = {
  list: () => request<ContentAdminList>('/content'),
  get: (slug: string) => request<ContentDetail>(`/content/${encodeURIComponent(slug)}`),
  create: (body: ContentWriteInput) =>
    request<ContentDetail>('/content', { method: 'POST', body: JSON.stringify(body) }),
  update: (slug: string, body: ContentWriteInput) =>
    request<ContentDetail>(`/content/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  publish: (slug: string) =>
    request<ContentDetail>(`/content/${encodeURIComponent(slug)}/publish`, { method: 'POST' }),
  unpublish: (slug: string) =>
    request<ContentDetail>(`/content/${encodeURIComponent(slug)}/unpublish`, { method: 'POST' }),
  setStatus: (slug: string, status: 'draft' | 'review' | 'published') =>
    request<ContentDetail>(`/content/${encodeURIComponent(slug)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  remove: (slug: string) =>
    request<void>(`/content/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  requestMedia: (slug: string, body: MediaUploadRequest) =>
    request<MediaUploadTicket>(`/content/${encodeURIComponent(slug)}/media`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listTaxonomy: (dimension: string) => request<{ items: TaxonomyRef[] }>(`/taxonomy/${dimension}`),
  setScore: (slug: string, tex: string) =>
    request<ContentDetail>(`/content/${encodeURIComponent(slug)}/score`, {
      method: 'PUT',
      body: JSON.stringify({ tex }),
    }),
  listRevisions: (slug: string) =>
    request<ContentRevisionList>(`/content/${encodeURIComponent(slug)}/revisions`),
  restoreRevision: (slug: string, revisionId: string) =>
    request<ContentDetail>(
      `/content/${encodeURIComponent(slug)}/revisions/${encodeURIComponent(revisionId)}/restore`,
      { method: 'POST' },
    ),
};

/** Admin CMS for collections (Phase 2). */
export const collectionsAdminApi = {
  list: () => request<CollectionList>('/admin/collections'),
  get: (slug: string) =>
    request<CollectionDetail>(`/admin/collections/${encodeURIComponent(slug)}`),
  create: (body: CollectionWriteInput) =>
    request<CollectionDetail>('/admin/collections', { method: 'POST', body: JSON.stringify(body) }),
  update: (slug: string, body: CollectionWriteInput) =>
    request<CollectionDetail>(`/admin/collections/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  setItems: (slug: string, items: CollectionItemInput[]) =>
    request<CollectionDetail>(`/admin/collections/${encodeURIComponent(slug)}/items`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    }),
  setSections: (slug: string, sections: CollectionSectionInput[]) =>
    request<CollectionDetail>(`/admin/collections/${encodeURIComponent(slug)}/sections`, {
      method: 'PUT',
      body: JSON.stringify({ sections }),
    }),
  publish: (slug: string) =>
    request<CollectionDetail>(`/admin/collections/${encodeURIComponent(slug)}/publish`, {
      method: 'POST',
    }),
  unpublish: (slug: string) =>
    request<CollectionDetail>(`/admin/collections/${encodeURIComponent(slug)}/unpublish`, {
      method: 'POST',
    }),
  remove: (slug: string) =>
    request<void>(`/admin/collections/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
};

/** Upload bytes to a presigned PUT URL (direct browser → object storage). */
export async function uploadToTicket(ticket: MediaUploadTicket, file: File): Promise<void> {
  const response = await fetch(ticket.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }
}
