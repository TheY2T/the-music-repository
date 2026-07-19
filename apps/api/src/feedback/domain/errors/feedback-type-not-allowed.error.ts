import { ValidationError } from '@TheY2T/tmr-errors';
import type { FeedbackType } from '../feedback-submission';

/** Raised when a submission uses a type whose gating flag is disabled (e.g. `bug` with bugs off). */
export class FeedbackTypeNotAllowedError extends ValidationError {
  readonly code = 'FEEDBACK_TYPE_NOT_ALLOWED';

  constructor(type: FeedbackType) {
    super(`Feedback of type '${type}' is not accepted right now.`, { type });
  }
}
