import { NotFoundError } from '@TheY2T/tmr-errors';

/** Reference domain error — pure, framework-free; the filter maps it to a 404 problem+json. */
export class TrackNotFoundError extends NotFoundError {
  readonly code = 'TRACK_NOT_FOUND';

  constructor(trackId: string) {
    super(`No track exists with id '${trackId}'.`, { trackId });
  }
}
