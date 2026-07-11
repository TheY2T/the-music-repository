/**
 * Framework-free error model. The DOMAIN layer imports these (no HTTP, no NestJS). The
 * transport mapping to HTTP status + RFC 9457 problem+json happens only in the presentation
 * filter (see @TheY2T/tmr-nest-platform). `category` decides status; `code` is the stable API contract.
 */
export type ErrorCategory =
  | 'VALIDATION'
  | 'UNPROCESSABLE'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'DEPENDENCY'
  | 'TIMEOUT'
  | 'INTERNAL';

export abstract class DomainError extends Error {
  /** Stable, UPPER_SNAKE_CASE, immutable once shipped — clients branch on this, never the message. */
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  readonly metadata: Record<string, unknown>;

  constructor(message: string, metadata: Record<string, unknown> = {}) {
    super(message);
    this.name = new.target.name;
    this.metadata = metadata;
  }
}

export abstract class ValidationError extends DomainError {
  readonly category = 'VALIDATION' as const;
}
export abstract class UnprocessableError extends DomainError {
  readonly category = 'UNPROCESSABLE' as const;
}
export abstract class UnauthorizedError extends DomainError {
  readonly category = 'UNAUTHORIZED' as const;
}
export abstract class ForbiddenError extends DomainError {
  readonly category = 'FORBIDDEN' as const;
}
export abstract class NotFoundError extends DomainError {
  readonly category = 'NOT_FOUND' as const;
}
export abstract class ConflictError extends DomainError {
  readonly category = 'CONFLICT' as const;
}
export abstract class RateLimitError extends DomainError {
  readonly category = 'RATE_LIMIT' as const;
}
export abstract class DependencyError extends DomainError {
  readonly category = 'DEPENDENCY' as const;
}
export abstract class TimeoutError extends DomainError {
  readonly category = 'TIMEOUT' as const;
}
export abstract class InternalError extends DomainError {
  readonly category = 'INTERNAL' as const;
}
