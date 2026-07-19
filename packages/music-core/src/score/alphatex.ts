/**
 * Pure `notes → alphaTex` generators (ADR 0027). The interactive tools generate alphaTex from their
 * note/fret data and render it through alphaTab. These helpers turn a tool's normalized data into
 * alphaTex text; no DOM/audio/alphaTab deps, so they're unit-tested.
 *
 * alphaTex primer used here: a beat is `<note>.<duration>` (e.g. `c4.4` = quarter middle-C), duration
 * numbers are 1=whole 2=half 4=quarter 8=eighth 16=16th 32=32nd; a dot adds `{d}`; a rest is `r`; bars
 * are separated by `|`. Pitched notes are `tone[accidental]octave` (`c4`, `c#4`, `bb3`); fretted notes
 * are `fret.string`.
 */

/** One melody event: a pitch name (e.g. `C#4`, `Bb3`) or null for a rest, lasting `beats` quarters. */
export interface MelodyNote {
  name: string | null;
  beats: number;
}

/** One fretted step for a tab line. Effects mirror the lick library's vocabulary. */
export interface TabStep {
  string: number; // 1 = highest string
  fret: number;
  beats?: number; // quarters; defaults to 1
  bend?: boolean;
  slideTo?: number; // fret to slide into
  hammerTo?: number; // legato hammer-on / pull-off target fret
}

export interface AlphaTexScoreOptions {
  title?: string;
  tempo?: number;
  /** Time-signature numerator (beats per bar, in quarters). Default 4. */
  beatsPerBar?: number;
  /** alphaTex key signature token, e.g. `c`, `g`, `f`, `d` (major) — default `c`. */
  key?: string;
  /** alphaTex clef: `g2` (treble, default), `f4` (bass), `c3`, `c4`, `neutral`. */
  clef?: string;
  /** Per-note text under the staff (note names, solfège, scale degrees). One entry per melody note. */
  lyrics?: string[];
}

/** Map a duration in quarter-note beats → an alphaTex duration number + whether it's dotted. */
export function beatsToDuration(beats: number): { duration: number; dotted: boolean } {
  // Try each base duration (whole..32nd) as plain then dotted, pick the closest match.
  const bases = [1, 2, 4, 8, 16, 32];
  let best = { duration: 4, dotted: false, err: Infinity };
  for (const d of bases) {
    const plain = 4 / d; // quarters for this duration
    for (const dotted of [false, true]) {
      const value = dotted ? plain * 1.5 : plain;
      const err = Math.abs(value - beats);
      if (err < best.err) best = { duration: d, dotted, err };
    }
  }
  return { duration: best.duration, dotted: best.dotted };
}

const SHARP_TEX = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const FLAT_TEX = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];

/** Convert a MIDI note to an alphaTex pitch token (`c4`, `f#4`, `bb3`), spelled with flats when asked. */
export function midiToAlphaTexPitch(midi: number, flats = false): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${(flats ? FLAT_TEX : SHARP_TEX)[midi % 12]}${octave}`;
}

/** Convert a pitch name like `C#4`/`Bb3`/`F4` to an alphaTex pitch token (`c#4`/`bb3`/`f4`). */
export function toAlphaTexPitch(name: string): string {
  const match = name.trim().match(/^([A-Ga-g])([#b]*)(-?\d+)$/);
  if (!match) return name.toLowerCase();
  const [, letter, accidentals, octave] = match;
  return `${letter.toLowerCase()}${accidentals}${octave}`;
}

const LETTER_PC: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** Convert a pitch name (`C4`, `F#3`, `Bb5`) to a MIDI number, or null if unparseable. */
export function noteNameToMidi(name: string): number | null {
  const match = name.trim().match(/^([A-Ga-g])([#b]*)(-?\d+)$/);
  if (!match) return null;
  const [, letter, accidentals, octave] = match;
  let pc = LETTER_PC[letter.toLowerCase()];
  for (const a of accidentals) pc += a === '#' ? 1 : -1;
  return pc + (Number(octave) + 1) * 12;
}

function header(opts: AlphaTexScoreOptions, trackName: string, staffMeta: string): string {
  const lines = [
    opts.title ? `\\title "${opts.title}"` : '',
    `\\tempo ${opts.tempo ?? 100}`,
    '.',
    `\\track "${trackName}"`,
    `  ${staffMeta}`,
    `  \\ts (${opts.beatsPerBar ?? 4} 4)`,
    opts.key ? `  \\ks ${opts.key}` : '',
    opts.clef ? `  \\clef ${opts.clef}` : '',
    opts.lyrics?.length ? `  \\lyrics "${opts.lyrics.join(' ')}"` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

/** Emit `|` bar separators as beats accumulate past each bar. */
function withBars(beats: number[], tokens: string[], beatsPerBar: number): string {
  const out: string[] = [];
  let acc = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    out.push(tokens[i]);
    acc += beats[i];
    if (acc >= beatsPerBar - 1e-6 && i < tokens.length - 1) {
      out.push('|');
      acc = 0;
    }
  }
  return out.join(' ');
}

/** Build alphaTex for a single-voice pitched melody (piano/vocal-style staff notation). */
export function melodyToAlphaTex(notes: MelodyNote[], opts: AlphaTexScoreOptions = {}): string {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const beats = notes.map((n) => n.beats);
  const tokens = notes.map((n) => {
    const { duration, dotted } = beatsToDuration(n.beats);
    const head = n.name ? toAlphaTexPitch(n.name) : 'r';
    return `${head}.${duration}${dotted ? '{d}' : ''}`;
  });
  const body = withBars(beats, tokens, beatsPerBar);
  return `${header(opts, opts.title ?? 'Melody', '\\staff{score} \\tuning piano')}\n  ${body} |`;
}

/** Build alphaTex for a pitchless rhythm — the beats are rendered on a single fixed staff pitch. */
export function rhythmToAlphaTex(beats: number[], opts: AlphaTexScoreOptions = {}): string {
  return melodyToAlphaTex(
    beats.map((b) => ({ name: 'G4', beats: b })),
    { title: 'Rhythm', ...opts },
  );
}

/** Build alphaTex for a guitar tab line from fret/string steps (bends/slides/hammers supported). */
export function tabToAlphaTex(
  steps: TabStep[],
  tuning: number[],
  opts: AlphaTexScoreOptions = {},
): string {
  const beatsPerBar = opts.beatsPerBar ?? 4;
  const beats = steps.map((s) => s.beats ?? 1);
  const tokens = steps.map((s) => {
    const { duration, dotted } = beatsToDuration(s.beats ?? 1);
    const effects: string[] = [];
    if (s.bend) effects.push('b (0 4 4)');
    if (s.slideTo != null) effects.push('sl');
    if (s.hammerTo != null) effects.push('h');
    if (dotted) effects.push('d');
    const eff = effects.length ? `{${effects.join(' ')}}` : '';
    // Fretted notes are `fret.string`; the duration is a `:N` prefix (a suffix `.N` would be ambiguous).
    return `:${duration} ${s.fret}.${s.string}${eff}`;
  });
  const body = withBars(beats, tokens, beatsPerBar);
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const tuningStr = tuning.map((m) => `${names[m % 12]}${Math.floor(m / 12) - 1}`).join(' ');
  const staffMeta = `\\staff{tabs score} \\tuning (${tuningStr})`;
  return `${header(opts, opts.title ?? 'Tab', staffMeta)}\n  ${body} |`;
}
