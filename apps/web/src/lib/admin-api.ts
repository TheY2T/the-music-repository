import type {
  ContentAdminList,
  ContentDetail,
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
  remove: (slug: string) =>
    request<void>(`/content/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  requestMedia: (slug: string, body: MediaUploadRequest) =>
    request<MediaUploadTicket>(`/content/${encodeURIComponent(slug)}/media`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listTaxonomy: (dimension: string) => request<{ items: TaxonomyRef[] }>(`/taxonomy/${dimension}`),
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
