// Keyboard/piano chord voicings (framework-free). Given a root MIDI note + chord intervals, produce a
// set of playable voicings — root position, inversions, and the common drop/shell re-voicings — as MIDI
// note lists. Kept headless so the voicing tool, the keyboard chord diagram and drills all share one
// source. The SVG renderer that draws these lives in `@TheY2T/tmr-musickit-ui/organisms`.

import { intervalLabel } from './music-theory';

export interface PianoVoicing {
  key: string;
  name: string;
  description: string;
  /** MIDI notes, low to high. */
  midis: number[];
  /** 0 = root position, 1/2/3 = nth inversion. Undefined for drop/shell/open re-voicings. */
  inversion?: number;
}

/** Rotate the lowest `n` notes up an octave (root position → nth inversion). */
export function invert(voicing: number[], n: number): number[] {
  const out = [...voicing].sort((a, b) => a - b);
  for (let k = 0; k < n; k += 1) {
    const low = out.shift();
    if (low !== undefined) out.push(low + 12);
  }
  return out.sort((a, b) => a - b);
}

/** Drop the `fromTop`-th voice (counting from the top) down an octave. */
export function drop(voicing: number[], fromTop: number): number[] {
  const asc = [...voicing].sort((a, b) => a - b);
  const index = asc.length - fromTop;
  if (index >= 0 && index < asc.length) asc[index] -= 12;
  return asc.sort((a, b) => a - b);
}

const INVERSION_NAMES = ['Root position', '1st inversion', '2nd inversion', '3rd inversion'];

/** The 1–3–7 "shell" voicing (root, 3rd, 7th) of a seventh/extended chord. */
function shellVoicing(close: number[], rootMidi: number): number[] {
  return [0, 1, 3].map((idx) => close[idx] ?? rootMidi);
}

/**
 * Voicings of a chord on the keyboard: root position, each usable inversion (up to the 3rd), and — for
 * seventh and extended chords — drop-2/drop-3/shell re-voicings; a spread "open" voicing for triads. The
 * inversion voicings carry an `inversion` index so a diagram can label which chord tone sits in the bass.
 */
export function buildPianoVoicings(rootMidi: number, intervals: number[]): PianoVoicing[] {
  const close = intervals.map((i) => rootMidi + i);
  const list: PianoVoicing[] = [
    {
      key: 'close',
      name: INVERSION_NAMES[0] ?? 'Root position',
      description: 'Chord tones stacked from the root — the plain shape.',
      midis: close,
      inversion: 0,
    },
  ];

  // The nth inversion puts the nth chord tone in the bass; cap at the 3rd inversion (a 7th chord's last).
  const maxInversion = Math.min(intervals.length - 1, 3);
  for (let n = 1; n <= maxInversion; n += 1) {
    list.push({
      key: `inv${n}`,
      name: INVERSION_NAMES[n] ?? `${n}th inversion`,
      description: `The ${intervalLabel(intervals[n] ?? 0)} is in the bass.`,
      midis: invert(close, n),
      inversion: n,
    });
  }

  if (intervals.length === 4) {
    list.push(
      {
        key: 'drop2',
        name: 'Drop 2',
        description: 'Second voice from the top dropped an octave — a rich, spread jazz voicing.',
        midis: drop(close, 2),
      },
      {
        key: 'drop3',
        name: 'Drop 3',
        description: 'Third voice from the top dropped an octave — even wider.',
        midis: drop(close, 3),
      },
      {
        key: 'shell',
        name: 'Shell (1–3–7)',
        description: 'Root, 3rd and 7th — the essential colour, no 5th. The comping staple.',
        midis: shellVoicing(close, rootMidi),
      },
    );
  } else if (intervals.length === 3) {
    const [r = rootMidi, third = rootMidi, fifth = rootMidi] = close;
    list.push({
      key: 'open',
      name: 'Open (spread triad)',
      description: 'Middle voice up an octave for an open, ringing sound.',
      midis: [r, fifth, third + 12],
    });
  } else if (intervals.length >= 5) {
    list.push({
      key: 'shell',
      name: 'Shell (1–3–7)',
      description: 'Root, 3rd and 7th — the core of the extended chord, upper tensions omitted.',
      midis: shellVoicing(close, rootMidi),
    });
  }

  return list;
}
