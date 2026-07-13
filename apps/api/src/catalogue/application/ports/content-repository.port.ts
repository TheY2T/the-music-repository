import type { ContentItem } from '../../domain/content-item';

export abstract class ContentRepository {
  abstract getBySlug(slug: string): Promise<ContentItem | null>;
  /** Published items (with taxonomy + media) — used to (re)build the search index. */
  abstract findAllPublished(): Promise<ContentItem[]>;
  /** Published items sharing genre/instrument/topic with `slug`, ranked by overlap (excludes self). */
  abstract findRelated(slug: string, limit: number): Promise<ContentItem[]>;
  /** Published items for the given slugs, in the order requested (skips missing/unpublished). */
  abstract findManyBySlugs(slugs: string[]): Promise<ContentItem[]>;
}
