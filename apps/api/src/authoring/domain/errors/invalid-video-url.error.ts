import { UnprocessableError } from '@TheY2T/tmr-errors';

/** The submitted video URL carries no recognizable YouTube video id → 422 problem+json. */
export class InvalidVideoUrlError extends UnprocessableError {
  readonly code = 'INVALID_VIDEO_URL';

  constructor(url: string) {
    super(`'${url}' is not a recognizable YouTube video URL.`, { url });
  }
}
