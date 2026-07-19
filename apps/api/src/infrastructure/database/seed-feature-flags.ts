import { FlagDefaults, FlagKeys, FlagTargeting } from '@TheY2T/tmr-flags';
import type { Database } from './database.module';
import {
  featureFlagEnvironments,
  featureFlagSettings,
  featureFlags,
  featureFlagVersions,
} from './schema';

/** The environments a fresh deploy boots with. Admins can add/edit more in the CMS thereafter. */
const DEFAULT_ENVIRONMENTS = [
  { key: 'dev', label: 'Development', rank: 0, isDefault: true },
  { key: 'uat', label: 'UAT', rank: 1, isDefault: false },
  { key: 'prod', label: 'Production', rank: 2, isDefault: false },
];

/** A readable seed description from a flag key (admins refine in the CMS). */
function humanize(key: string): string {
  return key.replace(/[.-]/g, ' ');
}

interface SeedCounts {
  environments: number;
  flags: number;
  settings: number;
}

/**
 * Seed the feature-flag registry from the typed `@TheY2T/tmr-flags` registry (ADR 0035). Every code flag
 * becomes a `feature_flags` row plus one `feature_flag_settings` row per environment, initialised
 * identically across environments (admins diverge them later). Idempotent: existing rows are left
 * untouched (never clobbers admin edits) — only missing baseline rows are filled.
 *
 * Per-environment seed semantics: a `true` default seeds enabled/`on`; a `false` default with no targeting
 * seeds disabled (master switch off, e.g. monetization); a flag carrying a targeting rule (e.g.
 * `demo.new-banner`) seeds enabled so the rule evaluates. The per-env version tag is bumped each run so
 * newly-added baseline flags become live.
 */
export async function seedFeatureFlags(db: Database): Promise<SeedCounts> {
  const version = Date.now().toString();

  // 1. Environments
  for (const env of DEFAULT_ENVIRONMENTS) {
    await db
      .insert(featureFlagEnvironments)
      .values(env)
      .onConflictDoNothing({ target: featureFlagEnvironments.key });
  }
  const envRows = await db
    .select({ id: featureFlagEnvironments.id, key: featureFlagEnvironments.key })
    .from(featureFlagEnvironments);

  // 2. Flags (one row per code key)
  const keys = Object.values(FlagKeys);
  const flagRows = keys.map((key) => ({
    key,
    description: humanize(key),
    domain: key.split('.')[0] ?? key,
    flagType: 'boolean',
    defaultValue: FlagDefaults[key],
    source: 'code',
    seeded: true,
  }));
  if (flagRows.length) {
    await db
      .insert(featureFlags)
      .values(flagRows)
      .onConflictDoNothing({ target: featureFlags.key });
  }
  const flagIdRows = await db
    .select({ id: featureFlags.id, key: featureFlags.key })
    .from(featureFlags);
  const flagIdByKey = new Map(flagIdRows.map((row) => [row.key, row.id]));

  // 3. Settings (flag × environment)
  const settingRows = [];
  for (const key of keys) {
    const flagId = flagIdByKey.get(key);
    if (!flagId) continue;
    const def = FlagDefaults[key];
    const targeting = FlagTargeting[key] ?? null;
    const enabled = def === true || targeting !== null;
    const defaultVariant = def ? 'on' : 'off';
    for (const env of envRows) {
      settingRows.push({
        flagId,
        environmentId: env.id,
        enabled,
        defaultVariant,
        variants: { on: true, off: false },
        targeting,
      });
    }
  }
  if (settingRows.length) {
    await db
      .insert(featureFlagSettings)
      .values(settingRows)
      .onConflictDoNothing({
        target: [featureFlagSettings.flagId, featureFlagSettings.environmentId],
      });
  }

  // 4. Version tag per environment (bumped every run so new baseline flags go live)
  for (const env of envRows) {
    await db
      .insert(featureFlagVersions)
      .values({ environmentId: env.id, version })
      .onConflictDoUpdate({
        target: featureFlagVersions.environmentId,
        set: { version, updatedAt: new Date() },
      });
  }

  return { environments: envRows.length, flags: flagRows.length, settings: settingRows.length };
}
