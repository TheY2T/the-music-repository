/** Short audio reward cues for drills. Callers gate on the user's (persisted) sound preference. */

import { getAudioContext, scheduleTone } from '../audio';

// A rising C-major triad flourish for a correct answer.
const CHIME_HZ = [523.25, 659.25, 783.99];

/** A quick upward triad flourish. No-op during SSR / without an AudioContext. */
export function playRewardChime(): void {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }
  const now = ctx.currentTime;
  CHIME_HZ.forEach((hz, i) => {
    scheduleTone(hz, now + i * 0.07, 0.18, { type: 'triangle', gain: 0.22 });
  });
}

/** A soft, low, non-punitive cue for a wrong answer. */
export function playWrongCue(): void {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }
  scheduleTone(196, ctx.currentTime, 0.16, { type: 'sine', gain: 0.14 });
}
