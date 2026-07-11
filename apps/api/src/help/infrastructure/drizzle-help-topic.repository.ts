import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { helpTopics } from '../../infrastructure/database/schema';
import { HelpTopicRepository } from '../application/ports/help-topic-repository.port';
import type { HelpTopicView, HelpTopicWriteData } from '../domain/help-topic';

type HelpTopicRow = typeof helpTopics.$inferSelect;

function toView(row: HelpTopicRow): HelpTopicView {
  return {
    slug: row.slug,
    term: row.term,
    body: row.body,
    linkSlug: row.linkSlug ?? undefined,
  };
}

@Injectable()
export class DrizzleHelpTopicRepository extends HelpTopicRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findAll(): Promise<HelpTopicView[]> {
    const rows = await this.db.select().from(helpTopics).orderBy(asc(helpTopics.term));
    return rows.map(toView);
  }

  async getBySlug(slug: string): Promise<HelpTopicView | null> {
    const [row] = await this.db.select().from(helpTopics).where(eq(helpTopics.slug, slug)).limit(1);
    return row ? toView(row) : null;
  }

  async exists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: helpTopics.id })
      .from(helpTopics)
      .where(eq(helpTopics.slug, slug))
      .limit(1);
    return Boolean(row);
  }

  async create(data: HelpTopicWriteData): Promise<HelpTopicView> {
    const [row] = await this.db
      .insert(helpTopics)
      .values({
        slug: data.slug,
        term: data.term,
        body: data.body,
        linkSlug: data.linkSlug ?? null,
      })
      .returning();
    return toView(row as HelpTopicRow);
  }

  async update(slug: string, data: HelpTopicWriteData): Promise<HelpTopicView> {
    const [row] = await this.db
      .update(helpTopics)
      .set({
        term: data.term,
        body: data.body,
        linkSlug: data.linkSlug ?? null,
        updatedAt: new Date(),
      })
      .where(eq(helpTopics.slug, slug))
      .returning();
    return toView(row as HelpTopicRow);
  }

  async delete(slug: string): Promise<void> {
    await this.db.delete(helpTopics).where(eq(helpTopics.slug, slug));
  }
}
