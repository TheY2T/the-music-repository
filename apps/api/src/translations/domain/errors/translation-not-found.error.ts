import { NotFoundError } from '@TheY2T/tmr-errors';

export class TranslationNotFoundError extends NotFoundError {
  readonly code = 'TRANSLATION_NOT_FOUND';

  constructor(id: string) {
    super(`No content translation exists with id '${id}'.`, { id });
  }
}
