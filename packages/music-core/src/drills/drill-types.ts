/**
 * Drill engine — the portable, framework-free core (no React, no Web Audio).
 *
 * A drill is a set of `cards` (a stable universe of question keys the SM-2 scheduler tracks) plus a
 * `DrillItemGenerator` that turns a card into a presentable `DrillItem` and objectively `check`s a
 * learner's response. Generators stay pure: a presentation describes *what* to show/play (note events,
 * a staff step, a fret) and the React session interprets it with the audio/notation layers. This keeps
 * every generator unit-testable with a deterministic `rng`.
 */

import type { Level } from '../music-theory';

/** How the learner responds — the answer-input surface the session renders. */
export type AnswerModality =
  | 'multiple-choice' // pick from labelled options
  | 'play-instrument' // click/play the keyboard or fretboard (or MIDI)
  | 'ear-identify' // listen, then pick/name (audio-first multiple choice)
  | 'pitch-mic' // sing/play an acoustic instrument → pitch detection
  | 'rhythm-tap'; // tap in time, graded on timing

/** A single note to sound as part of an audio prompt. `atMs` is relative to the start of playback. */
export interface NoteEvent {
  midi: number;
  atMs: number;
  durationMs: number;
  /** 0–1; defaults applied by the player. */
  velocity?: number;
}

/** How to present the question. The session switches on `kind`. */
export type DrillPresentation =
  | { kind: 'audio'; notes: NoteEvent[] }
  | { kind: 'staff'; clef: 'treble' | 'bass'; step: number }
  | { kind: 'text'; prompt: string; help?: string }
  | { kind: 'fretboard'; string: number; fret: number }
  | { kind: 'rhythm'; pattern: boolean[]; bpm: number };

/** A selectable answer for multiple-choice / ear-identify drills. */
export interface DrillOption {
  value: string;
  label: string;
}

/** One concrete question instance produced by a generator. */
export interface DrillItem<TAnswer = unknown> {
  /** Stable card key for SM-2 scheduling (maps to `review_cards.card`). */
  card: string;
  modality: AnswerModality;
  level: Level;
  presentation: DrillPresentation;
  /** Machine-checkable expected answer, consumed by `check`. */
  expected: TAnswer;
  /** Options for multiple-choice / ear-identify. */
  options?: DrillOption[];
  /** Human-readable answer, revealed after the response. */
  answerLabel: string;
}

/** The objective outcome of a response. `accuracy` is 0–1 so timing drills can award partial credit. */
export interface AttemptScore {
  accuracy: number;
  correct: boolean;
  detail?: string;
}

/**
 * A drill deck: owns generation + objective checking for one skill. Pure — no React, no audio.
 * `generate` takes an injected `rng` so tests are deterministic; the session passes `Math.random`.
 */
export interface DrillItemGenerator<TAnswer = unknown> {
  /** Deck key — the SM-2 `deck` column. MUST stay stable across releases. */
  deck: string;
  modality: AnswerModality;
  /** The stable universe of card keys (SM-2 needs this fixed per deck). */
  cards: string[];
  generate(card: string, level: Level, rng: () => number): DrillItem<TAnswer>;
  check(item: DrillItem<TAnswer>, response: TAnswer): AttemptScore;
}

/** Pick a random element using an injected `rng` (0 ≤ rng() < 1). */
export function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

/** Random integer in `[min, max)` using an injected `rng`. */
export function randomInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min));
}
