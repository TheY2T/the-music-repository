/**
 * Optional sampled-instrument playback via smplr's General-MIDI Soundfont.
 *
 * Samples stream from a CDN at runtime, so loading can fail offline. Everything
 * here degrades gracefully: if a soundfont can't be loaded, `playNote` falls
 * back to the dependency-free oscillator engine in `audio.ts`, so the tool still
 * makes sound. The library is loaded lazily (dynamic import) so it never weighs
 * down tools that don't use it.
 */
import { getAudioContext, playTone } from './audio';
import { midiToFrequency } from './music-theory';

/** A short, friendly menu of General-MIDI instruments (smplr accepts the full GM set). */
export const SOUNDFONT_INSTRUMENTS = [
  { name: 'acoustic_grand_piano', label: 'Grand piano' },
  { name: 'electric_piano_1', label: 'Electric piano' },
  { name: 'acoustic_guitar_nylon', label: 'Nylon guitar' },
  { name: 'acoustic_guitar_steel', label: 'Steel guitar' },
  { name: 'electric_guitar_clean', label: 'Electric guitar' },
  { name: 'acoustic_bass', label: 'Upright bass' },
  { name: 'string_ensemble_1', label: 'Strings' },
  { name: 'church_organ', label: 'Church organ' },
  { name: 'flute', label: 'Flute' },
  { name: 'vibraphone', label: 'Vibraphone' },
] as const;

export type SoundfontStatus = 'idle' | 'loading' | 'sampled' | 'fallback';

interface SmplrInstrument {
  load: Promise<unknown>;
  start(options: { note: number; velocity?: number; duration?: number }): void;
  stop(): void;
}

let instrument: SmplrInstrument | null = null;
let loadedName: string | null = null;
let loading: Promise<SoundfontStatus> | null = null;

/**
 * Load a General-MIDI instrument by name. Resolves to `'sampled'` when the
 * soundfont is ready, or `'fallback'` when loading failed (e.g. offline) — in
 * which case `playNote` uses the oscillator engine. Idempotent per instrument.
 */
export function loadSoundfont(name: string): Promise<SoundfontStatus> {
  if (loadedName === name && instrument) {
    return Promise.resolve('sampled');
  }
  if (loading) {
    return loading;
  }
  loading = (async () => {
    const ctx = getAudioContext();
    if (!ctx) {
      return 'fallback';
    }
    try {
      const { Soundfont } = await import('smplr');
      const next = new Soundfont(ctx, { instrument: name }) as unknown as SmplrInstrument;
      await next.load;
      instrument?.stop();
      instrument = next;
      loadedName = name;
      return 'sampled';
    } catch {
      instrument = null;
      loadedName = null;
      return 'fallback';
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Play a MIDI note through the loaded soundfont, or the oscillator if none is ready. */
export function playNote(midi: number, duration = 1): void {
  if (instrument) {
    instrument.start({ note: midi, velocity: 90, duration });
    return;
  }
  playTone(midiToFrequency(midi), Math.min(duration, 0.7));
}

/** Whether a sampled instrument is currently loaded (vs. the oscillator fallback). */
export function isSampled(): boolean {
  return instrument !== null;
}
