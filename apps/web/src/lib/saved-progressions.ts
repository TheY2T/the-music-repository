// Local-first persistence for user-built chord progressions (bridges toward backend sync later).

export interface SavedProgression {
  name: string;
  keyRoot: number;
  chords: { root: number; quality: string }[];
}

const KEY = 'tmr.savedProgressions';

export function listSaved(): SavedProgression[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedProgression[]) : [];
  } catch {
    return [];
  }
}

export function saveProgression(entry: SavedProgression): SavedProgression[] {
  const all = [entry, ...listSaved().filter((p) => p.name !== entry.name)];
  localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}

export function deleteProgression(name: string): SavedProgression[] {
  const all = listSaved().filter((p) => p.name !== name);
  localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}
