import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { achievements } from '../../infrastructure/database/schema';
import { LearnerAchievements } from '../application/ports/learner-achievements.port';
import type { Achievements, StoredAchievements } from '../domain/achievements';

@Injectable()
export class DrizzleLearnerAchievements extends LearnerAchievements {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async get(userId: string): Promise<StoredAchievements | null> {
    const [row] = await this.db.select().from(achievements).where(eq(achievements.userId, userId));
    if (!row) return null;
    return { ...row.data, updatedAt: row.updatedAt };
  }

  async put(userId: string, data: Achievements): Promise<StoredAchievements> {
    const updatedAt = new Date();
    await this.db
      .insert(achievements)
      .values({ userId, data, updatedAt })
      .onConflictDoUpdate({ target: achievements.userId, set: { data, updatedAt } });
    return { ...data, updatedAt };
  }
}
