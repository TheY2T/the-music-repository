import type { FlagSnapshot } from '@TheY2T/tmr-flags-eval';

/** A public summary of a deployable environment (for the snapshot's env picker). */
export interface FlagEnvironmentSummary {
  key: string;
  label: string;
  rank: number;
  isDefault: boolean;
}

/**
 * FeatureFlagCatalogue (ADR 0012) — the read side of feature flags: assemble the evaluatable snapshot for
 * an environment and report its version tag. Named for the capability, no `Port` suffix. Backs both the
 * API's in-process OpenFeature provider and the public `GET /feature-flags/snapshot/:env` endpoint.
 */
export abstract class FeatureFlagCatalogue {
  /**
   * The full evaluatable snapshot for `environmentKey`. Resolution: the environment whose `key` matches,
   * else the `is_default` environment; if neither exists an empty snapshot (version '0') is returned so
   * the provider falls back to code defaults. Cached in memory keyed by the environment's version tag.
   */
  abstract snapshot(environmentKey: string): Promise<FlagSnapshot>;

  /** The current version tag for `environmentKey` (the ETag / cache-bust signal), or '0' if none. */
  abstract version(environmentKey: string): Promise<string>;

  /** The active (non-deleted, non-archived) environments, ordered by rank. */
  abstract environments(): Promise<FlagEnvironmentSummary[]>;
}
