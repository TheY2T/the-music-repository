import type { InstrumentPreferences } from './instrument-preferences';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/** The current user's cloud-saved instrument preferences, or `null` for anon / off / on error. */
export async function getRemotePreferences(): Promise<InstrumentPreferences | null> {
  try {
    const response = await fetch(`${API_BASE}/me/preferences`, { credentials: 'include' });
    if (!response.ok) return null;
    const data = (await response.json()) as InstrumentPreferences;
    return {
      handedness: data.handedness === 'left' ? 'left' : 'right',
      keyboardSkin: data.keyboardSkin,
      fretboardSkin: data.fretboardSkin,
      fullscreen: Boolean(data.fullscreen),
    };
  } catch {
    return null;
  }
}

/** Create or replace the current user's instrument preferences. Best-effort (anon / off is a no-op). */
export async function saveRemotePreferences(prefs: InstrumentPreferences): Promise<void> {
  try {
    await fetch(`${API_BASE}/me/preferences`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
  } catch {
    /* ignore — the localStorage mirror keeps the change on this device */
  }
}
