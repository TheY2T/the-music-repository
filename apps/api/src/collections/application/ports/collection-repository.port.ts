import type { Collection, CollectionWriteData } from '../../domain/collection';

/**
 * CollectionRepository (DDD) — the learning-structure requirement: persist/read ordered groupings of
 * content. One port handles read + write (collections are a simple aggregate); the public controller
 * uses the reads, the admin controller the writes.
 */
export abstract class CollectionRepository {
  abstract getBySlug(slug: string): Promise<Collection | null>; // any status
  abstract findAllPublished(): Promise<Collection[]>;
  abstract listAll(): Promise<Collection[]>;
  abstract exists(slug: string): Promise<boolean>;
  abstract create(data: CollectionWriteData): Promise<void>;
  abstract update(slug: string, data: CollectionWriteData): Promise<void>;
  abstract setStatus(slug: string, status: string): Promise<void>;
  abstract delete(slug: string): Promise<void>;
  /** Replace the ordered items with the given content slugs (unknown slugs are skipped). */
  abstract setItems(slug: string, contentSlugs: string[]): Promise<void>;
}
