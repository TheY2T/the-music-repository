import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { i18nVersions, uiMessageRevisions, uiMessages } from '../../infrastructure/database/schema';
import { UiMessageAuthoring } from '../application/ports/ui-message-authoring.port';
import type {
  UiMessageCreateData,
  UiMessageQuery,
  UiMessageRevisionView,
  UiMessageView,
} from '../domain/ui-message';

type UiMessageRow = typeof uiMessages.$inferSelect;

function toView(row: UiMessageRow): UiMessageView {
  return {
    id: row.id,
    locale: row.locale,
    key: row.key,
    draftValue: row.draftValue ?? undefined,
    publishedValue: row.publishedValue ?? undefined,
    status: row.status,
    seeded: row.seeded,
    deleted: row.deletedAt !== null,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
  };
}

@Injectable()
export class DrizzleUiMessageAuthoring extends UiMessageAuthoring {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  private async writeRevision(
    row: UiMessageRow,
    action: string,
    value: string | null,
    editedBy?: string,
  ): Promise<void> {
    await this.db.insert(uiMessageRevisions).values({
      messageId: row.id,
      locale: row.locale,
      key: row.key,
      value,
      action,
      editedBy: editedBy ?? null,
    });
  }

  async list(query: UiMessageQuery): Promise<UiMessageView[]> {
    const conditions = [];
    if (query.locale) {
      conditions.push(eq(uiMessages.locale, query.locale));
    }
    if (query.status) {
      conditions.push(eq(uiMessages.status, query.status));
    }
    if (!query.includeDeleted) {
      conditions.push(isNull(uiMessages.deletedAt));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          ilike(uiMessages.key, term),
          ilike(uiMessages.draftValue, term),
          ilike(uiMessages.publishedValue, term),
        ),
      );
    }
    const rows = await this.db
      .select()
      .from(uiMessages)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(uiMessages.key), asc(uiMessages.locale));
    return rows.map(toView);
  }

  async getById(id: string): Promise<UiMessageView | null> {
    const row = await this.findRow(id);
    return row ? toView(row) : null;
  }

  private async findRow(id: string): Promise<UiMessageRow | undefined> {
    const [row] = await this.db.select().from(uiMessages).where(eq(uiMessages.id, id)).limit(1);
    return row;
  }

  async existsKey(locale: string, key: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: uiMessages.id })
      .from(uiMessages)
      .where(and(eq(uiMessages.locale, locale), eq(uiMessages.key, key)))
      .limit(1);
    return Boolean(row);
  }

  async create(data: UiMessageCreateData): Promise<UiMessageView> {
    const [row] = await this.db
      .insert(uiMessages)
      .values({
        locale: data.locale,
        key: data.key,
        draftValue: data.value,
        publishedValue: null,
        status: 'draft',
        seeded: false,
        updatedBy: data.editedBy ?? null,
      })
      .returning();
    const created = row as UiMessageRow;
    await this.writeRevision(created, 'create', data.value, data.editedBy);
    return toView(created);
  }

  async updateDraft(id: string, value: string, editedBy?: string): Promise<UiMessageView | null> {
    const existing = await this.findRow(id);
    if (!existing || existing.deletedAt !== null) {
      return null;
    }
    const [row] = await this.db
      .update(uiMessages)
      .set({
        draftValue: value,
        status: 'draft',
        seeded: false,
        updatedBy: editedBy ?? null,
        updatedAt: new Date(),
      })
      .where(eq(uiMessages.id, id))
      .returning();
    const updated = row as UiMessageRow;
    await this.writeRevision(updated, 'update', value, editedBy);
    return toView(updated);
  }

  async softDelete(id: string, editedBy?: string): Promise<UiMessageView | null> {
    const existing = await this.findRow(id);
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(uiMessages)
      .set({
        deletedAt: new Date(),
        status: 'draft',
        seeded: false,
        updatedBy: editedBy ?? null,
        updatedAt: new Date(),
      })
      .where(eq(uiMessages.id, id))
      .returning();
    const deleted = row as UiMessageRow;
    await this.writeRevision(deleted, 'delete', deleted.draftValue ?? null, editedBy);
    return toView(deleted);
  }

  async restore(id: string, editedBy?: string): Promise<UiMessageView | null> {
    const existing = await this.findRow(id);
    if (!existing || existing.deletedAt === null) {
      return null;
    }
    const [row] = await this.db
      .update(uiMessages)
      .set({
        deletedAt: null,
        status: 'draft',
        seeded: false,
        updatedBy: editedBy ?? null,
        updatedAt: new Date(),
      })
      .where(eq(uiMessages.id, id))
      .returning();
    const restored = row as UiMessageRow;
    await this.writeRevision(restored, 'restore', restored.draftValue ?? null, editedBy);
    return toView(restored);
  }

  async listRevisions(id: string): Promise<UiMessageRevisionView[]> {
    const rows = await this.db
      .select()
      .from(uiMessageRevisions)
      .where(eq(uiMessageRevisions.messageId, id))
      .orderBy(desc(uiMessageRevisions.editedAt));
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      value: row.value ?? undefined,
      editedBy: row.editedBy ?? undefined,
      editedAt: row.editedAt.toISOString(),
    }));
  }

  async restoreRevision(
    id: string,
    revisionId: string,
    editedBy?: string,
  ): Promise<UiMessageView | null> {
    const message = await this.findRow(id);
    if (!message) {
      return null;
    }
    const [revision] = await this.db
      .select()
      .from(uiMessageRevisions)
      .where(and(eq(uiMessageRevisions.id, revisionId), eq(uiMessageRevisions.messageId, id)))
      .limit(1);
    if (!revision) {
      return null;
    }
    const [row] = await this.db
      .update(uiMessages)
      .set({
        draftValue: revision.value,
        status: 'draft',
        seeded: false,
        deletedAt: null,
        updatedBy: editedBy ?? null,
        updatedAt: new Date(),
      })
      .where(eq(uiMessages.id, id))
      .returning();
    const restored = row as UiMessageRow;
    await this.writeRevision(restored, 'restore', revision.value, editedBy);
    return toView(restored);
  }

  async publish(locale: string | undefined): Promise<Record<string, string>> {
    const locales = locale
      ? [locale]
      : (await this.db.selectDistinct({ locale: uiMessages.locale }).from(uiMessages)).map(
          (r) => r.locale,
        );
    const version = Date.now().toString();
    for (const loc of locales) {
      // Promote every live row's draft to published (idempotent for already-published rows).
      await this.db
        .update(uiMessages)
        .set({
          publishedValue: sql`${uiMessages.draftValue}`,
          status: 'published',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(uiMessages.locale, loc),
            isNull(uiMessages.deletedAt),
            isNotNull(uiMessages.draftValue),
          ),
        );
      await this.db
        .insert(i18nVersions)
        .values({ locale: loc, version })
        .onConflictDoUpdate({
          target: i18nVersions.locale,
          set: { version, publishedAt: new Date() },
        });
    }
    const rows = await this.db
      .select({ locale: i18nVersions.locale, version: i18nVersions.version })
      .from(i18nVersions);
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.locale] = row.version;
    }
    return result;
  }
}
