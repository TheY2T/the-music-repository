import type {
  Collection,
  CollectionItemWriteData,
  CollectionSectionWriteData,
  CollectionWriteData,
} from '../../domain/collection';

/**
 * CollectionRepository (DDD) — persist/read rich, chaptered groupings of content. One port handles
 * read + write (collections are a single aggregate). `findAllPublished` is consumed by the progress
 * module and must keep returning every published collection with its flattened `itemSlugs`.
 */
export abstract class CollectionRepository {
  abstract getBySlug(slug: string): Promise<Collection | null>; // any status
  abstract findAllPublished(): Promise<Collection[]>;
  /** Published, non-private collections that contain the given content slug (for cross-linking). */
  abstract findPublishedContaining(contentSlug: string): Promise<Collection[]>;
  abstract listAll(): Promise<Collection[]>;
  /** Collections owned by a user (curationType='user'), most-recently-updated first. */
  abstract listByOwner(userId: string): Promise<Collection[]>;
  abstract exists(slug: string): Promise<boolean>;
  abstract create(data: CollectionWriteData): Promise<void>;
  abstract update(slug: string, data: CollectionWriteData): Promise<void>;
  abstract setStatus(slug: string, status: string): Promise<void>;
  abstract delete(slug: string): Promise<void>;
  /** Replace the collection's chapters (drops items' section links when a section disappears). */
  abstract setSections(slug: string, sections: CollectionSectionWriteData[]): Promise<void>;
  /**
   * Replace the ordered items (with per-item notes/focus + section link). Unknown content slugs and
   * duplicates are skipped; `sectionIndex` resolves to the section at that 0-based position.
   */
  abstract setItems(slug: string, items: CollectionItemWriteData[]): Promise<void>;
  /** Bump the open/play counter (best-effort popularity signal). */
  abstract incrementPopularity(slug: string): Promise<void>;
}
