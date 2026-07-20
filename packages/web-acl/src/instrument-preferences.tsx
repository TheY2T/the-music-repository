import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getRemotePreferences, saveRemotePreferences } from './preferences-api';

/** Guitar orientation. `left` mirrors the fretboard + chord diagrams horizontally. */
export type Handedness = 'left' | 'right';

/**
 * A user's immersive-instrument choices. Skin ids are plain strings governed by the music-core skin
 * registries (`@TheY2T/tmr-music-core/instrument-skins`); an unknown id falls back to the default skin
 * where it is resolved.
 */
export interface InstrumentPreferences {
  handedness: Handedness;
  keyboardSkin: string;
  fretboardSkin: string;
  /** Whether the tools open in fullscreen by default (entering still needs a user gesture). */
  fullscreen: boolean;
}

/** The values a visitor starts with: right-handed, the token-themed default skin, windowed. */
export const DEFAULT_INSTRUMENT_PREFERENCES: InstrumentPreferences = {
  handedness: 'right',
  keyboardSkin: 'theme',
  fretboardSkin: 'theme',
  fullscreen: false,
};

const STORAGE_KEYS = {
  handedness: 'tmr.instrument.handedness',
  keyboardSkin: 'tmr.instrument.keyboardSkin',
  fretboardSkin: 'tmr.instrument.fretboardSkin',
  fullscreen: 'tmr.instrument.fullscreen',
} as const;

/** The remembered preferences from localStorage, or defaults. Guarded (SSR / private mode). */
export function readLocalPreferences(): InstrumentPreferences {
  try {
    const handedness = localStorage.getItem(STORAGE_KEYS.handedness);
    return {
      handedness: handedness === 'left' ? 'left' : 'right',
      keyboardSkin:
        localStorage.getItem(STORAGE_KEYS.keyboardSkin) ??
        DEFAULT_INSTRUMENT_PREFERENCES.keyboardSkin,
      fretboardSkin:
        localStorage.getItem(STORAGE_KEYS.fretboardSkin) ??
        DEFAULT_INSTRUMENT_PREFERENCES.fretboardSkin,
      fullscreen: localStorage.getItem(STORAGE_KEYS.fullscreen) === 'true',
    };
  } catch {
    return { ...DEFAULT_INSTRUMENT_PREFERENCES };
  }
}

/** Mirror preferences to localStorage so anonymous visitors keep a device-local copy. Guarded. */
export function writeLocalPreferences(prefs: InstrumentPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.handedness, prefs.handedness);
    localStorage.setItem(STORAGE_KEYS.keyboardSkin, prefs.keyboardSkin);
    localStorage.setItem(STORAGE_KEYS.fretboardSkin, prefs.fretboardSkin);
    localStorage.setItem(STORAGE_KEYS.fullscreen, String(prefs.fullscreen));
  } catch {
    /* ignore */
  }
}

interface InstrumentPreferencesContextValue {
  preferences: InstrumentPreferences;
  /** Merge a partial update; writes through to localStorage (and the account when signed in). */
  update: (patch: Partial<InstrumentPreferences>) => void;
}

const InstrumentPreferencesContext = createContext<InstrumentPreferencesContextValue | null>(null);

/**
 * Shares the viewer's instrument preferences across every island in one React root. Seeds from
 * localStorage for instant paint, hydrates from the account when `authenticated`, and writes every
 * change through to both. Mounted by the web app's `AppProviders` around each interactive region.
 */
export function InstrumentPreferencesProvider({
  authenticated = false,
  children,
}: PropsWithChildren<{ authenticated?: boolean }>) {
  const [preferences, setPreferences] = useState<InstrumentPreferences>(
    DEFAULT_INSTRUMENT_PREFERENCES,
  );

  // Seed from localStorage after mount (kept out of the initial render so hydration matches the server).
  useEffect(() => {
    setPreferences(readLocalPreferences());
  }, []);

  // When signed in, the account is the source of truth: pull it and mirror it locally.
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    getRemotePreferences().then((remote) => {
      if (cancelled || !remote) return;
      setPreferences(remote);
      writeLocalPreferences(remote);
    });
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  const update = useCallback(
    (patch: Partial<InstrumentPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch };
        writeLocalPreferences(next);
        if (authenticated) {
          void saveRemotePreferences(next);
        }
        return next;
      });
    },
    [authenticated],
  );

  const value = useMemo(() => ({ preferences, update }), [preferences, update]);
  return (
    <InstrumentPreferencesContext.Provider value={value}>
      {children}
    </InstrumentPreferencesContext.Provider>
  );
}

/**
 * Reads the viewer's instrument preferences. Outside a provider it degrades to read-only defaults with a
 * no-op setter, so tools and content embeds render safely even without the provider mounted.
 */
export function useInstrumentPreferences(): InstrumentPreferencesContextValue {
  return (
    useContext(InstrumentPreferencesContext) ?? {
      preferences: DEFAULT_INSTRUMENT_PREFERENCES,
      update: () => {},
    }
  );
}
