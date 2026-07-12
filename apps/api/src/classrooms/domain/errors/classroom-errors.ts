import { ForbiddenError, NotFoundError } from '@TheY2T/tmr-errors';

export class ClassroomNotFoundError extends NotFoundError {
  readonly code = 'CLASSROOM_NOT_FOUND';
  constructor(id: string) {
    super(`No classroom is accessible with id '${id}'.`, { id });
  }
}

export class InvalidJoinCodeError extends NotFoundError {
  readonly code = 'CLASSROOM_CODE_INVALID';
  constructor(code: string) {
    super(`No classroom exists with join code '${code}'.`, { code });
  }
}

export class NotClassroomOwnerError extends ForbiddenError {
  readonly code = 'CLASSROOM_NOT_OWNER';
  constructor(id: string) {
    super(`Only the classroom owner may perform this action.`, { id });
  }
}
