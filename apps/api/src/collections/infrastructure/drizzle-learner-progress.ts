import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { contentItems, contentProgress } from '../../infrastructure/database/schema';
import { LearnerProgress } from '../application/ports/learner-progress.port';

@Injectable()
export class DrizzleLearnerProgress extends LearnerProgress {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async completedSlugs(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ slug: contentItems.slug })
      .from(contentProgress)
      .innerJoin(contentItems, eq(contentProgress.contentId, contentItems.id))
      .where(eq(contentProgress.userId, userId));
    return rows.map((r) => r.slug);
  }
}
