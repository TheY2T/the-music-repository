import { ConflictError } from '@TheY2T/tmr-errors';

export class FaqEntrySlugConflictError extends ConflictError {
  readonly code = 'FAQ_ENTRY_SLUG_CONFLICT';

  constructor(slug: string) {
    super(`A FAQ entry with slug '${slug}' already exists.`, { slug });
  }
}
