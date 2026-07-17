/**
 * Shared "play a note" service — the app-wide note trigger. Prefers sampled General-MIDI instruments
 * (smplr's Soundfont) and falls back to the dependency-free oscillator in `audio.ts` whenever a
 * soundfont isn't loaded (offline, SSR, or during first-load), so every tool always makes sound.
 *
 * Design notes:
 * - **Per-instrument registry** (not a global singleton) so tools pick instruments independently.
 * - Sampled audio routes through the `audio.ts` master bus (`getDestination`), so visualizers tap it.
 * - `noteOn`/`noteOff` sustain a note for its real held duration and carry velocity; `playNote` is the
 *   back-compatible one-shot used by the many tools that just trigger a note.
 * - smplr is imported lazily (dynamic import) so it never weighs down tools that don't need samples.
 */
import {
  getAudioContext,
  getDestination,
  oscNoteOff,
  oscNoteOn,
  playTone,
  scheduleTone,
} from './audio';
import { midiToFrequency } from './music-theory';

/** A curated menu of General-MIDI instruments across families (smplr accepts the full GM set). */
export const SOUNDFONT_INSTRUMENTS = [
  // Keyboards
  { name: 'acoustic_grand_piano', label: 'Grand piano' },
  { name: 'bright_acoustic_piano', label: 'Bright piano' },
  { name: 'electric_piano_1', label: 'Electric piano' },
  { name: 'harpsichord', label: 'Harpsichord' },
  { name: 'clavinet', label: 'Clavinet' },
  // Tuned percussion
  { name: 'celesta', label: 'Celesta' },
  { name: 'music_box', label: 'Music box' },
  { name: 'vibraphone', label: 'Vibraphone' },
  { name: 'marimba', label: 'Marimba' },
  { name: 'xylophone', label: 'Xylophone' },
  { name: 'tubular_bells', label: 'Tubular bells' },
  // Organs & free reed
  { name: 'drawbar_organ', label: 'Drawbar organ' },
  { name: 'rock_organ', label: 'Rock organ' },
  { name: 'church_organ', label: 'Church organ' },
  { name: 'accordion', label: 'Accordion' },
  { name: 'harmonica', label: 'Harmonica' },
  // Guitars
  { name: 'acoustic_guitar_nylon', label: 'Nylon guitar' },
  { name: 'acoustic_guitar_steel', label: 'Steel guitar' },
  { name: 'electric_guitar_jazz', label: 'Jazz guitar' },
  { name: 'electric_guitar_clean', label: 'Electric guitar' },
  { name: 'overdriven_guitar', label: 'Overdriven guitar' },
  // Basses
  { name: 'acoustic_bass', label: 'Upright bass' },
  { name: 'electric_bass_finger', label: 'Electric bass' },
  { name: 'fretless_bass', label: 'Fretless bass' },
  // Strings & voice
  { name: 'violin', label: 'Violin' },
  { name: 'cello', label: 'Cello' },
  { name: 'orchestral_harp', label: 'Harp' },
  { name: 'string_ensemble_1', label: 'Strings' },
  { name: 'choir_aahs', label: 'Choir' },
  // Brass & reeds
  { name: 'trumpet', label: 'Trumpet' },
  { name: 'trombone', label: 'Trombone' },
  { name: 'alto_sax', label: 'Alto sax' },
  { name: 'tenor_sax', label: 'Tenor sax' },
  { name: 'clarinet', label: 'Clarinet' },
  // Winds
  { name: 'flute', label: 'Flute' },
  { name: 'pan_flute', label: 'Pan flute' },
] as const;

export type SoundfontStatus = 'idle' | 'loading' | 'sampled' | 'fallback';

/** smplr instrument surface we use. `start` returns a per-note stop function. */
interface SmplrInstrument {
  load: Promise<unknown>;
  start(options: {
    note: number;
    velocity?: number;
    duration?: number;
    /** Absolute AudioContext time to start at (for scheduled/arranged playback). */
    time?: number;
  }): ((time?: number) => void) | undefined;
  stop(options?: { note?: number }): void;
}

interface Entry {
  instrument: SmplrInstrument | null;
  status: SoundfontStatus;
  loading: Promise<SoundfontStatus> | null;
}

export const DEFAULT_INSTRUMENT = 'acoustic_grand_piano';

const registry = new Map<string, Entry>();
let defaultName: string = DEFAULT_INSTRUMENT;

function entryFor(name: string): Entry {
  let entry = registry.get(name);
  if (!entry) {
    entry = { instrument: null, status: 'idle', loading: null };
    registry.set(name, entry);
  }
  return entry;
}

/**
 * Load a General-MIDI instrument by name (cached per instrument). Resolves to `'sampled'` when ready
 * or `'fallback'` when loading failed (e.g. offline) — in which case the note fns use the oscillator.
 */
export function loadInstrument(name: string): Promise<SoundfontStatus> {
  const entry = entryFor(name);
  if (entry.instrument) {
    return Promise.resolve('sampled');
  }
  if (entry.loading) {
    return entry.loading;
  }
  entry.status = 'loading';
  entry.loading = (async () => {
    const ctx = getAudioContext();
    if (!ctx) {
      entry.status = 'fallback';
      return 'fallback';
    }
    try {
      const { Soundfont } = await import('smplr');
      const destination = getDestination() ?? undefined;
      const next = new Soundfont(ctx, {
        instrument: name,
        ...(destination ? { destination } : {}),
      }) as unknown as SmplrInstrument;
      await next.load;
      entry.instrument = next;
      entry.status = 'sampled';
      return 'sampled';
    } catch {
      entry.instrument = null;
      entry.status = 'fallback';
      return 'fallback';
    } finally {
      entry.loading = null;
    }
  })();
  return entry.loading;
}

