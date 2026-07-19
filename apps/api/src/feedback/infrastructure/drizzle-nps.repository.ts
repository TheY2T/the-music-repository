import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { npsPromptState, npsResponses, user } from '../../infrastructure/database/schema';
import { NpsRepository, type NpsResponsePage } from '../application/ports/nps-repository.port';
import { type NpsPromptState, type NpsScorePoint, npsBucket } from '../domain/nps';

@Injectable()
export class DrizzleNpsRepository extends NpsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async getAccountCreatedAt(userId: string): Promise<Date | null> {
    const [row] = await this.db
      .select({ createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return row?.createdAt ?? null;
  }

  async getPromptState(userId: string): Promise<NpsPromptState | null> {
    const [row] = await this.db
      .select()
      .from(npsPromptState)
      .where(eq(npsPromptState.userId, userId))
      .limit(1);
    if (!row) return null;
    return {
      lastShownAt: row.lastShownAt,
      lastDismissedAt: row.lastDismissedAt,
      lastRespondedAt: row.lastRespondedAt,
    };
  }

  async markShown(userId: string): Promise<void> {
    const now = new Date();
    await this.db
      .insert(npsPromptState)
      .values({ userId, lastShownAt: now })
      .onConflictDoUpdate({ target: npsPromptState.userId, set: { lastShownAt: now } });
  }

  async markDismissed(userId: string): Promise<void> {
    const now = new Date();
    await this.db
      .insert(npsPromptState)
      .values({ userId, lastDismissedAt: now })
      .onConflictDoUpdate({ target: npsPromptState.userId, set: { lastDismissedAt: now } });
  }

  async recordResponse(
    userId: string,
    score: number,
    comment: string | null,
    source: string | null,
  ): Promise<void> {
    const now = new Date();
    await this.db.insert(npsResponses).values({ userId, score, comment, source });
    await this.db
      .insert(npsPromptState)
      .values({ userId, lastRespondedAt: now })
      .onConflictDoUpdate({ target: npsPromptState.userId, set: { lastRespondedAt: now } });
  }

  async listResponses(page: number, pageSize: number): Promise<NpsResponsePage> {
    const [totals] = await this.db.select({ total: count() }).from(npsResponses);
    const rows = await this.db
      .select({ response: npsResponses, email: user.email })
      .from(npsResponses)
      .leftJoin(user, eq(npsResponses.userId, user.id))
      .orderBy(desc(npsResponses.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    return {
      items: rows.map((r) => ({
        id: r.response.id,
        userId: r.response.userId,
        userEmail: r.email,
        score: r.response.score,
        bucket: npsBucket(r.response.score),
        comment: r.response.comment,
        source: r.response.source,
        createdAt: r.response.createdAt.toISOString(),
      })),
      total: Number(totals?.total ?? 0),
    };
  }

  async scorePointsInRange(from: Date | null, to: Date | null): Promise<NpsScorePoint[]> {
    const conditions = [];
    if (from) conditions.push(gte(npsResponses.createdAt, from));
    if (to) conditions.push(lte(npsResponses.createdAt, to));
    const where = conditions.length ? and(...conditions) : undefined;
    const rows = await this.db
      .select({ score: npsResponses.score, createdAt: npsResponses.createdAt })
      .from(npsResponses)
      .where(where)
      .orderBy(npsResponses.createdAt);
    return rows.map((r) => ({ score: r.score, createdAt: r.createdAt.toISOString() }));
  }
}
