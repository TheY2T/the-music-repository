import { UnprocessableError } from '@TheY2T/tmr-errors';

/** A collection rating outside the 1..5 range. */
export class CollectionInvalidRatingError extends UnprocessableError {
  readonly code = 'COLLECTION_INVALID_RATING';

  constructor(value: number) {
    super(`Rating must be an integer from 1 to 5 (got ${value}).`, { value });
  }
}
