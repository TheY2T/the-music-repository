import { Injectable } from '@nestjs/common';
import { CollectionRepository } from '../../../collections/application/ports/collection-repository.port';
import { currentStreakDays, type ProgressSummaryView } from '../../domain/progress';
import { ProgressRepository } from '../ports/progress-repository.port';

@Injectable()
export class GetProgressSummaryUseCase {
  constructor(
    private readonly progress: ProgressRepository,
    private readonly collections: CollectionRepository,
  ) {}

  async execute(userId: string): Promise<ProgressSummaryView> {
    const [completedSlugs, totalPracticeMinutes, dateKeys, publishedCollections] =
      await Promise.all([
        this.progress.listCompletedSlugs(userId),
        this.progress.totalPracticeMinutes(userId),
        this.progress.activityDateKeys(userId),
        this.collections.findAllPublished(),
      ]);

    const completed = new Set(completedSlugs);
    return {
      completedCount: completedSlugs.length,
      completedSlugs,
      currentStreakDays: currentStreakDays(dateKeys, new Date()),
      totalPracticeMinutes,
      collections: publishedCollections.map((collection) => ({
        slug: collection.slug,
        title: collection.title,
        totalItems: collection.itemSlugs.length,
        completedItems: collection.itemSlugs.filter((slug) => completed.has(slug)).length,
      })),
    };
  }
}
