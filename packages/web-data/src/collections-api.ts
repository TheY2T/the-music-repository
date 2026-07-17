import type {
  CollectionDetail,
  CollectionItemInput,
  CollectionRatingResult,
  CollectionSummary,
  UserCollectionWriteInput,
} from '@TheY2T/tmr-api-client';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// --- Bookmarks -------------------------------------------------------------

/** The current user's saved (bookmarked) collections. Empty for anonymous / on error. */
export async function listSavedCollections(): Promise<CollectionSummary[]> {
  const res = await fetch(`${API_BASE}/me/saved-collections`, { credentials: 'include' });
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as { items: CollectionSummary[] };
  return data.items;
}

export async function listSavedCollectionSlugs(): Promise<string[]> {
  return (await listSavedCollections()).map((c) => c.slug);
}

export async function saveCollection(slug: string): Promise<void> {
  await fetch(`${API_BASE}/me/collections/${encodeURIComponent(slug)}/bookmark`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function unsaveCollection(slug: string): Promise<void> {
  await fetch(`${API_BASE}/me/collections/${encodeURIComponent(slug)}/bookmark`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

// --- Ratings ---------------------------------------------------------------

export async function rateCollection(
  slug: string,
  rating: number,
): Promise<CollectionRatingResult | null> {
  const res = await fetch(`${API_BASE}/me/collections/${encodeURIComponent(slug)}/rating`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
  return res.ok ? ((await res.json()) as CollectionRatingResult) : null;
}

// --- Popularity ------------------------------------------------------------

/** Best-effort open signal; ignores failures. */
export function recordCollectionOpen(slug: string): void {
  void fetch(`${API_BASE}/collections/${encodeURIComponent(slug)}/open`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
}

// --- User-created collections ---------------------------------------------

export async function listMyCollections(): Promise<CollectionSummary[]> {
  const res = await fetch(`${API_BASE}/me/collections`, { credentials: 'include' });
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as { items: CollectionSummary[] };
  return data.items;
}

export async function getMyCollection(slug: string): Promise<CollectionDetail | null> {
  const res = await fetch(`${API_BASE}/me/collections/${encodeURIComponent(slug)}`, {
    credentials: 'include',
  });
  return res.ok ? ((await res.json()) as CollectionDetail) : null;
}

export async function createUserCollection(
  input: UserCollectionWriteInput,
): Promise<CollectionDetail | null> {
  const res = await fetch(`${API_BASE}/me/collections`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.ok ? ((await res.json()) as CollectionDetail) : null;
}

export async function updateUserCollection(
  slug: string,
  input: UserCollectionWriteInput,
): Promise<CollectionDetail | null> {
  const res = await fetch(`${API_BASE}/me/collections/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.ok ? ((await res.json()) as CollectionDetail) : null;
}

export async function setUserCollectionItems(
  slug: string,
  items: CollectionItemInput[],
): Promise<CollectionDetail | null> {
  const res = await fetch(`${API_BASE}/me/collections/${encodeURIComponent(slug)}/items`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return res.ok ? ((await res.json()) as CollectionDetail) : null;
}

export async function deleteUserCollection(slug: string): Promise<void> {
  await fetch(`${API_BASE}/me/collections/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
