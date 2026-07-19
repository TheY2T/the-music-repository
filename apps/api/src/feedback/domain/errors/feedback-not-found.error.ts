import { NotFoundError } from '@TheY2T/tmr-errors';

export class FeedbackNotFoundError extends NotFoundError {
  readonly code = 'FEEDBACK_NOT_FOUND';

  constructor(id: string) {
    super(`No feedback submission exists with id '${id}'.`, { id });
  }
}
