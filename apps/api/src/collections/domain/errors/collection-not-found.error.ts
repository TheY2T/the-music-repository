import { NotFoundError } from '@TheY2T/tmr-errors';

export class CollectionNotFoundError extends NotFoundError {
  readonly code = 'COLLECTION_NOT_FOUND';

  constructor(slug: string) {
    super(`No collection exists with slug '${slug}'.`, { slug });
  }
}
