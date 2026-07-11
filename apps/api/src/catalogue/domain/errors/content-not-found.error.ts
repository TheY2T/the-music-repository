import { NotFoundError } from '@TheY2T/tmr-errors';

export class ContentNotFoundError extends NotFoundError {
  readonly code = 'CONTENT_NOT_FOUND';

  constructor(slug: string) {
    super(`No published content exists with slug '${slug}'.`, { slug });
  }
}
