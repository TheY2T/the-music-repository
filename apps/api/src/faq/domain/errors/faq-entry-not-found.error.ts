import { NotFoundError } from '@TheY2T/tmr-errors';

export class FaqEntryNotFoundError extends NotFoundError {
  readonly code = 'FAQ_ENTRY_NOT_FOUND';

  constructor(slug: string) {
    super(`No FAQ entry exists with slug '${slug}'.`, { slug });
  }
}
