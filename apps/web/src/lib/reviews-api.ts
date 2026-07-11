import type { DeckSummary, ReviewState } from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as T;
}

export async function getReviewSummary(): Promise<DeckSummary[]> {
  const data = await request<{ decks: DeckSummary[] }>('/me/reviews');
  return data?.decks ?? [];
}

export async function getDeckReviews(deck: string): Promise<ReviewState[]> {
  const data = await request<{ cards: ReviewState[] }>(`/me/reviews/${encodeURIComponent(deck)}`);
  return data?.cards ?? [];
}

export function gradeCard(
  deck: string,
  card: string,
  quality: number,
): Promise<ReviewState | null> {
  return request<ReviewState>(
    `/me/reviews/${encodeURIComponent(deck)}/${encodeURIComponent(card)}`,
    { method: 'POST', body: JSON.stringify({ quality }) },
  );
}
