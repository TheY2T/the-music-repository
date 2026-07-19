import { FlagKeys } from '@TheY2T/tmr-flags';
import { evaluateFlag } from '@TheY2T/tmr-flags-eval';
import { join } from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../infrastructure/database/database.module';
import * as schema from '../../infrastructure/database/schema';
import {
  featureFlagEnvironments,
  featureFlagSettings,
  featureFlags,
  featureFlagVersions,
} from '../../infrastructure/database/schema';
import { seedFeatureFlags } from '../../infrastructure/database/seed-feature-flags';
import { DrizzleFeatureFlagCatalogue } from './drizzle-feature-flag-catalogue.adapter';

const MIGRATIONS = join(process.cwd(), 'drizzle');

describe('DrizzleFeatureFlagCatalogue + seed (Testcontainers Postgres)', () => {
  let container: StartedPostgreSqlContainer;
  let client: ReturnType<typeof postgres>;
  let db: Database;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    client = postgres(container.getConnectionUri(), { max: 1 });
    db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    await seedFeatureFlags(db);
  }, 120_000);

  afterAll(async () => {
    await client?.end();
    await container?.stop();
  });

  it('seeds environments, flags and per-environment settings', async () => {
    const envs = await db.select().from(featureFlagEnvironments);
    expect(envs.map((e) => e.key).sort()).toEqual(['dev', 'prod', 'uat']);
    expect(envs.find((e) => e.key === 'dev')?.isDefault).toBe(true);

    const flags = await db.select().from(featureFlags);
    expect(flags.length).toBe(Object.keys(FlagKeys).length);
    // one setting per (flag, env)
    const settings = await db.select().from(featureFlagSettings);
    expect(settings.length).toBe(flags.length * envs.length);
  });

  it('assembles an evaluatable snapshot with flagd-parity semantics', async () => {
    const catalogue = new DrizzleFeatureFlagCatalogue(db);
    const snapshot = await catalogue.snapshot('dev');

    // a normal on flag → true
    expect(evaluateFlag(snapshot, FlagKeys.ToolMetronome, {}, false).value).toBe(true);
    // a deferred off flag (premium) → false
    expect(evaluateFlag(snapshot, FlagKeys.Premium, {}, true).value).toBe(false);
    // demo carries its targeting rule: beta role → on
    expect(evaluateFlag(snapshot, FlagKeys.DemoNewBanner, { roles: ['beta'] }, false).value).toBe(
      true,
    );
    // the admin gate defaults on
    expect(evaluateFlag(snapshot, FlagKeys.FeatureFlags, {}, false).value).toBe(true);
  });

  it('caches by version and re-scans after a change bumps the version', async () => {
    const catalogue = new DrizzleFeatureFlagCatalogue(db);
    const first = await catalogue.snapshot('dev');
    const cached = await catalogue.snapshot('dev');
    expect(cached).toBe(first); // same object reference while the version is unchanged

    // disable tools.metronome for dev + bump the dev version tag
    const [devEnv] = await db
      .select()
      .from(featureFlagEnvironments)
      .where(eq(featureFlagEnvironments.key, 'dev'));
    const [metronome] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.key, FlagKeys.ToolMetronome));
    await db
      .update(featureFlagSettings)
      .set({ enabled: false })
      .where(eq(featureFlagSettings.flagId, metronome?.id ?? ''));
    await db
      .update(featureFlagVersions)
      .set({ version: 'v2' })
      .where(eq(featureFlagVersions.environmentId, devEnv?.id ?? ''));

    const fresh = await catalogue.snapshot('dev');
    expect(fresh).not.toBe(first);
    expect(evaluateFlag(fresh, FlagKeys.ToolMetronome, {}, false).value).toBe(false);
  });

  it('falls back to the default environment for an unknown APP_ENV', async () => {
    const catalogue = new DrizzleFeatureFlagCatalogue(db);
    const snapshot = await catalogue.snapshot('does-not-exist');
    expect(snapshot.environment).toBe('dev'); // resolved to the is_default row
    expect(Object.keys(snapshot.flags).length).toBeGreaterThan(0);
  });

  it('is idempotent — re-seeding does not duplicate rows or clobber edits', async () => {
    const before = await db.select().from(featureFlags);
    await seedFeatureFlags(db);
    const after = await db.select().from(featureFlags);
    expect(after.length).toBe(before.length);
    // the edit from the previous test survives a re-seed
    const catalogue = new DrizzleFeatureFlagCatalogue(db);
    const snapshot = await catalogue.snapshot('dev');
    expect(evaluateFlag(snapshot, FlagKeys.ToolMetronome, {}, false).value).toBe(false);
  });
});
