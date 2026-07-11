import { Injectable } from '@nestjs/common';
import { ContentRepository } from '../../../catalogue/application/ports/content-repository.port';
import {
  type ContentSummaryView,
  toContentSummaryView,
} from '../../../catalogue/domain/content-item';
import { FavoritesRepository } from '../ports/favorites-repository.port';

@Injectable()
export class ListFavoritesUseCase {
  constructor(
    private readonly favorites: FavoritesRepository,
    private readonly content: ContentRepository,
  ) {}

  /** Favorited items, most-recent first. Unpublished favorites are hidden (consistent with catalogue). */
  async execute(userId: string): Promise<ContentSummaryView[]> {
    const slugs = await this.favorites.listSlugs(userId);
    const items = await Promise.all(slugs.map((slug) => this.content.getBySlug(slug)));
    const views: ContentSummaryView[] = [];
    for (const item of items) {
      if (item && item.status === 'published') {
        views.push(toContentSummaryView(item));
      }
    }
    return views;
  }
}
