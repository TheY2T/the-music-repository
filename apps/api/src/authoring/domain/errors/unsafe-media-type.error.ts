import { ValidationError } from '@TheY2T/tmr-errors';

/**
 * The requested media type is rejected for safety → 400 problem+json. SVG can embed scripts, so the CMS
 * declines it (the catalogue has no SVG upload need); raster images/audio/PDF/alphaTex are allowed.
 */
export class UnsafeMediaTypeError extends ValidationError {
  readonly code = 'UNSAFE_MEDIA_TYPE';

  constructor(mime: string) {
    super(`The media type '${mime}' is not allowed.`, { mime });
  }
}
