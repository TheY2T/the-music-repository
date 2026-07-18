import { ConflictError } from '@TheY2T/tmr-errors';

export class LocaleConflictError extends ConflictError {
  readonly code = 'LOCALE_CONFLICT';

  constructor(codeValue: string) {
    super(`A locale '${codeValue}' already exists.`, { locale: codeValue });
  }
}
