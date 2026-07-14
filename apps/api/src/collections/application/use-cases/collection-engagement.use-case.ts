import { Injectable } from '@nestjs/common';
import {
  type CollectionRatingAggregate,
  type CollectionSummaryView,
  toCollectionSummaryView,
} from '../../domain/collection';
import { CollectionInvalidRatingError } from '../../domain/errors/collection-invalid-rating.error';
import { CollectionBookmarks } from '../ports/collection-bookmarks.port';
import { CollectionRatings } from '../ports/collection-ratings.port';
import { CollectionRepository } from '../ports/collection-repository.port';

@Injectable()
export class AddCollectionBookmarkUseCase {
  constructor(private readonly bookmarks: CollectionBookmarks) {}

  execute(userId: string, slug: string): Promise<void> {
    return this.bookmarks.add(userId, slug);
  }
}

@Injectable()
export class RemoveCollectionBookmarkUseCase {
  constructor(private readonly bookmarks: CollectionBookmarks) {}

  execute(userId: string, slug: string): Promise<void> {
    return this.bookmarks.remove(userId, slug);
  }
}

@Injectable()
export class ListCollectionBookmarksUseCase {
  constructor(
    private readonly bookmarks: CollectionBookmarks,
    private readonly repository: CollectionRepository,
    private readonly ratings: CollectionRatings,
  ) {}

  /** The user's saved collections as summaries (skipping any that were since deleted). */
  async execute(userId: string): Promise<CollectionSummaryView[]> {
    const slugs = await this.bookmarks.listSlugs(userId);
    if (!slugs.length) {
      return [];
    }
    const aggregate = await this.ratings.getAggregate(slugs);
    const summaries: CollectionSummaryView[] = [];
    for (const slug of slugs) {
      const collection = await this.repository.getBySlug(slug);
      if (collection) {
        summaries.push(toCollectionSummaryView(collection, aggregate.get(slug)));
      }
    }
    return summaries;
  }
}

export interface RateCollectionResult {
  average?: number;
  count: number;
  yourRating: number;
}

@Injectable()
export class RateCollectionUseCase {
  constructor(private readonly ratings: CollectionRatings) {}

  async execute(userId: string, slug: string, value: number): Promise<RateCollectionResult> {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new CollectionInvalidRatingError(value);
    }
    await this.ratings.rate(userId, slug, value);
    const aggregate: CollectionRatingAggregate = (await this.ratings.getAggregate([slug])).get(
      slug,
    ) ?? { average: value, count: 1 };
    return {
      average: aggregate.average ?? undefined,
      count: aggregate.count,
      yourRating: value,
    };
  }
}

@Injectable()
export class RecordCollectionOpenUseCase {
  constructor(private readonly repository: CollectionRepository) {}

  /** Best-effort popularity bump; silently no-ops for unknown/unpublished collections. */
  async execute(slug: string): Promise<void> {
    const collection = await this.repository.getBySlug(slug);
    if (collection && collection.status === 'published') {
      await this.repository.incrementPopularity(slug);
    }
  }
}
