/**
 * Taxonomy for the /tools browser — groups the interactive tools into six categories and maps each
 * to its Icon-atom name. Pure + framework-free so it can be unit-tested and used from the `.astro`
 * page. The `ToolsBrowser` island stays presentational (it receives resolved category on each tool).
 */

export const TOOL_CATEGORY_ORDER = [
  'keyboard-fretboard',
  'theory-harmony',
  'ear-quizzes',
  'rhythm-time',
  'reading-notation',
  'play-practice',
] as const;
export type ToolCategory = (typeof TOOL_CATEGORY_ORDER)[number];

/** Which category each tool slug belongs to. */
const CATEGORY_BY_SLUG: Record<string, ToolCategory> = {
  // Keyboard & Fretboard
  keyboard: 'keyboard-fretboard',
  fretboard: 'keyboard-fretboard',
  'chord-diagrams': 'keyboard-fretboard',
  caged: 'keyboard-fretboard',
  'scale-boxes': 'keyboard-fretboard',
  voicings: 'keyboard-fretboard',
  soundfont: 'keyboard-fretboard',
  'scale-map': 'keyboard-fretboard',
  // Theory & Harmony
  'circle-of-fifths': 'theory-harmony',
  'scale-explorer': 'theory-harmony',
  chords: 'theory-harmony',
  'chord-identifier': 'theory-harmony',
  modes: 'theory-harmony',
  progression: 'theory-harmony',
  intervals: 'theory-harmony',
  analyzer: 'theory-harmony',
  transposer: 'theory-harmony',
  improvise: 'theory-harmony',
  'progression-generator': 'theory-harmony',
  // Ear Training & Quizzes
  'ear-trainer': 'ear-quizzes',
  'progression-ear': 'ear-quizzes',
  'chord-quality-ear': 'ear-quizzes',
  'fret-quiz': 'ear-quizzes',
  'fret-game': 'ear-quizzes',
  'melodic-dictation': 'ear-quizzes',
  'rhythm-dictation': 'ear-quizzes',
  solfege: 'ear-quizzes',
  'key-quiz': 'ear-quizzes',
  'interval-quiz': 'ear-quizzes',
  // Rhythm & Time
  metronome: 'rhythm-time',
  tuner: 'rhythm-time',
  sequencer: 'rhythm-time',
  rhythm: 'rhythm-time',
  grooves: 'rhythm-time',
  // Reading & Notation
  staff: 'reading-notation',
  'sight-reading': 'reading-notation',
  player: 'reading-notation',
  musicxml: 'reading-notation',
  'multi-voice': 'reading-notation',
  score: 'reading-notation',
  // Play-Along & Practice
  'backing-track': 'play-practice',
  licks: 'play-practice',
  strumming: 'play-practice',
  fingerpicking: 'play-practice',
  arpeggio: 'play-practice',
  'progression-player': 'play-practice',
  song: 'play-practice',
  'practice-player': 'play-practice',
  'practice-room': 'play-practice',
  bassline: 'play-practice',
};

/**
 * The category a tool belongs to. Unknown slugs fall back to `play-practice` so a newly-added tool
 * still shows up in the browser even before it's classified here.
 */
export function categoryOf(slug: string): ToolCategory {
  return CATEGORY_BY_SLUG[slug] ?? 'play-practice';
}

/** Icon-atom name per tool (falls back to `music`). Purely presentational. */
export const TOOL_ICON: Record<string, string> = {
  keyboard: 'piano',
  fretboard: 'guitar',
  'circle-of-fifths': 'disc',
  'scale-explorer': 'music',
  chords: 'piano',
  'chord-identifier': 'search',
  modes: 'music',
  progression: 'list-music',
  metronome: 'clock',
  tuner: 'volume',
  intervals: 'music',
  staff: 'book-open',
  'ear-trainer': 'headphones',
  sequencer: 'sliders',
  'sight-reading': 'book-open',
  'backing-track': 'play',
  voicings: 'piano',
  player: 'play',
  licks: 'guitar',
  'chord-diagrams': 'guitar',
  strumming: 'guitar',
  fingerpicking: 'guitar',
  arpeggio: 'music',
  'progression-player': 'play',
  rhythm: 'clock',
  caged: 'guitar',
  'scale-boxes': 'guitar',
  song: 'music',
  'progression-ear': 'headphones',
  'chord-quality-ear': 'headphones',
  'fret-quiz': 'guitar',
  'fret-game': 'clock',
  musicxml: 'book-open',
  'multi-voice': 'book-open',
  'practice-player': 'play',
  analyzer: 'chart',
  transposer: 'sliders',
  improvise: 'sparkles',
  'progression-generator': 'list-music',
  bassline: 'music',
  'melodic-dictation': 'headphones',
  'rhythm-dictation': 'headphones',
  grooves: 'disc',
  solfege: 'music',
  'key-quiz': 'graduation-cap',
  'interval-quiz': 'graduation-cap',
  'practice-room': 'gauge',
  score: 'book-open',
  soundfont: 'volume',
  'scale-map': 'layout-grid',
};

/** Case-insensitive substring match of a query over a tool's title + summary. */
export function toolMatches(query: string, title: string, summary: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return `${title} ${summary}`.toLowerCase().includes(q);
}
