import { ConflictError, ForbiddenError, NotFoundError } from '@TheY2T/tmr-errors';

export class FeatureFlagNotFoundError extends NotFoundError {
  readonly code = 'FEATURE_FLAG_NOT_FOUND';
  constructor(id: string) {
    super(`No feature flag exists with id '${id}'.`, { id });
  }
}

export class FeatureFlagKeyConflictError extends ConflictError {
  readonly code = 'FEATURE_FLAG_KEY_CONFLICT';
  constructor(key: string) {
    super(`A feature flag already exists with key '${key}'.`, { key });
  }
}

export class FlagEnvironmentNotFoundError extends NotFoundError {
  readonly code = 'FLAG_ENVIRONMENT_NOT_FOUND';
  constructor(id: string) {
    super(`No environment exists with id '${id}'.`, { id });
  }
}

export class FlagEnvironmentKeyConflictError extends ConflictError {
  readonly code = 'FLAG_ENVIRONMENT_KEY_CONFLICT';
  constructor(key: string) {
    super(`An environment already exists with key '${key}'.`, { key });
  }
}

/**
 * Self-lockout guardrail: refuse to disable a flag that gates the admin surface (`admin.feature-flags`,
 * `admin.cms`) in the environment this deployment resolves against — otherwise an admin could turn off the
 * very screen they are using. Recovery for other environments is unaffected.
 */
export class FlagSelfLockoutError extends ForbiddenError {
  readonly code = 'FLAG_SELF_LOCKOUT';
  constructor(key: string, environmentKey: string) {
    super(
      `Refusing to disable '${key}' in the '${environmentKey}' environment — it gates this admin ` +
        'surface and disabling it here would lock you out. Change it in another environment, or via a ' +
        'reseed/SQL if intended.',
      { key, environmentKey },
    );
  }
}
