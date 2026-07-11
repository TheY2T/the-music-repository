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
} as const;

export type FlagKey = (typeof FlagKeys)[keyof typeof FlagKeys];

/** Fallback values used when the flag provider is unreachable. */
export const FlagDefaults = {
  [FlagKeys.DemoNewBanner]: false,
  [FlagKeys.AuthEnabled]: true,
  [FlagKeys.AdminCms]: true,
  [FlagKeys.Favorites]: true,
} satisfies Record<FlagKey, boolean>;
