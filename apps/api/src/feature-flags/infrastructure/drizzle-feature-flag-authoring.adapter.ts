import type { FlagValue, TargetingRule } from '@TheY2T/tmr-flags-eval';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import {
  featureFlagEnvironments,
  featureFlagRevisions,
  featureFlagSettings,
  featureFlags,
  featureFlagVersions,
} from '../../infrastructure/database/schema';
import {
  FeatureFlagAuthoring,
  type FlagImportEntry,
} from '../application/ports/feature-flag-authoring.port';
import type {
  FlagAdminView,
  FlagCreateData,
  FlagQuery,
  FlagRevisionView,
  FlagSettingView,
  FlagSettingWrite,
  FlagUpdateData,
} from '../domain/feature-flag';

type FlagRow = typeof featureFlags.$inferSelect;
type EnvRow = typeof featureFlagEnvironments.$inferSelect;
type SettingRow = typeof featureFlagSettings.$inferSelect;

const DEFAULT_VARIANTS = { on: true, off: false } as const;

/**
 * Write side of feature flags (ADR 0035). Owns flag-registry CRUD, per-environment setting upserts, the
 * append-only revision log, and bulk import. Every write that changes what a snapshot resolves bumps the
 * affected environment's version tag (`feature_flag_versions`) so the read-side caches (API in-process +
 * web HTTP) invalidate. Only this infrastructure layer touches Drizzle (ADR 0012).
 */
@Injectable()
export class DrizzleFeatureFlagAuthoring extends FeatureFlagAuthoring {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  private async allEnvironments(): Promise<EnvRow[]> {
    return this.db
      .select()
      .from(featureFlagEnvironments)
      .where(isNull(featureFlagEnvironments.deletedAt));
  }

  private async bumpVersions(environmentIds: string[]): Promise<void> {
    if (!environmentIds.length) return;
    const version = Date.now().toString();
    for (const environmentId of environmentIds) {
      await this.db
        .insert(featureFlagVersions)
        .values({ environmentId, version })
        .onConflictDoUpdate({
          target: featureFlagVersions.environmentId,
          set: { version, updatedAt: new Date() },
        });
    }
  }

  private async record(
    action: string,
    opts: {
      flagId?: string;
      environmentId?: string;
      before?: unknown;
      after?: unknown;
      actorId?: string;
    },
  ): Promise<void> {
    await this.db.insert(featureFlagRevisions).values({
      flagId: opts.flagId ?? null,
      environmentId: opts.environmentId ?? null,
      action,
      before: opts.before ?? null,
      after: opts.after ?? null,
      actorId: opts.actorId ?? null,
    });
  }

  private toSettingView(setting: SettingRow, envKey: string): FlagSettingView {
    return {
      environmentId: setting.environmentId,
      environmentKey: envKey,
      enabled: setting.enabled,
      defaultVariant: setting.defaultVariant,
      variants: (setting.variants as Record<string, FlagValue>) ?? { ...DEFAULT_VARIANTS },
      targeting: (setting.targeting as TargetingRule | null) ?? null,
    };
  }

  private toFlagView(
    flag: FlagRow,
    settings: SettingRow[],
    envKeyById: Map<string, string>,
  ): FlagAdminView {
    return {
      id: flag.id,
      key: flag.key,
      description: flag.description,
      domain: flag.domain,
      flagType: flag.flagType,
      defaultValue: flag.defaultValue as FlagValue,
      source: flag.source,
      seeded: flag.seeded,
      deleted: flag.deletedAt !== null,
      updatedAt: flag.updatedAt.toISOString(),
      updatedBy: flag.updatedBy ?? undefined,
      settings: settings
        .filter((s) => envKeyById.has(s.environmentId))
        .map((s) => this.toSettingView(s, envKeyById.get(s.environmentId) ?? ''))
        .sort((a, b) => a.environmentKey.localeCompare(b.environmentKey)),
    };
  }

  private async loadViews(flagRows: FlagRow[]): Promise<FlagAdminView[]> {
    if (!flagRows.length) return [];
    const envs = await this.db.select().from(featureFlagEnvironments);
    const envKeyById = new Map(envs.map((e) => [e.id, e.key]));
    const flagIds = flagRows.map((f) => f.id);
    const settings = await this.db
      .select()
      .from(featureFlagSettings)
      .where(inArray(featureFlagSettings.flagId, flagIds));
    const settingsByFlag = new Map<string, SettingRow[]>();
    for (const s of settings) {
      const list = settingsByFlag.get(s.flagId) ?? [];
      list.push(s);
      settingsByFlag.set(s.flagId, list);
    }
    return flagRows.map((flag) =>
      this.toFlagView(flag, settingsByFlag.get(flag.id) ?? [], envKeyById),
    );
  }

