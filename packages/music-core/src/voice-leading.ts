/**
 * Smooth voice-leading between two chords: hold common tones, move the other voices to the nearest
 * chord tone. Pure + unit-tested; drives the voice-leading viewer.
 */

/** The MIDI note of pitch class `pc` nearest to `ref`. */
export function nearestMidiForPc(ref: number, pc: number): number {
  const base = ref - (((ref % 12) + 12) % 12) + (((pc % 12) + 12) % 12);
  return [base - 12, base, base + 12].reduce((a, b) =>
    Math.abs(b - ref) <= Math.abs(a - ref) ? b : a,
  );
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 1) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

/**
 * Voice the chord whose pitch classes are `toPcs` as smoothly as possible from the sounding voicing
 * `fromMidis`. Equal voice counts → the minimal-total-movement assignment (so common tones stay put and
 * the rest step to the nearest tone). Unequal counts → each target tone at the octave nearest the source
 * centroid, holding any shared tone. Returns MIDI notes, ascending.
 */
export function voiceLead(fromMidis: number[], toPcs: number[]): number[] {
  const targets = [...new Set(toPcs.map((pc) => ((pc % 12) + 12) % 12))];
  if (fromMidis.length === targets.length) {
    let best: number[] = [];
    let bestCost = Number.POSITIVE_INFINITY;
    for (const perm of permutations(targets)) {
      const voices = perm.map((pc, i) => nearestMidiForPc(fromMidis[i], pc));
      const cost = voices.reduce((sum, v, i) => sum + Math.abs(v - fromMidis[i]), 0);
      if (cost < bestCost) {
        bestCost = cost;
        best = voices;
      }
    }
    return best.sort((a, b) => a - b);
  }
  const centroid = Math.round(fromMidis.reduce((a, b) => a + b, 0) / fromMidis.length);
  const byPc = new Map(fromMidis.map((m) => [((m % 12) + 12) % 12, m]));
  return targets.map((pc) => byPc.get(pc) ?? nearestMidiForPc(centroid, pc)).sort((a, b) => a - b);
}

export interface VoiceMove {
  from: number;
  to: number;
  /** Signed semitone motion (0 = common tone held). */
  interval: number;
}

/** Pair each source voice with its nearest destination voice, for drawing the motion. */
export function voiceMoves(fromMidis: number[], toMidis: number[]): VoiceMove[] {
  const remaining = [...toMidis];
  return [...fromMidis]
    .sort((a, b) => a - b)
    .map((from) => {
      let bestIdx = 0;
      for (let i = 1; i < remaining.length; i += 1) {
        if (Math.abs(remaining[i] - from) < Math.abs(remaining[bestIdx] - from)) bestIdx = i;
      }
      const to = remaining.length ? remaining.splice(bestIdx, 1)[0] : from;
      return { from, to, interval: to - from };
    });
}
