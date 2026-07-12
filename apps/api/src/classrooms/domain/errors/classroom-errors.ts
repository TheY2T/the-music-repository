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

export class OwnerCannotLeaveError extends ForbiddenError {
  readonly code = 'CLASSROOM_OWNER_CANNOT_LEAVE';
  constructor(id: string) {
    super(`The owner cannot leave their classroom — archive it instead.`, { id });
  }
}

export class MemberNotFoundError extends NotFoundError {
  readonly code = 'CLASSROOM_MEMBER_NOT_FOUND';
  constructor(memberId: string) {
    super(`No member '${memberId}' is in this classroom.`, { memberId });
  }
}

export class InvalidInvitationError extends NotFoundError {
  readonly code = 'CLASSROOM_INVITATION_INVALID';
  constructor() {
    super(`This invitation is invalid or has already been used.`);
  }
}
