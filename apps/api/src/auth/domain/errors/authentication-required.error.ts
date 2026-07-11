import { UnauthorizedError } from '@TheY2T/tmr-errors';

/** Raised when a use-case needs an authenticated user but the request is anonymous → 401 problem+json. */
export class AuthenticationRequiredError extends UnauthorizedError {
  readonly code = 'AUTHENTICATION_REQUIRED';

  constructor() {
    super('Authentication is required to perform this action.');
  }
}
