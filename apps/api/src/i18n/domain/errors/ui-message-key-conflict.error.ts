import { ConflictError } from '@TheY2T/tmr-errors';

export class UiMessageKeyConflictError extends ConflictError {
  readonly code = 'UI_MESSAGE_KEY_CONFLICT';

  constructor(locale: string, key: string) {
    super(`A message already exists for '${key}' in locale '${locale}'.`, { locale, key });
  }
}
