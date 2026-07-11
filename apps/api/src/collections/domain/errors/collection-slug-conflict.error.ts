import { ConflictError } from '@TheY2T/tmr-errors';

export class CollectionSlugConflictError extends ConflictError {
  readonly code = 'COLLECTION_SLUG_CONFLICT';

  constructor(slug: string) {
    super(`A collection with slug '${slug}' already exists.`, { slug });
  }
}