/** Back-compat alias (was the only loader before the registry). */
export const loadSoundfont = loadInstrument;

/** Set the instrument used by callers that don't name one, warming it in the background. */
export function setDefaultInstrument(name: string): void {
  defaultName = name;
  void loadInstrument(name);
}

/** Current status of an instrument (defaults to the active default instrument). */
export function instrumentStatus(name: string = defaultName): SoundfontStatus {
  return registry.get(name)?.status ?? 'idle';
}

/** Whether a sampled instrument is loaded (vs. the oscillator fallback). */
export function isSampled(name: string = defaultName): boolean {
  return registry.get(name)?.instrument != null;
}

// Held sampled voices → per-note stop fn, keyed `${instrument}:${midi}`.
const voices = new Map<string, (time?: number) => void>();
const voiceKey = (name: string, midi: number) => `${name}:${midi}`;

/** Normalize velocity (0–1 or 1–127) to smplr's 1–127 scale; defaults to a moderate 90. */
function toMidiVelocity(velocity?: number): number {
  if (velocity == null) return 90;
  const v = velocity <= 1 ? velocity * 127 : velocity;
  return Math.max(1, Math.min(127, Math.round(v)));
}

/** Warm the default/selected instrument on first use so samples take over from the fallback. */
function ensureLoaded(name: string): Entry {
  const entry = entryFor(name);
  if (entry.status === 'idle' && !entry.loading) {
    void loadInstrument(name);
  }
  return entry;
}

/** Start a note that rings until `noteOff`. `velocity` accepts 0–1 or 1–127. */
export function noteOn(midi: number, opts?: { velocity?: number; instrument?: string }): void {
  const name = opts?.instrument ?? defaultName;
  const entry = ensureLoaded(name);
  if (entry.instrument) {
    const stop = entry.instrument.start({ note: midi, velocity: toMidiVelocity(opts?.velocity) });
    if (typeof stop === 'function') {
      voices.set(voiceKey(name, midi), stop);
    }
    return;
  }
  const norm =
    opts?.velocity == null ? 0.7 : opts.velocity > 1 ? opts.velocity / 127 : opts.velocity;
  oscNoteOn(midi, midiToFrequency(midi), norm);
}

/** Release a note started with `noteOn`. */
export function noteOff(midi: number, opts?: { instrument?: string }): void {
  const name = opts?.instrument ?? defaultName;
  const stop = voices.get(voiceKey(name, midi));
  if (stop) {
    try {
      stop();
    } catch {
      // already stopped
    }
    voices.delete(voiceKey(name, midi));
    return;
  }
  oscNoteOff(midi);
}

/** Release every held voice — call on blur/unmount so notes never hang. */
export function releaseAll(): void {
  for (const stop of voices.values()) {
    try {
      stop();
    } catch {
      // ignore
    }
  }
  voices.clear();
}

/**
 * One-shot: play `midi` for `duration` seconds through the sampled instrument, or the oscillator if
 * none is ready. The de-facto "play a note now" primitive for tools that don't hold notes.
 */
export function playNote(
  midi: number,
  duration = 1,
  opts?: { velocity?: number; instrument?: string },
): void {
  const name = opts?.instrument ?? defaultName;
  const entry = ensureLoaded(name);
  if (entry.instrument) {
    entry.instrument.start({ note: midi, velocity: toMidiVelocity(opts?.velocity), duration });
    return;
  }
  playTone(midiToFrequency(midi), Math.min(duration, 0.7));
}

// Stop handles for sampled notes scheduled ahead on the timeline (for score playback / loops).
const scheduledStoppers: Array<(time?: number) => void> = [];

/**
 * Schedule a note to sound at absolute AudioContext time `atTime` for `durationSec` — for arranged /
 * score playback. Sampled when a soundfont is loaded (tracked so `stopScheduled` can cancel it), else
 * the oscillator (`scheduleTone`, routed through `opts.output` so a caller-owned bus can silence it).
 */
export function scheduleNote(
  midi: number,
  atTime: number,
  durationSec: number,
  opts?: { velocity?: number; instrument?: string; output?: AudioNode },
): void {
  const name = opts?.instrument ?? defaultName;
  const entry = ensureLoaded(name);
  if (entry.instrument) {
    const stop = entry.instrument.start({
      note: midi,
      time: atTime,
      duration: durationSec,
      velocity: toMidiVelocity(opts?.velocity),
    });
    if (typeof stop === 'function') scheduledStoppers.push(stop);
    return;
  }
  const gain = opts?.velocity != null ? 0.12 + (toMidiVelocity(opts.velocity) / 127) * 0.16 : 0.22;
  scheduleTone(midiToFrequency(midi), atTime, durationSec, {
    type: 'triangle',
    gain,
    output: opts?.output,
  });
}

/** Cancel all sampled notes scheduled via `scheduleNote` (call on stop / loop-restart). The oscillator
 * fallback is cancelled by the caller's playback bus. */
export function stopScheduled(): void {
  for (const stop of scheduledStoppers) {
    try {
      stop();
    } catch {
      // already stopped
    }
  }
  scheduledStoppers.length = 0;
}
