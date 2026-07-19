import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { faqEntries } from '../../infrastructure/database/schema';
import { FaqEntryRepository } from '../application/ports/faq-entry-repository.port';
import type { FaqEntryView, FaqEntryWriteData } from '../domain/faq-entry';

type FaqEntryRow = typeof faqEntries.$inferSelect;

function toView(row: FaqEntryRow): FaqEntryView {
  return {
    id: row.id,
    slug: row.slug,
    question: row.question,
    answer: row.answer,
    category: row.category,
    sortOrder: row.sortOrder,
  };
}

@Injectable()
export class DrizzleFaqEntryRepository extends FaqEntryRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findAll(): Promise<FaqEntryView[]> {
    const rows = await this.db
      .select()
      .from(faqEntries)
      .orderBy(asc(faqEntries.category), asc(faqEntries.sortOrder));
    return rows.map(toView);
  }

  async getBySlug(slug: string): Promise<FaqEntryView | null> {
    const [row] = await this.db.select().from(faqEntries).where(eq(faqEntries.slug, slug)).limit(1);
    return row ? toView(row) : null;
  }

  async exists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: faqEntries.id })
      .from(faqEntries)
      .where(eq(faqEntries.slug, slug))
      .limit(1);
    return Boolean(row);
  }

  async create(data: FaqEntryWriteData): Promise<FaqEntryView> {
    const [row] = await this.db
      .insert(faqEntries)
      .values({
        slug: data.slug,
        question: data.question,
        answer: data.answer,
        category: data.category,
        sortOrder: data.sortOrder,
      })
      .returning();
    return toView(row as FaqEntryRow);
  }

  async update(slug: string, data: FaqEntryWriteData): Promise<FaqEntryView> {
    const [row] = await this.db
      .update(faqEntries)
      .set({
        question: data.question,
        answer: data.answer,
        category: data.category,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(faqEntries.slug, slug))
      .returning();
    return toView(row as FaqEntryRow);
  }

  async delete(slug: string): Promise<void> {
    await this.db.delete(faqEntries).where(eq(faqEntries.slug, slug));
  }
}