  async listFlags(query: FlagQuery): Promise<FlagAdminView[]> {
    const conditions = [];
    if (!query.includeDeleted) conditions.push(isNull(featureFlags.deletedAt));
    if (query.domain) conditions.push(eq(featureFlags.domain, query.domain));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(or(ilike(featureFlags.key, term), ilike(featureFlags.description, term)));
    }
    const rows = await this.db
      .select()
      .from(featureFlags)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(featureFlags.key);
    return this.loadViews(rows);
  }

  async getFlag(id: string): Promise<FlagAdminView | null> {
    const [row] = await this.db.select().from(featureFlags).where(eq(featureFlags.id, id)).limit(1);
    if (!row) return null;
    const [view] = await this.loadViews([row]);
    return view ?? null;
  }

  async existsKey(key: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: featureFlags.id })
      .from(featureFlags)
      .where(eq(featureFlags.key, key))
      .limit(1);
    return Boolean(row);
  }

  async createFlag(data: FlagCreateData): Promise<FlagAdminView> {
    const key = data.key;
    const defaultValue = data.defaultValue ?? false;
    const [flag] = await this.db
      .insert(featureFlags)
      .values({
        key,
        description: data.description ?? '',
        domain: key.split('.')[0] ?? key,
        flagType: 'boolean',
        defaultValue,
        source: 'runtime',
        seeded: false,
        updatedBy: data.editedBy ?? null,
      })
      .returning();
    if (!flag) throw new Error('Failed to create feature flag');

    const envs = await this.allEnvironments();
    if (envs.length) {
      await this.db.insert(featureFlagSettings).values(
        envs.map((env) => ({
          flagId: flag.id,
          environmentId: env.id,
          enabled: defaultValue,
          defaultVariant: defaultValue ? 'on' : 'off',
          variants: { ...DEFAULT_VARIANTS },
          targeting: null,
          updatedBy: data.editedBy ?? null,
        })),
      );
    }
    await this.record('create', {
      flagId: flag.id,
      after: { key, defaultValue },
      actorId: data.editedBy,
    });
    await this.bumpVersions(envs.map((e) => e.id));
    return (await this.getFlag(flag.id)) as FlagAdminView;
  }

  async updateFlag(
    id: string,
    data: FlagUpdateData,
    editedBy?: string,
  ): Promise<FlagAdminView | null> {
    const before = await this.getFlag(id);
    if (!before) return null;
    const patch: Partial<FlagRow> = { updatedAt: new Date(), updatedBy: editedBy ?? null };
    if (data.description !== undefined) patch.description = data.description;
    if (data.defaultValue !== undefined) patch.defaultValue = data.defaultValue;
    await this.db.update(featureFlags).set(patch).where(eq(featureFlags.id, id));
    await this.record('update', { flagId: id, before, after: data, actorId: editedBy });
    return this.getFlag(id);
  }

  async softDelete(id: string, editedBy?: string): Promise<FlagAdminView | null> {
    const before = await this.getFlag(id);
    if (!before || before.deleted) return before;
    await this.db
      .update(featureFlags)
      .set({ deletedAt: new Date(), updatedAt: new Date(), updatedBy: editedBy ?? null })
      .where(eq(featureFlags.id, id));
    await this.record('delete', { flagId: id, before, actorId: editedBy });
    await this.bumpVersions((await this.allEnvironments()).map((e) => e.id));
    return this.getFlag(id);
  }

  async restore(id: string, editedBy?: string): Promise<FlagAdminView | null> {
    const before = await this.getFlag(id);
    if (!before) return null;
    await this.db
      .update(featureFlags)
      .set({ deletedAt: null, updatedAt: new Date(), updatedBy: editedBy ?? null })
      .where(eq(featureFlags.id, id));
    await this.record('restore', { flagId: id, after: { restored: true }, actorId: editedBy });
    await this.bumpVersions((await this.allEnvironments()).map((e) => e.id));
    return this.getFlag(id);
  }

  async upsertSetting(
    flagId: string,
    environmentId: string,
    data: FlagSettingWrite,
    editedBy?: string,
  ): Promise<FlagAdminView | null> {
    const flag = await this.getFlag(flagId);
    if (!flag) return null;
    const existing = flag.settings.find((s) => s.environmentId === environmentId);

    const merged = {
      enabled: data.enabled ?? existing?.enabled ?? false,
      defaultVariant: data.defaultVariant ?? existing?.defaultVariant ?? 'off',
      variants: data.variants ?? existing?.variants ?? { ...DEFAULT_VARIANTS },
      targeting: data.targeting !== undefined ? data.targeting : (existing?.targeting ?? null),
    };

    await this.db
      .insert(featureFlagSettings)
      .values({ flagId, environmentId, ...merged, updatedBy: editedBy ?? null })
      .onConflictDoUpdate({
        target: [featureFlagSettings.flagId, featureFlagSettings.environmentId],
        set: { ...merged, updatedAt: new Date(), updatedBy: editedBy ?? null },
      });
    await this.record('update', {
      flagId,
      environmentId,
      before: existing,
      after: merged,
      actorId: editedBy,
    });
    await this.bumpVersions([environmentId]);
    return this.getFlag(flagId);
  }

  async listRevisions(flagId?: string): Promise<FlagRevisionView[]> {
    const rows = await this.db
      .select({
        id: featureFlagRevisions.id,
        flagId: featureFlagRevisions.flagId,
        environmentId: featureFlagRevisions.environmentId,
        action: featureFlagRevisions.action,
        before: featureFlagRevisions.before,
        after: featureFlagRevisions.after,
        actorId: featureFlagRevisions.actorId,
        createdAt: featureFlagRevisions.createdAt,
        flagKey: featureFlags.key,
        environmentKey: featureFlagEnvironments.key,
      })
      .from(featureFlagRevisions)
      .leftJoin(featureFlags, eq(featureFlags.id, featureFlagRevisions.flagId))
      .leftJoin(
        featureFlagEnvironments,
        eq(featureFlagEnvironments.id, featureFlagRevisions.environmentId),
      )
      .where(flagId ? eq(featureFlagRevisions.flagId, flagId) : undefined)
      .orderBy(desc(featureFlagRevisions.createdAt))
      .limit(500);
    return rows.map((r) => ({
      id: r.id,
      flagId: r.flagId ?? undefined,
      flagKey: r.flagKey ?? undefined,
      environmentId: r.environmentId ?? undefined,
      environmentKey: r.environmentKey ?? undefined,
      action: r.action,
      before: r.before ?? undefined,
      after: r.after ?? undefined,
      actorId: r.actorId ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async importMany(entries: Record<string, FlagImportEntry>, editedBy?: string): Promise<number> {
    const envs = await this.allEnvironments();
    let count = 0;
    for (const [key, entry] of Object.entries(entries)) {
      const variants = (entry.variants as Record<string, FlagValue>) ?? { ...DEFAULT_VARIANTS };
      const defaultVariant = entry.defaultVariant ?? 'off';
      const defaultValue = variants[defaultVariant] ?? false;
      const targeting = (entry.targeting as TargetingRule | null) ?? null;
      const enabled = entry.enabled ?? (defaultVariant === 'on' || targeting !== null);

      const [flag] = await this.db
        .insert(featureFlags)
        .values({
          key,
          description: entry.description ?? key.replace(/[.-]/g, ' '),
          domain: key.split('.')[0] ?? key,
          flagType: 'boolean',
          defaultValue,
          source: 'runtime',
          seeded: false,
          updatedBy: editedBy ?? null,
        })
        .onConflictDoUpdate({
          target: featureFlags.key,
          set: { defaultValue, updatedAt: new Date(), updatedBy: editedBy ?? null },
        })
        .returning({ id: featureFlags.id });
      if (!flag) continue;

      for (const env of envs) {
        await this.db
          .insert(featureFlagSettings)
          .values({
            flagId: flag.id,
            environmentId: env.id,
            enabled,
            defaultVariant,
            variants,
            targeting,
            updatedBy: editedBy ?? null,
          })
          .onConflictDoUpdate({
            target: [featureFlagSettings.flagId, featureFlagSettings.environmentId],
            set: { enabled, defaultVariant, variants, targeting, updatedAt: new Date() },
          });
      }
      count++;
    }
    await this.record('update', { after: { imported: count }, actorId: editedBy });
    await this.bumpVersions(envs.map((e) => e.id));
    return count;
  }
}
