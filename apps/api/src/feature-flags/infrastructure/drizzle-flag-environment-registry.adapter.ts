import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import {
  featureFlagEnvironments,
  featureFlagRevisions,
  featureFlagSettings,
  featureFlags,
  featureFlagVersions,
} from '../../infrastructure/database/schema';
import { FlagEnvironmentRegistry } from '../application/ports/flag-environment-registry.port';
import type { EnvironmentView, EnvironmentWrite } from '../domain/feature-flag';

type EnvRow = typeof featureFlagEnvironments.$inferSelect;

const DEFAULT_VARIANTS = { on: true, off: false } as const;

/**
 * CRUD for the deployable environments (ADR 0035). Creating an environment backfills a setting row for
 * every existing flag (initially disabled) so the environment is immediately evaluatable, and stamps its
 * version tag. Only this infrastructure layer touches Drizzle (ADR 0012).
 */
@Injectable()
export class DrizzleFlagEnvironmentRegistry extends FlagEnvironmentRegistry {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  private toView(row: EnvRow): EnvironmentView {
    return {
      id: row.id,
      key: row.key,
      label: row.label,
      rank: row.rank,
      isDefault: row.isDefault,
      archived: row.archivedAt !== null,
      deleted: row.deletedAt !== null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async record(action: string, environmentId: string, after: unknown, actorId?: string) {
    await this.db
      .insert(featureFlagRevisions)
      .values({ environmentId, action, after: after ?? null, actorId: actorId ?? null });
  }

  /** Ensure only `keepId` is flagged as the default (a single default environment). */
  private async clearOtherDefaults(keepId: string): Promise<void> {
    await this.db
      .update(featureFlagEnvironments)
      .set({ isDefault: false })
      .where(
        and(ne(featureFlagEnvironments.id, keepId), eq(featureFlagEnvironments.isDefault, true)),
      );
  }

  async list(includeInactive = false): Promise<EnvironmentView[]> {
    const rows = await this.db
      .select()
      .from(featureFlagEnvironments)
      .where(includeInactive ? undefined : isNull(featureFlagEnvironments.deletedAt))
      .orderBy(featureFlagEnvironments.rank);
    return rows.map((r) => this.toView(r));
  }

  async getByKey(key: string): Promise<EnvironmentView | null> {
    const [row] = await this.db
      .select()
      .from(featureFlagEnvironments)
      .where(and(eq(featureFlagEnvironments.key, key), isNull(featureFlagEnvironments.deletedAt)))
      .limit(1);
    return row ? this.toView(row) : null;
  }

  async create(data: EnvironmentWrite, editedBy?: string): Promise<EnvironmentView> {
    const [env] = await this.db
      .insert(featureFlagEnvironments)
      .values({
        key: data.key ?? '',
        label: data.label ?? data.key ?? '',
        rank: data.rank ?? 0,
        isDefault: data.isDefault ?? false,
        updatedBy: editedBy ?? null,
      })
      .returning();
    if (!env) throw new Error('Failed to create environment');
    if (env.isDefault) await this.clearOtherDefaults(env.id);

    // Backfill a setting for every existing flag so the environment is immediately evaluatable.
    const flags = await this.db
      .select({ id: featureFlags.id, defaultValue: featureFlags.defaultValue })
      .from(featureFlags);
    if (flags.length) {
      await this.db.insert(featureFlagSettings).values(
        flags.map((flag) => ({
          flagId: flag.id,
          environmentId: env.id,
          enabled: false,
          defaultVariant: 'off',
          variants: { ...DEFAULT_VARIANTS },
          targeting: null,
          updatedBy: editedBy ?? null,
        })),
      );
    }
    await this.db
      .insert(featureFlagVersions)
      .values({ environmentId: env.id, version: Date.now().toString() })
      .onConflictDoNothing({ target: featureFlagVersions.environmentId });
    await this.record('env-create', env.id, { key: env.key }, editedBy);
    return this.toView(env);
  }

  async update(
    id: string,
    data: EnvironmentWrite,
    editedBy?: string,
  ): Promise<EnvironmentView | null> {
    const [existing] = await this.db
      .select()
      .from(featureFlagEnvironments)
      .where(eq(featureFlagEnvironments.id, id))
      .limit(1);
    if (!existing) return null;

    const patch: Partial<EnvRow> = { updatedAt: new Date(), updatedBy: editedBy ?? null };
    if (data.label !== undefined) patch.label = data.label;
    if (data.rank !== undefined) patch.rank = data.rank;
    if (data.isDefault !== undefined) patch.isDefault = data.isDefault;
    if (data.archived !== undefined) patch.archivedAt = data.archived ? new Date() : null;

    await this.db
      .update(featureFlagEnvironments)
      .set(patch)
      .where(eq(featureFlagEnvironments.id, id));
    if (data.isDefault) await this.clearOtherDefaults(id);
    await this.record('env-update', id, data, editedBy);

    const [row] = await this.db
      .select()
      .from(featureFlagEnvironments)
      .where(eq(featureFlagEnvironments.id, id))
      .limit(1);
    return row ? this.toView(row) : null;
  }

  async softDelete(id: string, editedBy?: string): Promise<EnvironmentView | null> {
    const [existing] = await this.db
      .select()
      .from(featureFlagEnvironments)
      .where(eq(featureFlagEnvironments.id, id))
      .limit(1);
    if (!existing) return null;
    await this.db
      .update(featureFlagEnvironments)
      .set({ deletedAt: new Date(), updatedAt: new Date(), updatedBy: editedBy ?? null })
      .where(eq(featureFlagEnvironments.id, id));
    await this.record('env-delete', id, null, editedBy);
    return this.toView({ ...existing, deletedAt: new Date() });
  }
}
