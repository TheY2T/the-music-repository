/**
 * A–B loop helper (ADR 0027). The piano player lets the user pick a loop by clicking + dragging across
 * the score: the drag's start and end beats (from `hitTest`, as onset MIDI ticks) become an ordered,
 * beat-precise range — so a loop can begin/end mid-bar, not just on bar lines. The stateful drag lives
 * in the `ScorePlayer` island (mouse refs); this is the one pure bit — ordering the two endpoint ticks
 * — so it stays unit-tested. No React/DOM/engine deps.
 */
import type { LoopSelection } from './score-engine';

/** Order two clicked beat onset ticks into an ordered `{startTick, endTick}` (start ≤ end). */
export function orderTicks(a: number, b: number): LoopSelection {
  return { startTick: Math.min(a, b), endTick: Math.max(a, b) };
}
