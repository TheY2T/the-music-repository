import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { reviewCards, reviewLog } from '../../infrastructure/database/schema';
import {
  type DeckCount,
  ReviewRepository,
  type StoredCard,
} from '../application/ports/review-repository.port';
import type { ReviewState } from '../domain/sm2';
import { toDateKey } from '../domain/streak';

@Injectable()
export class DrizzleReviewRepository extends ReviewRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async get(userId: string, deck: string, card: string): Promise<ReviewState | null> {
    const [row] = await this.db
      .select()
      .from(reviewCards)
      .where(
        and(eq(reviewCards.userId, userId), eq(reviewCards.deck, deck), eq(reviewCards.card, card)),
      )
      .limit(1);
    if (!row) {
      return null;
    }
    return {
      easeFactor: row.easeFactor,
      intervalDays: row.intervalDays,
      repetitions: row.repetitions,
      dueAt: row.dueAt,
    };
  }

  async save(userId: string, deck: string, card: string, state: ReviewState): Promise<void> {
    await this.db
      .insert(reviewCards)
      .values({
        userId,
        deck,
        card,
        easeFactor: state.easeFactor,
        intervalDays: state.intervalDays,
        repetitions: state.repetitions,
        dueAt: state.dueAt,
        lastReviewedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [reviewCards.userId, reviewCards.deck, reviewCards.card],
        set: {
          easeFactor: state.easeFactor,
          intervalDays: state.intervalDays,
          repetitions: state.repetitions,
          dueAt: state.dueAt,
          lastReviewedAt: new Date(),
        },
      });
  }

  async listDeck(userId: string, deck: string): Promise<StoredCard[]> {
    const rows = await this.db
      .select()
      .from(reviewCards)
      .where(and(eq(reviewCards.userId, userId), eq(reviewCards.deck, deck)));
    return rows.map((row) => ({
      card: row.card,
      easeFactor: row.easeFactor,
      intervalDays: row.intervalDays,
      repetitions: row.repetitions,
      dueAt: row.dueAt,
    }));
  }

  async summary(userId: string, now: Date): Promise<DeckCount[]> {
    const rows = await this.db
      .select({
        deck: reviewCards.deck,
        learned: sql<number>`count(*)`,
        due: sql<number>`count(*) filter (where ${lte(reviewCards.dueAt, now)})`,
      })
      .from(reviewCards)
      .where(eq(reviewCards.userId, userId))
      .groupBy(reviewCards.deck);
    return rows.map((r) => ({ deck: r.deck, learned: Number(r.learned), due: Number(r.due) }));
  }

  async recordReview(userId: string, at: Date): Promise<void> {
    await this.db.insert(reviewLog).values({ userId, reviewedAt: at });
  }

  async activityDateKeys(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ at: reviewLog.reviewedAt })
      .from(reviewLog)
      .where(eq(reviewLog.userId, userId));
    return [...new Set(rows.map((r) => toDateKey(r.at)))];
  }

  async reviewsToday(userId: string, now: Date): Promise<number> {
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(reviewLog)
      .where(and(eq(reviewLog.userId, userId), gte(reviewLog.reviewedAt, startOfDay)));
    return Number(row?.count ?? 0);
  }
}
