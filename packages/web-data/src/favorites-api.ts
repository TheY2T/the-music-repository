import type { ContentSummary } from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/** The current user's favorited items (published). Empty for anonymous / on error. */
export async function listFavorites(): Promise<ContentSummary[]> {
  const response = await fetch(`${API_BASE}/me/favorites`, { credentials: 'include' });
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as { items: ContentSummary[] };
  return data.items;
}

export async function listFavoriteSlugs(): Promise<string[]> {
  return (await listFavorites()).map((item) => item.slug);
}

export async function addFavorite(slug: string): Promise<void> {
  await fetch(`${API_BASE}/me/favorites/${encodeURIComponent(slug)}`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function removeFavorite(slug: string): Promise<void> {
  await fetch(`${API_BASE}/me/favorites/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
