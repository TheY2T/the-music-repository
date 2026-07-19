import type { FlagSetting, FlagSnapshot, FlagValue, TargetingRule } from '@TheY2T/tmr-flags-eval';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import {
  featureFlagEnvironments,
  featureFlagSettings,
  featureFlags,
  featureFlagVersions,
} from '../../infrastructure/database/schema';
import {
  FeatureFlagCatalogue,
  type FlagEnvironmentSummary,
} from '../application/ports/feature-flag-catalogue.port';

/** The resolved environment row (matched by key, or the default) that a snapshot is built for. */
interface ResolvedEnvironment {
  id: string;
  key: string;
}

/**
 * Read side of feature flags. For an environment it assembles every live flag's per-environment setting
 * into an evaluatable {@link FlagSnapshot}, and caches it keyed by the environment's version tag: each call
 * reads the tiny `feature_flag_versions` row and only re-scans `feature_flags`/`feature_flag_settings` when
 * the version changed (i.e. after an admin edit) — so the hot evaluation path never full-scans. The adapter
 * is a singleton, so the cache is shared across requests.
 */
@Injectable()
export class DrizzleFeatureFlagCatalogue extends FeatureFlagCatalogue {
  private readonly cache = new Map<string, FlagSnapshot>(); // keyed by environment id

  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  /** Resolve the environment to serve: exact `key` match first, else the `is_default` (non-deleted) row. */
  private async resolveEnvironment(environmentKey: string): Promise<ResolvedEnvironment | null> {
    const rows = await this.db
      .select({
        id: featureFlagEnvironments.id,
        key: featureFlagEnvironments.key,
        isDefault: featureFlagEnvironments.isDefault,
      })
      .from(featureFlagEnvironments)
      .where(
        and(
          isNull(featureFlagEnvironments.deletedAt),
          isNull(featureFlagEnvironments.archivedAt),
          or(
            eq(featureFlagEnvironments.key, environmentKey),
            eq(featureFlagEnvironments.isDefault, true),
          ),
        ),
      );
    // Prefer the exact key match; fall back to the default row.
    return (
      rows.find((row) => row.key === environmentKey) ?? rows.find((row) => row.isDefault) ?? null
    );
  }

  private async versionOfEnvId(environmentId: string): Promise<string> {
    const [row] = await this.db
      .select({ version: featureFlagVersions.version })
      .from(featureFlagVersions)
      .where(eq(featureFlagVersions.environmentId, environmentId))
      .limit(1);
    return row?.version ?? '0';
  }

  async version(environmentKey: string): Promise<string> {
    const env = await this.resolveEnvironment(environmentKey);
    return env ? this.versionOfEnvId(env.id) : '0';
  }

  async snapshot(environmentKey: string): Promise<FlagSnapshot> {
    const env = await this.resolveEnvironment(environmentKey);
    if (!env) {
      return { environment: environmentKey, version: '0', flags: {} };
    }

    const version = await this.versionOfEnvId(env.id);
    const cached = this.cache.get(env.id);
    if (cached && cached.version === version) {
      return cached;
    }

    const rows = await this.db
      .select({
        key: featureFlags.key,
        defaultValue: featureFlags.defaultValue,
        enabled: featureFlagSettings.enabled,
        defaultVariant: featureFlagSettings.defaultVariant,
        variants: featureFlagSettings.variants,
        targeting: featureFlagSettings.targeting,
      })
      .from(featureFlags)
      .innerJoin(
        featureFlagSettings,
        and(
          eq(featureFlagSettings.flagId, featureFlags.id),
          eq(featureFlagSettings.environmentId, env.id),
        ),
      )
      .where(isNull(featureFlags.deletedAt));

    const flags: Record<string, FlagSetting> = {};
    for (const row of rows) {
      flags[row.key] = {
        key: row.key,
        enabled: row.enabled,
        defaultVariant: row.defaultVariant,
        variants: (row.variants as Record<string, FlagValue>) ?? { on: true, off: false },
        targeting: (row.targeting as TargetingRule | null) ?? null,
        defaultValue: row.defaultValue as FlagValue,
      };
    }

    const snapshot: FlagSnapshot = { environment: env.key, version, flags };
    this.cache.set(env.id, snapshot);
    return snapshot;
  }

  async environments(): Promise<FlagEnvironmentSummary[]> {
    return this.db
      .select({
        key: featureFlagEnvironments.key,
        label: featureFlagEnvironments.label,
        rank: featureFlagEnvironments.rank,
        isDefault: featureFlagEnvironments.isDefault,
      })
      .from(featureFlagEnvironments)
      .where(
        and(isNull(featureFlagEnvironments.deletedAt), isNull(featureFlagEnvironments.archivedAt)),
      )
      .orderBy(asc(featureFlagEnvironments.rank));
  }
}
