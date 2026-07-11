import { ConflictError } from '@TheY2T/tmr-errors';

/** A content item with this slug already exists → 409 problem+json. */
export class ContentSlugConflictError extends ConflictError {
  readonly code = 'CONTENT_SLUG_CONFLICT';

  constructor(slug: string) {
    super(`A content item with slug '${slug}' already exists.`, { slug });
  }
}
