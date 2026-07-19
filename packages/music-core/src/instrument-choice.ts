/**
 * Per-family sampled-instrument selection for the interactive tools.
 *
 * Tools trigger notes through the shared note service (`soundfont.ts`), which has a single "default"
 * instrument that bare `playNote`/`noteOn` calls use. Since each tool is its own page (one tool island
 * at a time), a tool can set that default to its family's chosen instrument on mount — every
 * `playNote` in the tool then sounds with it, no per-call threading. `useToolInstrument` does exactly
 * that, remembers the choice per **family** (a guitar sound is remembered for guitar tools, a piano
 * sound for piano tools) in localStorage, and gates readiness like `useInstrumentReady` so the first
 * note never lags on sample-fetch.
 */
import { useCallback, useEffect, useState } from 'react';
import { loadInstrument, type SoundfontStatus, setDefaultInstrument } from './soundfont';

export type InstrumentFamily = 'piano' | 'guitar' | 'bass';

/** The instrument a family opens on until the user picks another. */
const FAMILY_DEFAULT: Record<InstrumentFamily, string> = {
  piano: 'acoustic_grand_piano',
  guitar: 'acoustic_guitar_nylon',
  bass: 'electric_bass_finger',
};

const storageKey = (family: InstrumentFamily) => `tmr.instrument.${family}`;

export function defaultInstrumentFor(family: InstrumentFamily): string {
  return FAMILY_DEFAULT[family];
}

/** The remembered instrument for a family, or its default. Guarded (SSR / private mode). */
export function getInstrumentFor(family: InstrumentFamily): string {
  try {
    return localStorage.getItem(storageKey(family)) || FAMILY_DEFAULT[family];
  } catch {
    return FAMILY_DEFAULT[family];
  }
}

/** Remember a family's instrument choice. */
export function setInstrumentPref(family: InstrumentFamily, name: string): void {
  try {
    localStorage.setItem(storageKey(family), name);
  } catch {
    /* ignore */
  }
}

export interface ToolInstrument {
  /** The selected GM instrument name (e.g. `acoustic_grand_piano`). */
  instrument: string;
  /** Pick a new instrument — persisted for the family and applied to the note service. */
  setInstrument: (name: string) => void;
  /** True once the instrument's samples are loaded (or the offline oscillator fallback kicks in). */
  ready: boolean;
  status: SoundfontStatus;
}

/**
 * Select + load the sampled instrument for a tool's family. Reads the remembered choice on mount
 * (lazy init is safe — tools render behind a loading gate, so the picker's value never SSRs), makes it
 * the note-service default so the tool's `playNote`/`noteOn` calls use it, and reports readiness.
 */
export function useToolInstrument(family: InstrumentFamily): ToolInstrument {
  const [instrument, setInstrumentState] = useState<string>(() => getInstrumentFor(family));
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SoundfontStatus>('idle');

  useEffect(() => {
    // Route the tool's bare note calls through this instrument, and warm its samples.
    setDefaultInstrument(instrument);
    let cancelled = false;
    setReady(false);
    setStatus('loading');
    loadInstrument(instrument).then((s) => {
      if (!cancelled) {
        setStatus(s);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [instrument]);

  const setInstrument = useCallback(
    (name: string) => {
      setInstrumentPref(family, name);
      setInstrumentState(name);
    },
    [family],
  );

  return { instrument, setInstrument, ready, status };
}
