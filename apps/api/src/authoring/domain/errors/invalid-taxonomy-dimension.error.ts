import { ValidationError } from '@TheY2T/tmr-errors';

/** Unknown taxonomy dimension (not genres/instruments/topics/tags) → 400 problem+json. */
export class InvalidTaxonomyDimensionError extends ValidationError {
  readonly code = 'INVALID_TAXONOMY_DIMENSION';

  constructor(dimension: string) {
    super(`Unknown taxonomy dimension '${dimension}'.`, { dimension });
  }
}
