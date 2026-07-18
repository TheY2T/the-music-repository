import { NotFoundError } from '@TheY2T/tmr-errors';

export class UiMessageNotFoundError extends NotFoundError {
  readonly code = 'UI_MESSAGE_NOT_FOUND';

  constructor(id: string) {
    super(`No message string exists with id '${id}'.`, { id });
  }
}
