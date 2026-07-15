/**
 * Contract for the interactive score player (ADR 0027). alphaTab is now the SINGLE engine — it renders
 * both standard notation (piano grand staff) and tablature (guitar) and owns its own synth, cursor, and
 * A–B loop — so this interface is a thin, testable seam the `ScorePlayer` shell drives imperatively.
 * The engine implementation (`alphatab-engine.ts`) is E2E-tested only (Web Worker + AudioWorklet don't
 * run under happy-dom); the pure decision/loop helpers live in `loop.ts` / `loop-selection.ts`.
 */
import type { AlphaTabResources } from './use-alphatab-theme';

/** How a score is engraved: `standard` = notation only (piano grand staff); `tab` = alphaTab's default
 * score+tab guitar view. Chosen from the score's instruments by `resolveDisplayMode` in `loop.ts`. */
export type ScoreDisplayMode = 'standard' | 'tab';

/** What a click on the rendered score resolves to (piano interactive mode). */
export interface ScoreHit {
  /** MIDI pitch of the clicked note, for click-to-hear. */
  midi?: number;
  /** The clicked beat's onset in MIDI ticks — used for click-to-seek and beat-precise A–B loops. */
  tick?: number;
  /** Zero-based index of the bar the click landed in — for the human-readable loop readout. */
  bar?: number;
}

/**
 * A beat-precise A–B loop: the onset ticks of the first + last beats it spans (ordered, inclusive).
 * These are exact beat positions, so a loop can start/end mid-bar — not snapped to whole bars.
 */
export interface LoopSelection {
  startTick: number;
  endTick: number;
}

/** Result of loading a score: total playback length, notated tempo, and bar count (for section UI). */
export interface ScoreLoadResult {
  durationMs: number;
  baseBpm: number;
  barCount: number;
}

/** Per-mount engine options. */
export interface ScoreEngineOptions {
  mode: ScoreDisplayMode;
  /** Theme-derived notation colors (see {@link AlphaTabResources}). */
  resources: AlphaTabResources;
  /** For `tab` mode: open-string MIDI pitches to render the (pitched) staff as tablature. Null → the
   * source's own notation (a stringed alphaTex renders tab natively; a pitched one stays on a staff). */
  tuning?: number[] | null;
}

/**
 * The transport + interaction surface the shell drives. Constructed per mounted score, `load`ed once,
 * `destroy`ed on unmount. Position/duration are milliseconds; loops are MIDI ticks (alphaTab-native).
 */
export interface ScoreEngine {
  /**
   * Render + prepare a score. `source` is either alphaTex (the canonical format) or the raw text of a
   * file alphaTab can import (MusicXML/GuitarPro) — the engine sniffs which. Resolves once rendered +
   * the player is ready.
   */
  load(container: HTMLElement, source: string, opts: ScoreEngineOptions): Promise<ScoreLoadResult>;
  destroy(): void;

  // --- transport ---
  play(): void;
  pause(): void;
  stop(): void;
  /** Seek by score time (scrub bar). */
  seekMs(ms: number): void;
  /** Seek by beat onset tick (click-to-seek). */
  seekTick(tick: number): void;
  setTempoFactor(factor: number): void;
  /** Draw the selection overlay for a beat range WITHOUT bounding playback (live feedback while
   * dragging), or clear it. */
  highlightRange(loop: LoopSelection | null): void;
  /** Bound playback to a beat range and cue the cursor at its start (Play then plays the passage and,
   * unless looping, stops at its end). Looping is toggled separately via {@link setLooping}. */
  applyRange(loop: LoopSelection): void;
  /** Turn repeat on/off for the currently-bounded range (or the whole piece). */
  setLooping(on: boolean): void;
  /** Clear any bounded range + repeat (back to playing the whole piece). */
  clearRange(): void;
  /** Loop the whole piece (no selection). */
  loopWhole(): void;
  setMetronome(on: boolean): void;
  setCountIn(on: boolean): void;
  /** Open the browser print dialog for the whole score (print-to-PDF). */
  print(): void;

  // --- interaction ---
  /** Sound a single pitch immediately (click-to-hear), via the shared sampled note service. */
  playNote(midi: number): void;
  /** Resolve a click to the beat under the pointer, or null. */
  hitTest(clientX: number, clientY: number): ScoreHit | null;
  /** Re-apply theme notation colors (on aesthetic/dark-mode switch) and re-render. */
  applyResources(resources: AlphaTabResources): void;

  // --- events ---
  onPosition(cb: (positionMs: number, durationMs: number) => void): void;
  onState(cb: (playing: boolean) => void): void;
  onReady(cb: () => void): void;
  onEnded(cb: () => void): void;
}
