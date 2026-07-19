/**
 * The evaluatable flag snapshot — the DB-derived, environment-scoped payload the provider evaluates
 * against. Produced by the API (`FeatureFlagCatalogue` read port) for its own in-process provider and
 * served over HTTP (`GET /feature-flags/snapshot/:env`) for the web SSR provider, so both evaluate
 * identically. Pure data — no OpenFeature / Drizzle imports so it can cross the api↔web boundary as JSON.
 */

/** A JSON-serialisable flag value. Boolean flags carry booleans; the shape is variant-ready for later. */
export type FlagValue = boolean | string | number | { [key: string]: FlagValue } | FlagValue[];

/**
 * A targeting rule (a JSONLogic expression). `null` = no targeting; the flag resolves to `defaultVariant`.
 * Kept as opaque JSON so any authored rule passes through unchanged.
 */
export type TargetingRule = Record<string, unknown>;

/** One flag's fully-resolved configuration for a single environment. */
export interface FlagSetting {
  key: string;
  /** Admin master switch for this environment. `false` ⇒ the feature is off (resolves the `off` variant). */
  enabled: boolean;
  /** Variant returned when enabled and no targeting rule matches (e.g. `'on'`). */
  defaultVariant: string;
  /** Named variant → value map (e.g. `{ on: true, off: false }`). */
  variants: Record<string, FlagValue>;
  /** Optional targeting rule evaluated when `enabled` is true; `null` ⇒ use `defaultVariant`. */
  targeting: TargetingRule | null;
  /** Code-registry fallback (`FlagDefaults[key]`) used if a variant can't be resolved. */
  defaultValue: FlagValue;
}

/** The full set of flags for one environment plus its version tag (the ETag / cache-bust signal). */
export interface FlagSnapshot {
  environment: string;
  version: string;
  flags: Record<string, FlagSetting>;
}

/** Convention variant names. A disabled flag resolves `OFF`; `variants` normally contains both. */
export const VARIANT_ON = 'on';
export const VARIANT_OFF = 'off';
