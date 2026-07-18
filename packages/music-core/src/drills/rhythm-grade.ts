/** Pure rhythm helpers for the tap-back drill — no Web Audio, unit-testable. */

/** Beat positions of a 16-step (four-beat, sixteenth-grid) pattern where a hit occurs. */
export function patternOnsets(pattern: readonly boolean[]): number[] {
  const onsets: number[] = [];
  for (let i = 0; i < pattern.length; i += 1) {
    if (pattern[i]) {
      onsets.push(i / 4);
    }
  }
  return onsets;
}

export interface RhythmGrade {
  matched: number;
  expected: number;
  /** 0–1: matched onsets over max(onsets, taps) — penalizes both misses and extra taps. */
  accuracy: number;
}

/**
 * Grade tapped beat positions against expected onsets: greedily match each onset to the nearest unused
 * tap within `tolerance` beats. Accuracy is `matched / max(onsets, taps)`, so missing an onset AND
 * tapping spurious extras both cost — yielding the partial credit that maps to a shaky-pass (quality 3).
 */
export function gradeRhythm(
  expected: readonly number[],
  taps: readonly number[],
  tolerance: number,
): RhythmGrade {
  const used = new Set<number>();
  let matched = 0;
  for (const onset of expected) {
    let bestIdx = -1;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < taps.length; i += 1) {
      if (used.has(i)) {
        continue;
      }
      const dist = Math.abs(taps[i] - onset);
      if (dist <= tolerance && dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      used.add(bestIdx);
      matched += 1;
    }
  }
  const denom = Math.max(expected.length, taps.length);
  return { matched, expected: expected.length, accuracy: denom === 0 ? 0 : matched / denom };
}
