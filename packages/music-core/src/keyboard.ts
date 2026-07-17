/**
 * Piano-keyboard geometry + input mapping — the single source of truth shared by every keyboard
 * renderer (the interactive `PianoKeyboard`, its Pixi keybed, and the read-only voicing diagram).
 * Pure logic (no React/DOM/audio) so it is unit-testable.
 */

/** Pitch classes (0–11) that are black keys. */
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

/** Whether a MIDI note is a black key (handles negative MIDI defensively). */
export function isBlackKey(midi: number): boolean {
  return BLACK_PCS.has(((midi % 12) + 12) % 12);
}

/** A selectable keyboard size — the standard MIDI-controller sizes with their conventional ranges. */
export interface KeyboardSize {
  /** Total number of keys (white + black). */
  keys: number;
  /** MIDI note of the lowest key. */
  startMidi: number;
  /** Short label, e.g. "61 · C2–C7". */
  label: string;
}

/** Standard controller sizes. Ranges: 25=C3–C5, 37=C2–C5, 49=C2–C6, 61=C2–C7, 76=E1–G7, 88=A0–C8. */
export const KEYBOARD_SIZES: KeyboardSize[] = [
  { keys: 25, startMidi: 48, label: '25 · C3–C5' },
  { keys: 37, startMidi: 36, label: '37 · C2–C5' },
  { keys: 49, startMidi: 36, label: '49 · C2–C6' },
  { keys: 61, startMidi: 36, label: '61 · C2–C7' },
  { keys: 76, startMidi: 28, label: '76 · E1–G7' },
  { keys: 88, startMidi: 21, label: '88 · A0–C8' },
];

/** The default size shown first — 61 keys, the most common controller. */
export const DEFAULT_KEYBOARD_KEYS = 61;

export interface BlackKey {
  midi: number;
  /** Index (into `whiteMidis`) of the white key this black key sits after — for CSS positioning. */
  afterWhiteIndex: number;
}

export interface KeyLayout {
  /** Every MIDI note in the range, low→high. */
  midis: number[];
  whiteMidis: number[];
  blackMidis: BlackKey[];
  /** Percentage width of one white key (100 / white-key count). */
  whiteWidthPct: number;
}

/** Derive the white/black key geometry for a range of `count` keys starting at `startMidi`. */
export function keyLayout(startMidi: number, count: number): KeyLayout {
  const midis = Array.from({ length: count }, (_, i) => startMidi + i);
  const whiteMidis = midis.filter((m) => !isBlackKey(m));
  const blackMidis = midis.filter(isBlackKey).map((midi) => ({
    midi,
    afterWhiteIndex: midis.filter((m) => !isBlackKey(m) && m < midi).length - 1,
  }));
  return { midis, whiteMidis, blackMidis, whiteWidthPct: 100 / whiteMidis.length };
}

/** Resolve a key count to its `KeyboardSize` (falls back to 61) plus its layout. */
export function layoutForKeys(keys: number): KeyLayout & { size: KeyboardSize } {
  const size = KEYBOARD_SIZES.find((s) => s.keys === keys) ?? KEYBOARD_SIZES[3];
  return { size, ...keyLayout(size.startMidi, size.keys) };
}

/**
 * Computer-keyboard → semitone-offset map, keyed by `KeyboardEvent.code` (physical key, layout-agnostic)
 * so it works regardless of QWERTY/AZERTY. The conventional two-row web-piano layout: the `z`-row is the
 * lower octave, the `q`-row is the octave above. Offsets are semitones above the current base note.
 */
const QWERTY_OFFSETS: Record<string, number> = {
  // Lower octave (z-row): white keys z x c v b n m, black keys s d g h j.
  KeyZ: 0,
  KeyS: 1,
  KeyX: 2,
  KeyD: 3,
  KeyC: 4,
  KeyV: 5,
  KeyG: 6,
  KeyB: 7,
  KeyH: 8,
  KeyN: 9,
  KeyJ: 10,
  KeyM: 11,
  Comma: 12,
  // Upper octave (q-row): white keys q w e r t y u, black keys 2 3 5 6 7.
  KeyQ: 12,
  Digit2: 13,
  KeyW: 14,
  Digit3: 15,
  KeyE: 16,
  KeyR: 17,
  Digit5: 18,
  KeyT: 19,
  Digit6: 20,
  KeyY: 21,
  Digit7: 22,
  KeyU: 23,
  KeyI: 24,
};

/** Map physical computer keys to MIDI notes, offset from `baseMidi` (the current octave-shift base). */
export function qwertyMap(baseMidi: number): Map<string, number> {
  return new Map(Object.entries(QWERTY_OFFSETS).map(([code, offset]) => [code, baseMidi + offset]));
}
