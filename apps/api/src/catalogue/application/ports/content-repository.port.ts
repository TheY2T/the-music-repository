import type { ContentItem } from '../../domain/content-item';

export abstract class ContentRepository {
  abstract getBySlug(slug: string): Promise<ContentItem | null>;
  /** Published items (with taxonomy + media) — used to (re)build the search index. */
  abstract findAllPublished(): Promise<ContentItem[]>;
}
