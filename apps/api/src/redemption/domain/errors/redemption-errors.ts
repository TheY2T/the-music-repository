import { ForbiddenError, NotFoundError } from '@TheY2T/tmr-errors';

/** The redeem code doesn't exist or has no uses left. */
export class InvalidRedeemCodeError extends NotFoundError {
  readonly code = 'INVALID_REDEEM_CODE';

  constructor(value: string) {
    super(`The code '${value}' is invalid or has already been used.`, { value });
  }
}

/** Only staff (admin/editor) may mint redeem codes. */
export class NotStaffError extends ForbiddenError {
  readonly code = 'NOT_STAFF';

  constructor() {
    super('Only staff can create redeem codes.');
  }
}
