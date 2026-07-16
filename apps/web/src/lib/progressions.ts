/**
 * Curated chord-progression templates by genre + level, and a pure realizer that renders a template
 * into a concrete key. Templates are diatonic-degree based (degree 1–7 of the major scale) with an
 * explicit chord quality (a `CHORDS` key) and Roman numeral, so blues dominant-7ths, jazz 7ths and
 * secondary dominants are all expressible. Feeds the progression-generator tool; framework-free +
 * unit-tested.
 */
import { CHORDS, type Level, pitchName } from './music-theory';

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

export interface ProgressionChordSpec {
  /** Scale degree 1–7 in the major key. */
  degree: number;
  /** Chord-quality key from `CHORDS` (e.g. `major`, `minor-7`, `dominant-7`). */
  quality: string;
  /** Roman-numeral label to display. */
  roman: string;
}

export interface ProgressionTemplate {
  key: string;
  label: string;
  genre: string;
  level: Level;
  chords: ProgressionChordSpec[];
}

export interface RealizedChord {
  roman: string;
  /** Concrete chord name, e.g. `Dm7`. */
  name: string;
  rootPc: number;
  /** Chord-tone pitch classes (0–11) for playback. */
  pitchClasses: number[];
}

const D = (degree: number, quality: string, roman: string): ProgressionChordSpec => ({
  degree,
  quality,
  roman,
});

export const PROGRESSION_TEMPLATES: ProgressionTemplate[] = [
  // Pop / folk — beginner
  {
    key: 'pop-axis',
    label: 'I–V–vi–IV',
    genre: 'pop',
    level: 'beginner',
    chords: [D(1, 'major', 'I'), D(5, 'major', 'V'), D(6, 'minor', 'vi'), D(4, 'major', 'IV')],
  },
  {
    key: 'pop-doowop',
    label: 'I–vi–IV–V',
    genre: 'pop',
    level: 'beginner',
    chords: [D(1, 'major', 'I'), D(6, 'minor', 'vi'), D(4, 'major', 'IV'), D(5, 'major', 'V')],
  },
  {
    key: 'pop-sensitive',
    label: 'vi–IV–I–V',
    genre: 'pop',
    level: 'beginner',
    chords: [D(6, 'minor', 'vi'), D(4, 'major', 'IV'), D(1, 'major', 'I'), D(5, 'major', 'V')],
  },
  {
    key: 'folk-145',
    label: 'I–IV–V',
    genre: 'folk',
    level: 'beginner',
    chords: [D(1, 'major', 'I'), D(4, 'major', 'IV'), D(5, 'major', 'V')],
  },
  {
    key: 'folk-1415',
    label: 'I–IV–I–V',
    genre: 'folk',
    level: 'beginner',
    chords: [D(1, 'major', 'I'), D(4, 'major', 'IV'), D(1, 'major', 'I'), D(5, 'major', 'V')],
  },
  // Classical — intermediate
  {
    key: 'classical-cadence',
    label: 'I–ii–V–I',
    genre: 'classical',
    level: 'intermediate',
    chords: [D(1, 'major', 'I'), D(2, 'minor', 'ii'), D(5, 'major', 'V'), D(1, 'major', 'I')],
  },
  // Blues — intermediate
  {
    key: 'blues-12bar',
    label: '12-bar blues',
    genre: 'blues',
    level: 'intermediate',
    chords: [
      D(1, 'dominant-7', 'I7'),
      D(4, 'dominant-7', 'IV7'),
      D(1, 'dominant-7', 'I7'),
      D(1, 'dominant-7', 'I7'),
      D(4, 'dominant-7', 'IV7'),
      D(4, 'dominant-7', 'IV7'),
      D(1, 'dominant-7', 'I7'),
      D(1, 'dominant-7', 'I7'),
      D(5, 'dominant-7', 'V7'),
      D(4, 'dominant-7', 'IV7'),
      D(1, 'dominant-7', 'I7'),
      D(5, 'dominant-7', 'V7'),
    ],
  },
  // Jazz — intermediate → advanced
  {
    key: 'jazz-251',
    label: 'ii–V–I',
    genre: 'jazz',
    level: 'intermediate',
    chords: [D(2, 'minor-7', 'ii7'), D(5, 'dominant-7', 'V7'), D(1, 'major-7', 'Imaj7')],
  },
  {
    key: 'jazz-rhythm',
    label: 'Imaj7–vi7–ii7–V7',
    genre: 'jazz',
    level: 'advanced',
    chords: [
      D(1, 'major-7', 'Imaj7'),
      D(6, 'minor-7', 'vi7'),
      D(2, 'minor-7', 'ii7'),
      D(5, 'dominant-7', 'V7'),
    ],
  },
  {
    key: 'jazz-3625',
    label: 'iii7–vi7–ii7–V7',
    genre: 'jazz',
    level: 'advanced',
    chords: [
      D(3, 'minor-7', 'iii7'),
      D(6, 'minor-7', 'vi7'),
      D(2, 'minor-7', 'ii7'),
      D(5, 'dominant-7', 'V7'),
    ],
  },
  {
    key: 'jazz-turnaround',
    label: 'Imaj7–VI7–ii7–V7 (turnaround)',
    genre: 'jazz',
    level: 'advanced',
    chords: [
      D(1, 'major-7', 'Imaj7'),
      D(6, 'dominant-7', 'VI7'), // secondary dominant (V7/ii)
      D(2, 'minor-7', 'ii7'),
      D(5, 'dominant-7', 'V7'),
    ],
  },
];

/** Genres present in the template set, in a stable display order. */
export const PROGRESSION_GENRES = ['pop', 'folk', 'blues', 'jazz', 'classical'] as const;

/** Render a progression template into a concrete key (root pitch class 0–11). */
export function realizeProgression(
  keyRoot: number,
  template: ProgressionTemplate,
  flats: boolean,
): RealizedChord[] {
  return template.chords.map((c) => {
    const rootPc = (((keyRoot + MAJOR_SCALE[c.degree - 1]) % 12) + 12) % 12;
    const def = CHORDS.find((x) => x.key === c.quality);
    const intervals = def?.intervals ?? [0, 4, 7];
    return {
      roman: c.roman,
      name: `${pitchName(rootPc, flats)}${def?.symbol ?? ''}`,
      rootPc,
      pitchClasses: intervals.map((i) => (((rootPc + i) % 12) + 12) % 12),
    };
  });
}
