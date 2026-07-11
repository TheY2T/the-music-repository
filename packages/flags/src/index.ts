/**
 * @TheY2T/tmr-flags — the single source of truth for feature-flag keys and the evaluation
 * context shape, imported by both the API (server-side) and the web app (SSR + browser islands)
 * so that OpenFeature targeting rules evaluate identically everywhere.
 */

/**
 * Canonical evaluation context. Built from the authenticated session in three places
 * (NestJS contextFactory, Astro middleware, browser `OpenFeature.setContext`) and kept in sync.
 */
export interface FlagEvaluationContext {
  /** Stable bucketing key for percentage rollouts — user id, or an anonymous/session id. */
  targetingKey?: string;
  email?: string;
  roles?: string[];
}

/** Flag key registry. Naming convention: `<domain>.<capability>`. */
export const FlagKeys = {
  /** Phase 0 demo flag — proves the OpenFeature round-trip across API + web. */
  DemoNewBanner: 'demo.new-banner',
  /** Slice 2a — surfaces auth entry points (sign-in, account) in the web app. */
  AuthEnabled: 'auth.enabled',
  /** Slice 2b — gates the admin authoring CMS (`/admin` content management). */
  AdminCms: 'admin.cms',
  /** Slice 2c — gates favorites (heart toggles + My favorites page). */
  Favorites: 'personalization.favorites',
  /** Phase 2 — gates collections (courses / learning paths) browse + admin. */
  Collections: 'learning.collections',
  /** Phase 2 — gates progress tracking (completion, streaks, dashboard). */
  Progress: 'learning.progress',
  /** Phase 2 — gates the Info View contextual helper (help topics on hover/focus). */
  InfoView: 'learning.info-view',
  /** Phase 3 — interactive piano keyboard tool. */
  ToolKeyboard: 'tools.keyboard',
  /** Phase 3 — circle of fifths explorer tool. */
  ToolCircleOfFifths: 'tools.circle-of-fifths',
  /** Phase 3 — interactive guitar fretboard tool. */
  ToolFretboard: 'tools.fretboard',
  /** Phase 3 — chord builder tool. */
  ToolChords: 'tools.chords',
  /** Phase 3 — scale explorer tool. */
  ToolScaleExplorer: 'tools.scale-explorer',
  /** Phase 3 — reverse chord identifier tool. */
  ToolChordId: 'tools.chord-id',
  /** Phase 3 — mode explorer tool. */
  ToolModes: 'tools.modes',
  /** Phase 3 — Roman-numeral progression builder tool. */
  ToolProgression: 'tools.progression',
} as const;

export type FlagKey = (typeof FlagKeys)[keyof typeof FlagKeys];

/** Fallback values used when the flag provider is unreachable. */
export const FlagDefaults = {
  [FlagKeys.DemoNewBanner]: false,
  [FlagKeys.AuthEnabled]: true,
  [FlagKeys.AdminCms]: true,
  [FlagKeys.Favorites]: true,
  [FlagKeys.Collections]: true,
  [FlagKeys.Progress]: true,
  [FlagKeys.InfoView]: true,
  [FlagKeys.ToolKeyboard]: true,
  [FlagKeys.ToolCircleOfFifths]: true,
  [FlagKeys.ToolFretboard]: true,
  [FlagKeys.ToolChords]: true,
  [FlagKeys.ToolScaleExplorer]: true,
  [FlagKeys.ToolChordId]: true,
  [FlagKeys.ToolModes]: true,
  [FlagKeys.ToolProgression]: true,
} satisfies Record<FlagKey, boolean>;
