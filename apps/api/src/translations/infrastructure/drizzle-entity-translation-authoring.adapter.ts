import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import {
  entityTranslationRevisions,
  entityTranslations,
} from '../../infrastructure/database/schema';
import { EntityTranslationAuthoring } from '../application/ports/entity-translation-authoring.port';
import type {
  EntityTranslationRevisionView,
  EntityTranslationView,
  TranslationQuery,
  UpsertTranslationData,
} from '../domain/entity-translation';

type Row = typeof entityTranslations.$inferSelect;

function toView(row: Row): EntityTranslationView {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    locale: row.locale,
    field: row.field,
    draftValue: row.draftValue ?? undefined,
    publishedValue: row.publishedValue ?? undefined,
    status: row.status,
    deleted: row.deletedAt !== null,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
  };
}

@Injectable()
export class DrizzleEntityTranslationAuthoring extends EntityTranslationAuthoring {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  private async writeRevision(
    row: Row,
    action: string,
    value: string | null,
    editedBy?: string,
  ): Promise<void> {
    await this.db.insert(entityTranslationRevisions).values({
      translationId: row.id,
      value,
      action,
      editedBy: editedBy ?? null,
    });
  }

  private async findRow(id: string): Promise<Row | undefined> {
    const [row] = await this.db
      .select()
      .from(entityTranslations)
      .where(eq(entityTranslations.id, id))
      .limit(1);
    return row;
  }

  async list(query: TranslationQuery): Promise<EntityTranslationView[]> {
    const conditions = [];
    if (query.entityType) {
      conditions.push(eq(entityTranslations.entityType, query.entityType));
    }
    if (query.entityId) {
      conditions.push(eq(entityTranslations.entityId, query.entityId));
    }
    if (query.locale) {
      conditions.push(eq(entityTranslations.locale, query.locale));
    }
    if (!query.includeDeleted) {
      conditions.push(isNull(entityTranslations.deletedAt));
    }
    const rows = await this.db
      .select()
      .from(entityTranslations)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(entityTranslations.entityId), asc(entityTranslations.field));
    return rows.map(toView);
  }

  async getById(id: string): Promise<EntityTranslationView | null> {
    const row = await this.findRow(id);
    return row ? toView(row) : null;
  }

  async upsertDraft(data: UpsertTranslationData): Promise<EntityTranslationView> {
    const [row] = await this.db
      .insert(entityTranslations)
      .values({
        entityType: data.entityType,
        entityId: data.entityId,
        locale: data.locale,
        field: data.field,
        draftValue: data.value,
        status: 'draft',
        updatedBy: data.editedBy ?? null,
      })
      .onConflictDoUpdate({
        target: [
          entityTranslations.entityType,
          entityTranslations.entityId,
          entityTranslations.locale,
          entityTranslations.field,
        ],
        set: {
          draftValue: data.value,
          status: 'draft',
          deletedAt: null,
          updatedBy: data.editedBy ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    const saved = row as Row;
    await this.writeRevision(saved, 'update', data.value, data.editedBy);
    return toView(saved);
  }

  async softDelete(id: string, editedBy?: string): Promise<EntityTranslationView | null> {
    const existing = await this.findRow(id);
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(entityTranslations)
      .set({ deletedAt: new Date(), updatedBy: editedBy ?? null, updatedAt: new Date() })
      .where(eq(entityTranslations.id, id))
      .returning();
    const deleted = row as Row;
    await this.writeRevision(deleted, 'delete', deleted.draftValue ?? null, editedBy);
    return toView(deleted);
  }

  async restore(id: string, editedBy?: string): Promise<EntityTranslationView | null> {
    const existing = await this.findRow(id);
    if (!existing || existing.deletedAt === null) {
      return null;
    }
    const [row] = await this.db
      .update(entityTranslations)
      .set({ deletedAt: null, updatedBy: editedBy ?? null, updatedAt: new Date() })
      .where(eq(entityTranslations.id, id))
      .returning();
    const restored = row as Row;
    await this.writeRevision(restored, 'restore', restored.draftValue ?? null, editedBy);
    return toView(restored);
  }

  async listRevisions(id: string): Promise<EntityTranslationRevisionView[]> {
    const rows = await this.db
      .select()
      .from(entityTranslationRevisions)
      .where(eq(entityTranslationRevisions.translationId, id))
      .orderBy(desc(entityTranslationRevisions.editedAt));
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      value: row.value ?? undefined,
      editedBy: row.editedBy ?? undefined,
      editedAt: row.editedAt.toISOString(),
    }));
  }

  async publish(entityType?: string, entityId?: string): Promise<number> {
    const conditions = [
      isNull(entityTranslations.deletedAt),
      eq(entityTranslations.status, 'draft'),
    ];
    if (entityType) {
      conditions.push(eq(entityTranslations.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(entityTranslations.entityId, entityId));
    }
    const published = await this.db
      .update(entityTranslations)
      .set({
        publishedValue: sql`${entityTranslations.draftValue}`,
        status: 'published',
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning({ id: entityTranslations.id });
    return published.length;
  }
}
