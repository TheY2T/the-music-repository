import { useEffect, useState } from 'react';
import { LEVELS, type Level } from '@/lib/music-theory';

const STORAGE_KEY = 'tmr.level';

function isLevel(value: string | null): value is Level {
  return value != null && (LEVELS as string[]).includes(value);
}

/**
 * A learner's chosen difficulty tier (Beginner → Expert), persisted in `localStorage` so it carries
 * across every tool that offers a level selector. Starts at `initial` on the server + first client
 * render (no hydration flash), then upgrades to the saved value after mount. Tools use the level to
 * filter their scale/chord pickers via `scalesByLevel` / `chordsByLevel`.
 */
export function useLevel(initial: Level = 'beginner'): {
  level: Level;
  setLevel: (level: Level) => void;
} {
  const [level, setLevelState] = useState<Level>(initial);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLevel(saved)) setLevelState(saved);
  }, []);

  function setLevel(next: Level) {
    setLevelState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode / storage disabled — keep the in-memory value.
    }
  }

  return { level, setLevel };
}
