import type { SavedProgression } from './saved-progressions';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/** The current user's cloud-saved progressions (most-recent first). Empty for anon / on error. */
export async function listRemoteProgressions(): Promise<SavedProgression[]> {
  try {
    const response = await fetch(`${API_BASE}/me/progressions`, { credentials: 'include' });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as {
      items: { name: string; keyRoot: number; chords: SavedProgression['chords'] }[];
    };
    return data.items.map((p) => ({ name: p.name, keyRoot: p.keyRoot, chords: p.chords }));
  } catch {
    return [];
  }
}

/** Create or replace a progression by name. */
export async function saveRemoteProgression(p: SavedProgression): Promise<void> {
  await fetch(`${API_BASE}/me/progressions/${encodeURIComponent(p.name)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyRoot: p.keyRoot, chords: p.chords }),
  });
}

export async function deleteRemoteProgression(name: string): Promise<void> {
  await fetch(`${API_BASE}/me/progressions/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
