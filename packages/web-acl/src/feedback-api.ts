import type {
  FeedbackBoardItem,
  FeedbackBoardList,
  FeedbackSubmission,
  FeedbackSubmissionList,
  NpsAnalytics,
  NpsResponseInput,
  NpsResponseList,
  NpsSubmitResult,
  SubmitFeedbackInput,
  UpdateFeedbackInput,
} from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/** Fetch with the session cookie, returning JSON (or undefined for 204) and surfacing problem+json. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// --- User-facing ---

export function submitFeedback(body: SubmitFeedbackInput): Promise<FeedbackSubmission> {
  return request<FeedbackSubmission>('/feedback', { method: 'POST', body: JSON.stringify(body) });
}

export interface BoardQuery {
  sort?: 'top' | 'new';
  page?: number;
  pageSize?: number;
}

export function fetchBoard(options: BoardQuery = {}): Promise<FeedbackBoardList> {
  return request<FeedbackBoardList>(`/feedback/board${query({ ...options })}`);
}

export function voteFeedback(id: string): Promise<FeedbackBoardItem> {
  return request<FeedbackBoardItem>(`/feedback/${encodeURIComponent(id)}/vote`, { method: 'POST' });
}

export function unvoteFeedback(id: string): Promise<FeedbackBoardItem> {
  return request<FeedbackBoardItem>(`/feedback/${encodeURIComponent(id)}/vote`, {
    method: 'DELETE',
  });
}

export async function npsEligibility(): Promise<boolean> {
  const result = await request<{ eligible: boolean }>('/feedback/nps/eligibility');
  return result.eligible;
}

export function submitNps(body: NpsResponseInput): Promise<NpsSubmitResult> {
  return request<NpsSubmitResult>('/feedback/nps', { method: 'POST', body: JSON.stringify(body) });
}

export function dismissNps(): Promise<void> {
  return request<void>('/feedback/nps/dismiss', { method: 'POST' });
}

// --- Admin triage + NPS analytics ---

export interface FeedbackListQuery {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const feedbackAdminApi = {
  list: (params: FeedbackListQuery = {}) =>
    request<FeedbackSubmissionList>(`/admin/feedback${query({ ...params })}`),
  get: (id: string) => request<FeedbackSubmission>(`/admin/feedback/${encodeURIComponent(id)}`),
  update: (id: string, body: UpdateFeedbackInput) =>
    request<FeedbackSubmission>(`/admin/feedback/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    request<void>(`/admin/feedback/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  npsResponses: (page = 1, pageSize = 25) =>
    request<NpsResponseList>(`/admin/feedback/nps${query({ page, pageSize })}`),
  npsAnalytics: (from?: string, to?: string) =>
    request<NpsAnalytics>(`/admin/feedback/nps/analytics${query({ from, to })}`),
};
