import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { ContentNotFoundError } from '../../catalogue/domain/errors/content-not-found.error';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import {
  contentItems,
  contentProgress,
  practiceSessions,
} from '../../infrastructure/database/schema';
import { ProgressRepository } from '../application/ports/progress-repository.port';
import { toDateKey } from '../domain/progress';

@Injectable()
export class DrizzleProgressRepository extends ProgressRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async markComplete(userId: string, slug: string): Promise<void> {
    const contentId = await this.contentIdBySlug(slug);
    if (!contentId) {
      throw new ContentNotFoundError(slug);
    }
    await this.db.insert(contentProgress).values({ userId, contentId }).onConflictDoNothing();
  }

  async markIncomplete(userId: string, slug: string): Promise<void> {
    const contentId = await this.contentIdBySlug(slug);
    if (!contentId) {
      return;
    }
    await this.db
      .delete(contentProgress)
      .where(and(eq(contentProgress.userId, userId), eq(contentProgress.contentId, contentId)));
  }

  async listCompletedSlugs(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ slug: contentItems.slug })
      .from(contentProgress)
      .innerJoin(contentItems, eq(contentProgress.contentId, contentItems.id))
      .where(eq(contentProgress.userId, userId));
    return rows.map((r) => r.slug);
  }

  async logPractice(userId: string, contentSlug: string | null, minutes: number): Promise<void> {
    const contentId = contentSlug ? await this.contentIdBySlug(contentSlug) : null;
    await this.db.insert(practiceSessions).values({ userId, contentId, minutes });
  }

  async totalPracticeMinutes(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`coalesce(sum(${practiceSessions.minutes}), 0)` })
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, userId));
    return Number(row?.total ?? 0);
  }

  async activityDateKeys(userId: string): Promise<string[]> {
    const [completions, sessions] = await Promise.all([
      this.db
        .select({ at: contentProgress.completedAt })
        .from(contentProgress)
        .where(eq(contentProgress.userId, userId)),
      this.db
        .select({ at: practiceSessions.createdAt })
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, userId)),
    ]);
    const keys = new Set<string>();
    for (const row of [...completions, ...sessions]) {
      keys.add(toDateKey(row.at));
    }
    return [...keys];
  }

  private async contentIdBySlug(slug: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(eq(contentItems.slug, slug))
      .limit(1);
    return row?.id ?? null;
  }
}
