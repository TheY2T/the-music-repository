import { Injectable } from '@nestjs/common';
import type { CollectionProgressDetailView } from '../../domain/collection';
import { CollectionNotFoundError } from '../../domain/errors/collection-not-found.error';
import { CollectionDetailAssembler } from '../collection-detail.assembler';
import { CollectionRatings } from '../ports/collection-ratings.port';
import { CollectionRepository } from '../ports/collection-repository.port';
import { LearnerProgress } from '../ports/learner-progress.port';

/**
 * Public + auth-aware: a published collection with per-item completion flags, overall percent, and
 * the next incomplete item ("resume"). The viewer id comes from the optional session.
 */
@Injectable()
export class GetCollectionWithProgressUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly assembler: CollectionDetailAssembler,
    private readonly ratings: CollectionRatings,
    private readonly progress: LearnerProgress,
  ) {}

  async execute(slug: string, userId: string | null): Promise<CollectionProgressDetailView> {
    const collection = await this.repository.getBySlug(slug);
    if (!collection || collection.status !== 'published' || collection.visibility === 'private') {
      throw new CollectionNotFoundError(slug);
    }
    const [rating, completedSlugs] = await Promise.all([
      this.ratings.getAggregate([slug]).then((m) => m.get(slug)),
      userId ? this.progress.completedSlugs(userId) : Promise.resolve<string[]>([]),
    ]);
    return this.assembler.assembleWithProgress(collection, {
      publishedOnly: true,
      completedSlugs,
      rating,
    });
  }
}
