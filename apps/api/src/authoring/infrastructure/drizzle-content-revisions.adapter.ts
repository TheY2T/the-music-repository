import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { ContentNotFoundError } from '../../catalogue/domain/errors/content-not-found.error';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { contentItems, contentRevisions } from '../../infrastructure/database/schema';
import {
  type ContentRevisionRow,
  ContentRevisions,
} from '../application/ports/content-revisions.port';
import { RevisionNotFoundError } from '../domain/errors/revision-not-found.error';

@Injectable()
export class DrizzleContentRevisions extends ContentRevisions {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async snapshot(slug: string, authorId: string | null): Promise<void> {
    const [item] = await this.db
      .select()
      .from(contentItems)
      .where(eq(contentItems.slug, slug))
      .limit(1);
    if (!item) {
      return;
    }
    await this.db.insert(contentRevisions).values({
      contentId: item.id,
      title: item.title,
      summary: item.summary,
      bodyMdx: item.bodyMdx,
      bodyDoc: item.bodyDoc,
      details: item.details,
      authorId,
    });
  }

  async list(slug: string): Promise<ContentRevisionRow[]> {
    const rows = await this.db
      .select({
        id: contentRevisions.id,
        title: contentRevisions.title,
        authorId: contentRevisions.authorId,
        createdAt: contentRevisions.createdAt,
      })
      .from(contentRevisions)
      .innerJoin(contentItems, eq(contentRevisions.contentId, contentItems.id))
      .where(eq(contentItems.slug, slug))
      .orderBy(desc(contentRevisions.createdAt));
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      authorId: r.authorId ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async restore(slug: string, revisionId: string): Promise<void> {
    const [item] = await this.db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(eq(contentItems.slug, slug))
      .limit(1);
    if (!item) {
      throw new ContentNotFoundError(slug);
    }
    const [revision] = await this.db
      .select()
      .from(contentRevisions)
      .where(and(eq(contentRevisions.id, revisionId), eq(contentRevisions.contentId, item.id)))
      .limit(1);
    if (!revision) {
      throw new RevisionNotFoundError(revisionId);
    }
    await this.db
      .update(contentItems)
      .set({
        title: revision.title,
        summary: revision.summary,
        bodyMdx: revision.bodyMdx,
        bodyDoc: revision.bodyDoc,
        details: revision.details,
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, item.id));
  }
}
