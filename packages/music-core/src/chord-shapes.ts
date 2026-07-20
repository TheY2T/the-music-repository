// Chord-shape data (framework-free). The pure SVG renderer that draws these lives in
// `@TheY2T/tmr-musickit-ui/organisms` (ChordDiagram); the data lives here in music-core so
// headless consumers (embeds resolution, chord-library generation) can use it without pulling in UI.

// Open-string MIDI, low-E first (diagram convention: low E on the left).
export const TUNING_LOW_FIRST = [40, 45, 50, 55, 59, 64];
// Standard (reentrant) ukulele, g-C-E-A shown left→right on the diagram.
export const UKULELE_TUNING_LOW_FIRST = [67, 60, 64, 69];

export interface ChordShape {
  name: string;
  quality: 'major' | 'minor' | 'barre' | 'dominant';
  /** Fret per string, low string first. -1 = muted, 0 = open. Length = number of strings. Absolute
   * fret numbers so audio can sound them (tuning[i] + frets[i]); `baseFret` only windows the display. */
  frets: number[];
  /** Fret shown at the top of the 5-fret diagram window (default 1 = nut). Set >1 for movable shapes
   * further up the neck; the diagram then draws a "{baseFret}fr" position label instead of the nut. */
  baseFret?: number;
  /** Fretting-hand finger per string, low string first: 0 = open/none, 1–4 = index→pinky. When present,
   * the diagram prints the digit inside each fretted dot. Same length as `frets`. */
  fingers?: number[];
  /** Absolute fret(s) carrying a full barre. When present, the diagram draws a bar across the fretted
   * strings at that fret. */
  barres?: number[];
}

export const GUITAR_CHORDS: ChordShape[] = [
  { name: 'C', quality: 'major', frets: [-1, 3, 2, 0, 1, 0] },
  { name: 'A', quality: 'major', frets: [-1, 0, 2, 2, 2, 0] },
  { name: 'G', quality: 'major', frets: [3, 2, 0, 0, 0, 3] },
  { name: 'E', quality: 'major', frets: [0, 2, 2, 1, 0, 0] },
  { name: 'D', quality: 'major', frets: [-1, -1, 0, 2, 3, 2] },
  { name: 'Am', quality: 'minor', frets: [-1, 0, 2, 2, 1, 0] },
  { name: 'Em', quality: 'minor', frets: [0, 2, 2, 0, 0, 0] },
  { name: 'Dm', quality: 'minor', frets: [-1, -1, 0, 2, 3, 1] },
  { name: 'F', quality: 'barre', frets: [1, 3, 3, 2, 1, 1] },
  { name: 'Bm', quality: 'barre', frets: [-1, 2, 4, 4, 3, 2] },
  // Open dominant sevenths (blues / turnarounds).
  { name: 'A7', quality: 'dominant', frets: [-1, 0, 2, 0, 2, 0] },
  { name: 'D7', quality: 'dominant', frets: [-1, -1, 0, 2, 1, 2] },
  { name: 'E7', quality: 'dominant', frets: [0, 2, 0, 1, 0, 0] },
  { name: 'C7', quality: 'dominant', frets: [-1, 3, 2, 3, 1, 0] },
  { name: 'G7', quality: 'dominant', frets: [3, 2, 0, 0, 0, 1] },
  { name: 'B7', quality: 'dominant', frets: [-1, 2, 1, 2, 0, 2] },
];

// Standard C-tuning ukulele open shapes (frets low-string-first: g, C, E, A).
export const UKULELE_CHORDS: ChordShape[] = [
  { name: 'C', quality: 'major', frets: [0, 0, 0, 3] },
  { name: 'G', quality: 'major', frets: [0, 2, 3, 2] },
  { name: 'F', quality: 'major', frets: [2, 0, 1, 0] },
  { name: 'D', quality: 'major', frets: [2, 2, 2, 0] },
  { name: 'A', quality: 'major', frets: [2, 1, 0, 0] },
  { name: 'Am', quality: 'minor', frets: [2, 0, 0, 0] },
  { name: 'Em', quality: 'minor', frets: [0, 4, 3, 2] },
  { name: 'Dm', quality: 'minor', frets: [2, 2, 1, 0] },
  { name: 'C7', quality: 'dominant', frets: [0, 0, 0, 1] },
  { name: 'G7', quality: 'dominant', frets: [0, 2, 1, 2] },
  { name: 'D7', quality: 'dominant', frets: [2, 2, 3, 3] },
];
