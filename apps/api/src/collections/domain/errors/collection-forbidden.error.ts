import { ForbiddenError } from '@TheY2T/tmr-errors';

/** The acting user tried to modify a user-created collection they don't own. */
export class CollectionForbiddenError extends ForbiddenError {
  readonly code = 'COLLECTION_FORBIDDEN';

  constructor(slug: string) {
    super(`You do not have permission to modify collection '${slug}'.`, { slug });
  }
}
