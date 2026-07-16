import { NotFoundError } from '@TheY2T/tmr-errors';

/** No revision with this id exists for the content item → 404 problem+json. */
export class RevisionNotFoundError extends NotFoundError {
  readonly code = 'REVISION_NOT_FOUND';

  constructor(revisionId: string) {
    super(`No revision exists with id '${revisionId}'.`, { revisionId });
  }
}
