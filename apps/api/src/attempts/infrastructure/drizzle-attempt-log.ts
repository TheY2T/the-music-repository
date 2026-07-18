import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { drillAttempts } from '../../infrastructure/database/schema';
import { toDateKey } from '../../reviews/domain/streak';
import {
  AttemptLog,
  type AttemptRecord,
  type StoredAttempt,
} from '../application/ports/attempt-log';

@Injectable()
export class DrizzleAttemptLog extends AttemptLog {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async record(userId: string, at: Date, attempt: AttemptRecord): Promise<void> {
    await this.db.insert(drillAttempts).values({
      userId,
      deck: attempt.deck,
      card: attempt.card,
      modality: attempt.modality,
      accuracy: attempt.accuracy,
      correct: attempt.correct,
      responseMs: attempt.responseMs,
      createdAt: at,
    });
  }

  async listDeck(userId: string, deck: string): Promise<StoredAttempt[]> {
    const rows = await this.db
      .select()
      .from(drillAttempts)
      .where(and(eq(drillAttempts.userId, userId), eq(drillAttempts.deck, deck)))
      .orderBy(asc(drillAttempts.createdAt));
    return rows.map(toStored);
  }

  async listAll(userId: string): Promise<StoredAttempt[]> {
    const rows = await this.db
      .select()
      .from(drillAttempts)
      .where(eq(drillAttempts.userId, userId))
      .orderBy(asc(drillAttempts.createdAt));
    return rows.map(toStored);
  }

  async activityDateKeys(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ at: drillAttempts.createdAt })
      .from(drillAttempts)
      .where(eq(drillAttempts.userId, userId));
    return [...new Set(rows.map((r) => toDateKey(r.at)))];
  }

  async attemptsToday(userId: string, now: Date): Promise<number> {
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(drillAttempts)
      .where(and(eq(drillAttempts.userId, userId), gte(drillAttempts.createdAt, startOfDay)));
    return Number(row?.count ?? 0);
  }
}

function toStored(row: typeof drillAttempts.$inferSelect): StoredAttempt {
  return { deck: row.deck, accuracy: row.accuracy, correct: row.correct, createdAt: row.createdAt };
}
